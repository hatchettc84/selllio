/**
 * Slide Sequencer
 * Generates presentation timeline with audio narration and timing information
 */

import { generateVoiceNarration, prepareTextForTTS } from './ttsGenerator';
import type {
  SlideData,
  SlideTimingConfig,
  PresentationTimeline,
  VoiceConfig,
  AudioGenerationResult,
} from './types';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Generate a complete presentation timeline with audio narration
 */
export async function generatePresentationTimeline(
  presentationId: string,
  webinarId: string,
  slides: SlideData[],
  voiceConfig: VoiceConfig,
  options?: {
    pauseBetweenSlides?: number; // Seconds to pause between slides (default: 1)
    ctaTimings?: Array<{ slideIndex: number; type: 'BOOK_A_CALL' | 'BUY_NOW' }>;
  }
): Promise<PresentationTimeline> {
  try {
    const slideTimings: SlideTimingConfig[] = [];
    let currentTime = 0;
    let totalTokens = 0;
    let totalCostCents = 0;

    const pauseBetweenSlides = options?.pauseBetweenSlides ?? 1;

    // Create audio storage directory
    const audioDir = join(process.cwd(), 'public', 'ai-presenter', presentationId);
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    // Generate audio for each slide
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];

      // Determine what text to use for narration
      const narrationText = prepareNarrationText(slide);

      // Generate audio narration
      const audioResult: AudioGenerationResult = await generateVoiceNarration(
        narrationText,
        voiceConfig
      );

      // Save audio file
      const audioFileName = `slide_${i}_${Date.now()}.mp3`;
      const audioPath = join(audioDir, audioFileName);
      await writeFile(audioPath, audioResult.audioBuffer);

      // Create public URL for audio file
      const audioUrl = `/ai-presenter/${presentationId}/${audioFileName}`;

      // Check if this slide should trigger a CTA
      const ctaTrigger = options?.ctaTimings?.find(cta => cta.slideIndex === i);

      // Build slide timing configuration
      const timing: SlideTimingConfig = {
        slideIndex: i,
        audioUrl,
        duration: audioResult.duration,
        startTime: currentTime,
        pauseAfter: i < slides.length - 1 ? pauseBetweenSlides : 0,
        ctaTrigger: ctaTrigger ? {
          atSecond: Math.floor(audioResult.duration / 2), // Trigger CTA halfway through slide
          ctaType: ctaTrigger.type,
        } : undefined,
      };

      slideTimings.push(timing);

      // Update tracking
      totalTokens += audioResult.tokensUsed;
      totalCostCents += audioResult.costCents;
      currentTime += audioResult.duration + (timing.pauseAfter || 0);

      console.log(`Generated audio for slide ${i + 1}/${slides.length}: ${audioResult.duration}s`);
    }

    const timeline: PresentationTimeline = {
      presentationId,
      webinarId,
      voiceConfig,
      totalDuration: currentTime,
      slides: slideTimings,
      ttsTokens: totalTokens,
      ttsCostCents: totalCostCents,
    };

    console.log(`Timeline generated: ${slides.length} slides, ${currentTime}s total, $${(totalCostCents / 100).toFixed(2)} cost`);

    return timeline;
  } catch (error) {
    console.error('Error generating presentation timeline:', error);
    throw new Error(`Failed to generate timeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Prepare narration text from slide data
 * Prioritizes speaker notes, falls back to content
 */
function prepareNarrationText(slide: SlideData): string {
  // Use speaker notes if available, otherwise use slide content
  let text = slide.speakerNotes || slide.content;

  // Add title context if it's not already mentioned
  if (!text.toLowerCase().includes(slide.title.toLowerCase())) {
    text = `${slide.title}. ${text}`;
  }

  // Clean and prepare text for TTS
  return prepareTextForTTS(text);
}

/**
 * Detect optimal CTA trigger points based on slide content
 * Automatically identifies slides that should trigger CTAs
 */
export function detectCTATriggers(
  slides: SlideData[]
): Array<{ slideIndex: number; type: 'BOOK_A_CALL' | 'BUY_NOW' }> {
  const triggers: Array<{ slideIndex: number; type: 'BOOK_A_CALL' | 'BUY_NOW' }> = [];

  slides.forEach((slide, index) => {
    const content = `${slide.title} ${slide.content} ${slide.speakerNotes || ''}`.toLowerCase();

    // Detect CTA slides
    if (slide.type === 'cta') {
      // Determine CTA type based on content
      if (
        content.includes('book') ||
        content.includes('call') ||
        content.includes('consultation') ||
        content.includes('speak') ||
        content.includes('chat')
      ) {
        triggers.push({ slideIndex: index, type: 'BOOK_A_CALL' });
      } else if (
        content.includes('buy') ||
        content.includes('purchase') ||
        content.includes('order') ||
        content.includes('pricing') ||
        content.includes('subscribe')
      ) {
        triggers.push({ slideIndex: index, type: 'BUY_NOW' });
      }
    }
  });

  return triggers;
}

/**
 * Calculate estimated duration without generating audio
 * Useful for previewing timeline before processing
 */
export function estimateTimelineDuration(
  slides: SlideData[],
  voiceSpeed: number = 0.95,
  pauseBetweenSlides: number = 1
): number {
  let totalDuration = 0;

  slides.forEach((slide, index) => {
    const text = slide.speakerNotes || slide.content;

    // Estimate duration based on character count
    // Average speaking rate: 150 words/min ≈ 12.5 chars/second at normal speed
    // Adjust for voice speed
    const charsPerSecond = 12.5 * voiceSpeed;
    const duration = Math.ceil(text.length / charsPerSecond);

    totalDuration += duration;

    // Add pause between slides
    if (index < slides.length - 1) {
      totalDuration += pauseBetweenSlides;
    }
  });

  return totalDuration;
}

/**
 * Validate timeline data
 */
export function validateTimeline(timeline: PresentationTimeline): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!timeline.presentationId) {
    errors.push('Missing presentation ID');
  }

  if (!timeline.webinarId) {
    errors.push('Missing webinar ID');
  }

  if (!timeline.slides || timeline.slides.length === 0) {
    errors.push('No slides in timeline');
  }

  if (timeline.totalDuration <= 0) {
    errors.push('Invalid total duration');
  }

  // Validate each slide timing
  timeline.slides.forEach((slide, index) => {
    if (slide.duration <= 0) {
      errors.push(`Slide ${index} has invalid duration`);
    }

    if (!slide.audioUrl) {
      errors.push(`Slide ${index} missing audio URL`);
    }

    if (slide.startTime < 0) {
      errors.push(`Slide ${index} has invalid start time`);
    }
  });

  // Validate timing sequence
  for (let i = 1; i < timeline.slides.length; i++) {
    const prev = timeline.slides[i - 1];
    const current = timeline.slides[i];

    const expectedStartTime = prev.startTime + prev.duration + (prev.pauseAfter || 0);
    if (Math.abs(current.startTime - expectedStartTime) > 1) {
      errors.push(`Slide ${i} start time doesn't match sequence`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get slide at specific time in presentation
 */
export function getSlideAtTime(
  timeline: PresentationTimeline,
  elapsedSeconds: number
): { slide: SlideTimingConfig; slideIndex: number } | null {
  for (let i = 0; i < timeline.slides.length; i++) {
    const slide = timeline.slides[i];
    const slideEndTime = slide.startTime + slide.duration + (slide.pauseAfter || 0);

    if (elapsedSeconds >= slide.startTime && elapsedSeconds < slideEndTime) {
      return { slide, slideIndex: i };
    }
  }

  return null;
}
