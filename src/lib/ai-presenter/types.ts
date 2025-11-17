/**
 * AI Presenter Types
 * Defines interfaces and types for the AI-powered webinar presentation system
 */

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type TTSModel = 'tts-1' | 'tts-1-hd';

export interface VoiceConfig {
  model: TTSModel;
  voice: OpenAIVoice;
  speed: number; // 0.25 to 4.0
}

export interface SlideData {
  slideIndex: number;
  title: string;
  content: string;
  speakerNotes?: string;
  imageUrl?: string;
  type?: 'intro' | 'content' | 'cta' | 'conclusion';
}

export interface SlideTimingConfig {
  slideIndex: number;
  audioUrl: string; // URL or path to audio file
  audioBuffer?: Buffer; // Optional audio buffer for processing
  duration: number; // Duration in seconds
  startTime: number; // Start time in presentation (seconds from start)
  pauseAfter?: number; // Optional pause after slide (seconds)
  ctaTrigger?: {
    atSecond: number; // When to trigger CTA (seconds into this slide)
    ctaType: 'BOOK_A_CALL' | 'BUY_NOW';
  };
}

export interface PresentationTimeline {
  presentationId: string;
  webinarId: string;
  voiceConfig: VoiceConfig;
  totalDuration: number; // Total presentation duration in seconds
  slides: SlideTimingConfig[];
  ttsTokens: number;
  ttsCostCents: number;
}

export interface AudioGenerationResult {
  audioBuffer: Buffer;
  duration: number; // Duration in seconds
  tokensUsed: number;
  costCents: number;
}

export interface StreamConfig {
  webinarId: string;
  rtmpUrl: string;
  streamKey: string;
  audioInput: string;
  slideInput: string;
  presentationTimeline: PresentationTimeline;
}

export interface AIPresenterStatus {
  webinarId: string;
  status: 'idle' | 'preparing' | 'streaming' | 'paused' | 'ended' | 'error';
  currentSlideIndex: number;
  totalSlides: number;
  elapsedTime: number; // Seconds
  totalDuration: number; // Seconds
  error?: string;
}

export interface AIPresenterConfig {
  presentationId: string;
  webinarId: string;
  voiceConfig: VoiceConfig;
  autoStart: boolean;
  ctaTimings?: Array<{
    slideIndex: number;
    type: 'BOOK_A_CALL' | 'BUY_NOW';
  }>;
}
