import { NextRequest, NextResponse } from 'next/server';
import { onAuthenticateUser } from '@/action/auth';
import { aiPresenterRegistry } from '@/lib/ai-presenter/presentationController';
import { prismaClient } from '@/lib/prismaClient';

/**
 * GET /api/ai-presenter/status?webinarId=xxx
 * Get AI presenter status for a webinar
 */
export async function GET(request: NextRequest) {
  try {
    const user = await onAuthenticateUser();
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const webinarId = searchParams.get('webinarId');

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
      return NextResponse.json({
        running: false,
        status: 'idle',
      }, { status: 200 });
    }

    // Get status from controller
    const status = controller.getStatus();
    const progress = controller.getProgress();

    return NextResponse.json({
      running: true,
      ...status,
      progress,
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting AI presenter status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get AI presenter status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
