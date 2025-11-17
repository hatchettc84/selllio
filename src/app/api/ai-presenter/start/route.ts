import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/lib/prismaClient';
import { onAuthenticateUser } from '@/action/auth';
import { AIPresenterController, aiPresenterRegistry } from '@/lib/ai-presenter/presentationController';
import type { PresentationTimeline } from '@/lib/ai-presenter/types';
import { changeWebinarStatus } from '@/action/webinar';

/**
 * POST /api/ai-presenter/start
 * Start AI-powered webinar presentation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await onAuthenticateUser();
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { webinarId } = body;

    if (!webinarId) {
      return NextResponse.json(
        { error: 'Webinar ID is required' },
        { status: 400 }
      );
    }

    // Check if already running
    if (aiPresenterRegistry.has(webinarId)) {
      return NextResponse.json(
        { error: 'AI presenter already running for this webinar' },
        { status: 409 }
      );
    }

    // Get webinar with presentation and timeline
    const webinar = await prismaClient.webinar.findUnique({
      where: { id: webinarId },
      include: {
        presentations: {
          where: {
            aiPresenterEnabled: true,
          },
          include: {
            aiPresenterTimeline: true,
          },
        },
      },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (webinar.presenterId !== user.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find AI-enabled presentation
    const aiPresentation = webinar.presentations.find(
      (p) => p.aiPresenterEnabled && p.aiPresenterTimeline
    );

    if (!aiPresentation || !aiPresentation.aiPresenterTimeline) {
      return NextResponse.json(
        { error: 'No AI presenter configured for this webinar' },
        { status: 400 }
      );
    }

    // Build timeline object
    const timeline: PresentationTimeline = {
      presentationId: aiPresentation.id,
      webinarId,
      voiceConfig: {
        model: aiPresentation.aiPresenterTimeline.voiceModel as any,
        voice: aiPresentation.aiPresenterTimeline.voiceName as any,
        speed: aiPresentation.aiPresenterTimeline.voiceSpeed,
      },
      totalDuration: aiPresentation.aiPresenterTimeline.totalDuration,
      slides: aiPresentation.aiPresenterTimeline.slides as any,
      ttsTokens: aiPresentation.aiPresenterTimeline.ttsTokens,
      ttsCostCents: aiPresentation.aiPresenterTimeline.ttsCostCents,
    };

    // Get Stream.io credentials from environment
    const streamApiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
    const streamApiSecret = process.env.STREAM_API_SECRET!;

    // TODO: Generate proper stream token for AI presenter
    // For now, we'll use a placeholder
    const streamToken = 'ai-presenter-token';

    // Create AI Presenter Controller
    const controller = new AIPresenterController({
      presentationTimeline: timeline,
      streamApiKey,
      streamApiSecret,
      streamToken,
      channelId: webinarId,
    });

    // Initialize controller
    await controller.initialize();

    // Register controller
    aiPresenterRegistry.register(webinarId, controller);

    // Update webinar status to LIVE
    await changeWebinarStatus(webinarId, 'LIVE');

    // Start presentation
    await controller.start();

    return NextResponse.json({
      message: 'AI presenter started successfully',
      webinarId,
      totalDuration: timeline.totalDuration,
    }, { status: 200 });
  } catch (error) {
    console.error('Error starting AI presenter:', error);
    return NextResponse.json(
      {
        error: 'Failed to start AI presenter',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
