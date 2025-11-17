import { NextRequest, NextResponse } from 'next/server';
import { onAuthenticateUser } from '@/action/auth';
import { aiPresenterRegistry } from '@/lib/ai-presenter/presentationController';
import { changeWebinarStatus } from '@/action/webinar';
import { prismaClient } from '@/lib/prismaClient';

/**
 * POST /api/ai-presenter/stop
 * Stop AI-powered webinar presentation
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

    // Verify webinar ownership
    const webinar = await prismaClient.webinar.findUnique({
      where: { id: webinarId },
      select: { presenterId: true },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    if (webinar.presenterId !== user.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get controller from registry
    const controller = aiPresenterRegistry.get(webinarId);

    if (!controller) {
      return NextResponse.json(
        { error: 'No AI presenter running for this webinar' },
        { status: 404 }
      );
    }

    // Stop presentation
    await controller.stop();

    // Unregister controller
    aiPresenterRegistry.unregister(webinarId);

    // Update webinar status to ENDED
    await changeWebinarStatus(webinarId, 'ENDED');

    return NextResponse.json({
      message: 'AI presenter stopped successfully',
      webinarId,
    }, { status: 200 });
  } catch (error) {
    console.error('Error stopping AI presenter:', error);
    return NextResponse.json(
      {
        error: 'Failed to stop AI presenter',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
