/**
 * Text-to-Speech Generator Service
 * Uses OpenAI TTS API to generate audio narration from text
 */

import OpenAI from 'openai';
import type { OpenAIVoice, TTSModel, AudioGenerationResult, VoiceConfig } from './types';

// Initialize OpenAI client (reuse existing configuration)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate voice narration from text using OpenAI TTS
 * @param text - The text to convert to speech (speaker notes or slide content)
 * @param config - Voice configuration (model, voice, speed)
 * @returns Audio buffer and metadata
 */
export async function generateVoiceNarration(
  text: string,
  config: VoiceConfig = {
    model: 'tts-1-hd',
    voice: 'nova',
    speed: 0.95,
  }
): Promise<AudioGenerationResult> {
  try {
    // Validate text length (OpenAI has a 4096 character limit per request)
    if (text.length > 4096) {
      throw new Error(`Text too long: ${text.length} characters. Maximum is 4096.`);
    }

    // Generate speech using OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: config.model,
      voice: config.voice,
      input: text,
      speed: config.speed,
    });

    // Convert response to Buffer
    const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());

    // Calculate duration from audio buffer
    const duration = await getAudioDuration(audioBuffer);

    // Estimate tokens used (rough approximation: 1 token ≈ 4 characters)
    const tokensUsed = Math.ceil(text.length / 4);

    // Calculate cost
    // TTS-1: $15/1M characters
    // TTS-1-HD: $30/1M characters
    const costPerChar = config.model === 'tts-1-hd' ? 0.00003 : 0.000015;
    const costCents = Math.ceil(text.length * costPerChar * 100);

    return {
      audioBuffer,
      duration,
      tokensUsed,
      costCents,
    };
  } catch (error) {
    console.error('Error generating voice narration:', error);
    throw new Error(`Failed to generate voice narration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get duration of audio buffer in seconds
 * Uses a combination of file metadata and estimation
 */
async function getAudioDuration(audioBuffer: Buffer): Promise<number> {
  try {
    // For MP3 files, we can estimate duration from file size
    // Average MP3 bitrate for OpenAI TTS is ~128 kbps
    const fileSizeBytes = audioBuffer.length;
    const bitrateKbps = 128;
    const durationSeconds = (fileSizeBytes * 8) / (bitrateKbps * 1000);

    return Math.ceil(durationSeconds);
  } catch (error) {
    console.error('Error calculating audio duration:', error);
    // Fallback: estimate based on text length (average speaking rate: 150 words per minute)
    // For 150 WPM ≈ 2.5 words per second ≈ 12.5 characters per second
    return Math.ceil(audioBuffer.length / 16000); // Rough estimate
  }
}

/**
 * Generate narration for multiple slides in batch
 * Processes slides sequentially to avoid rate limits
 */
export async function generateBatchNarration(
  texts: string[],
  config: VoiceConfig
): Promise<AudioGenerationResult[]> {
  const results: AudioGenerationResult[] = [];

  for (const text of texts) {
    try {
      const result = await generateVoiceNarration(text, config);
      results.push(result);

      // Small delay to avoid rate limiting (100ms between requests)
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error generating narration for text: "${text.substring(0, 50)}..."`, error);
      throw error;
    }
  }

  return results;
}

/**
 * Prepare text for TTS by cleaning and formatting
 * Removes problematic characters and adds natural pauses
 */
export function prepareTextForTTS(text: string): string {
  return text
    // Remove markdown formatting
    .replace(/[*_~`#]/g, '')
    // Replace newlines with pauses
    .replace(/\n\n/g, '... ')
    .replace(/\n/g, ', ')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Add natural pauses before bullet points
    .replace(/•/g, '... ')
    // Trim
    .trim();
}

/**
 * Validate voice configuration
 */
export function validateVoiceConfig(config: Partial<VoiceConfig>): VoiceConfig {
  const validVoices: OpenAIVoice[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  const validModels: TTSModel[] = ['tts-1', 'tts-1-hd'];

  return {
    model: validModels.includes(config.model as TTSModel) ? (config.model as TTSModel) : 'tts-1-hd',
    voice: validVoices.includes(config.voice as OpenAIVoice) ? (config.voice as OpenAIVoice) : 'nova',
    speed: config.speed && config.speed >= 0.25 && config.speed <= 4.0 ? config.speed : 0.95,
  };
}
