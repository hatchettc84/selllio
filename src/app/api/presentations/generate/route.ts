/**
 * Presentation Generation API Route
 *
 * Handles file upload, document parsing, AI generation, and PPTX creation
 * For MVP: Synchronous processing (30-60 seconds)
 * Phase 2: Will add async job queue for background processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prismaClient } from '@/lib/prismaClient';
import { parseDocument, isSupportedFileType, validateFileSize } from '@/lib/presentations/documentParser';
import { generateSlides, formatSalesInfoForPrompt } from '@/lib/presentations/aiGenerator';
import { createPPTX, THEMES } from '@/lib/presentations/pptxCreator';

// For MVP: Store files in memory/filesystem
// Phase 2: Will add AWS S3 or Vercel Blob storage
const UPLOAD_DIR = '/tmp/selllio-uploads';
const PPTX_DIR = '/tmp/selllio-presentations';

/**
 * POST /api/presentations/generate
 * Upload training material and generate presentation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const webinarId = formData.get('webinarId') as string;
    const themeName = (formData.get('theme') as string) || 'selllio';

    // 3. Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!webinarId) {
      return NextResponse.json(
        { error: 'No webinarId provided' },
        { status: 400 }
      );
    }

    // 4. Validate file type
    const fileExtension = file.name.split('.').pop() || '';
    if (!isSupportedFileType(fileExtension)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${fileExtension}. Supported types: PDF, DOCX, TXT, MD`
        },
        { status: 400 }
      );
    }

    // 5. Validate file size (10MB limit)
    const sizeValidation = validateFileSize(file.size, 10);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: 400 }
      );
    }

    // 6. Verify webinar belongs to user
    const webinar = await prismaClient.webinar.findUnique({
      where: { id: webinarId },
      select: {
        id: true,
        title: true,
        presenterId: true,
        aiAgentId: true,
        presenter: {
          select: { clerkId: true }
        }
      },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    if (webinar.presenter.clerkId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to add presentations to this webinar' },
        { status: 403 }
      );
    }

    // 7. Create presentation record (status: processing)
    const presentation = await prismaClient.presentation.create({
      data: {
        webinarId,
        title: file.name,
        sourceFileType: fileExtension,
        sourceFileSize: file.size,
        processingStatus: 'processing',
        aiModel: 'gpt-4o',
      },
    });

    // 8. Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    try {
      // 9. Parse document
      console.log(`[${presentation.id}] Parsing document...`);
      const parsedDoc = await parseDocument(
        fileBuffer,
        fileExtension,
        { cleanWhitespace: true, maxLength: 50000 } // Limit to ~50k chars for API cost
      );

      if (parsedDoc.error || !parsedDoc.text) {
        throw new Error(parsedDoc.error || 'Failed to parse document');
      }

      console.log(`[${presentation.id}] Parsed ${parsedDoc.metadata.wordCount} words`);

      // 10. Generate slides with AI
      console.log(`[${presentation.id}] Generating slides with AI...`);
      const generationResult = await generateSlides(
        parsedDoc.text,
        webinar.title,
        { slideCount: 10, tone: 'professional' }
      );

      if (!generationResult.slides || generationResult.slides.length === 0) {
        throw new Error('AI failed to generate slides');
      }

      console.log(`[${presentation.id}] Generated ${generationResult.slides.length} slides`);
      console.log(`[${presentation.id}] AI cost: ${generationResult.metadata.costCents} cents`);

      // 11. Create PowerPoint file
      console.log(`[${presentation.id}] Creating PowerPoint...`);
      const theme = THEMES[themeName.toLowerCase()] || THEMES.selllio;
      const pptxBuffer = await createPPTX(
        generationResult.slides,
        webinar.title,
        { theme, companyName: 'Selllio' }
      );

      // 12. For MVP: Store PPTX as base64 in database
      // Phase 2: Upload to S3 and store URL
      const pptxBase64 = pptxBuffer.toString('base64');
      const pptxUrl = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${pptxBase64}`;

      // 13. Store sales info for AI agent enhancement
      const salesInfoText = formatSalesInfoForPrompt(generationResult.salesInfo);

      // 14. Update presentation record (status: completed)
      await prismaClient.presentation.update({
        where: { id: presentation.id },
        data: {
          processingStatus: 'completed',
          extractedText: parsedDoc.text,
          pptxUrl,
          slideCount: generationResult.slides.length,
          aiCostCents: generationResult.metadata.costCents,
          metadata: {
            theme: themeName,
            wordCount: parsedDoc.metadata.wordCount,
            salesInfo: generationResult.salesInfo as any,
            tokensUsed: generationResult.metadata.tokensUsed,
          } as any,
        },
      });

      // 15. Optionally update AI agent prompt with sales info
      if (webinar.aiAgentId) {
        try {
          const aiAgent = await prismaClient.aiAgents.findUnique({
            where: { id: webinar.aiAgentId },
          });

          if (aiAgent) {
            // Append sales info to existing prompt
            const enhancedPrompt = aiAgent.prompt + '\n' + salesInfoText;

            await prismaClient.aiAgents.update({
              where: { id: webinar.aiAgentId },
              data: { prompt: enhancedPrompt },
            });

            console.log(`[${presentation.id}] Updated AI agent prompt`);
          }
        } catch (error) {
          console.error('Failed to update AI agent:', error);
          // Don't fail the request if agent update fails
        }
      }

      console.log(`[${presentation.id}] Presentation generation completed`);

      // 16. Return success response
      return NextResponse.json({
        success: true,
        presentationId: presentation.id,
        slideCount: generationResult.slides.length,
        costCents: generationResult.metadata.costCents,
        downloadUrl: `/api/presentations/${presentation.id}/download`,
        message: 'Presentation generated successfully',
      });

    } catch (error) {
      // Update presentation status to failed
      await prismaClient.presentation.update({
        where: { id: presentation.id },
        data: {
          processingStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      console.error(`[${presentation.id}] Generation failed:`, error);

      return NextResponse.json(
        {
          error: 'Failed to generate presentation',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Presentation generation error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/presentations/generate
 * Get all presentations for user's webinars
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const webinarId = searchParams.get('webinarId');

    // Build query
    const where: any = {};

    if (webinarId) {
      // Verify webinar belongs to user
      const webinar = await prismaClient.webinar.findUnique({
        where: { id: webinarId },
        select: {
          presenter: { select: { clerkId: true } }
        },
      });

      if (!webinar || webinar.presenter.clerkId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      where.webinarId = webinarId;
    } else {
      // Get all presentations for user's webinars
      const userWebinars = await prismaClient.webinar.findMany({
        where: {
          presenter: { clerkId: userId }
        },
        select: { id: true },
      });

      where.webinarId = {
        in: userWebinars.map(w => w.id)
      };
    }

    const presentations = await prismaClient.presentation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        webinarId: true,
        processingStatus: true,
        slideCount: true,
        aiCostCents: true,
        sourceFileSize: true,
        sourceFileType: true,
        createdAt: true,
        errorMessage: true,
      },
    });

    return NextResponse.json({
      presentations,
      count: presentations.length,
    });

  } catch (error) {
    console.error('Get presentations error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
