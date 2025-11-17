import { NextRequest, NextResponse } from 'next/server';
import { prepareAIPresenter } from '@/action/aiPresenter';

/**
 * POST /api/ai-presenter/prepare
 * Prepare AI presenter timeline for a presentation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { presentationId, voiceConfig } = body;

    if (!presentationId) {
      return NextResponse.json(
        { error: 'Presentation ID is required' },
        { status: 400 }
      );
    }

    const result = await prepareAIPresenter(presentationId, voiceConfig);

    if (result.status !== 200) {
      return NextResponse.json(
        { error: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error('Error in /api/ai-presenter/prepare:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
