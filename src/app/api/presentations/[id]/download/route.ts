/**
 * Presentation Download API Route
 *
 * Allows users to download generated PowerPoint presentations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prismaClient } from '@/lib/prismaClient';

/**
 * GET /api/presentations/[id]/download
 * Download generated PPTX file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const presentationId = resolvedParams.id;

    // Fetch presentation with webinar info
    const presentation = await prismaClient.presentation.findUnique({
      where: { id: presentationId },
      include: {
        webinar: {
          select: {
            title: true,
            presenter: {
              select: { clerkId: true }
            }
          }
        }
      },
    });

    // Validate presentation exists
    if (!presentation) {
      return NextResponse.json(
        { error: 'Presentation not found' },
        { status: 404 }
      );
    }

    // Verify user owns this presentation
    if (presentation.webinar.presenter.clerkId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to download this presentation' },
        { status: 403 }
      );
    }

    // Check if presentation is completed
    if (presentation.processingStatus !== 'completed') {
      return NextResponse.json(
        {
          error: 'Presentation is not ready yet',
          status: presentation.processingStatus
        },
        { status: 400 }
      );
    }

    // Check if PPTX URL exists
    if (!presentation.pptxUrl) {
      return NextResponse.json(
        { error: 'Presentation file not found' },
        { status: 404 }
      );
    }

    // For MVP: pptxUrl is base64 data URL
    // Extract base64 data from data URL
    const base64Match = presentation.pptxUrl.match(/^data:.*?;base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json(
        { error: 'Invalid presentation file format' },
        { status: 500 }
      );
    }

    const base64Data = base64Match[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate filename
    const filename = `${presentation.webinar.title.replace(/[^a-z0-9]/gi, '_')}_presentation.pptx`;

    // Return PPTX file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download presentation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to download presentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
