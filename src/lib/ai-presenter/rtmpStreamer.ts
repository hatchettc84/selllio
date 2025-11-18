/**
 * RTMP Streamer
 * Handles video streaming to Stream.io using FFmpeg
 * Composites audio narration with slide images
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import type { PresentationTimeline, SlideTimingConfig } from './types';
import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { join } from 'path';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface RTMPStreamConfig {
  webinarId: string;
  rtmpUrl: string;
  streamKey: string;
  timeline: PresentationTimeline;
  slideImageDir?: string; // Directory containing slide images
}

export interface StreamStatus {
  isStreaming: boolean;
  currentSlideIndex: number;
  elapsedTime: number;
  error?: string;
}

/**
 * RTMP Stream Controller
 * Manages FFmpeg process for streaming presentation to Stream.io
 */
export class RTMPStreamController extends EventEmitter {
  private ffmpegProcess: ffmpeg.FfmpegCommand | null = null;
  private config: RTMPStreamConfig;
  private status: StreamStatus;
  private startTime: number = 0;
  private slideUpdateInterval: NodeJS.Timeout | null = null;

  constructor(config: RTMPStreamConfig) {
    super();
    this.config = config;
    this.status = {
      isStreaming: false,
      currentSlideIndex: 0,
      elapsedTime: 0,
    };
  }

  /**
   * Start RTMP stream
   */
  async start(): Promise<void> {
    try {
      if (this.status.isStreaming) {
        throw new Error('Stream is already running');
      }

      console.log('Starting RTMP stream for webinar:', this.config.webinarId);

      // Build RTMP URL
      const rtmpEndpoint = `${this.config.rtmpUrl}/${this.config.streamKey}`;

      // Create a simple audio-only stream first (MVP approach)
      // For full video with slides, we'd need to composite images with FFmpeg filters
      await this.startAudioOnlyStream(rtmpEndpoint);

      this.status.isStreaming = true;
      this.startTime = Date.now();

      // Start slide update tracking
      this.startSlideTracking();

      this.emit('started');
    } catch (error) {
      console.error('Error starting RTMP stream:', error);
      this.status.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('error', this.status.error);
      throw error;
    }
  }

  /**
   * Start audio-only stream (MVP approach)
   * Streams audio narration with a static image or color bars
   */
  private async startAudioOnlyStream(rtmpEndpoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create concat file for audio files
      const audioFiles = this.config.timeline.slides.map(slide => {
        const audioPath = join(process.cwd(), 'public', slide.audioUrl);
        return `file '${audioPath}'`;
      }).join('\n');

      // For MVP: Use a static colored background
      // In production, you'd composite slide images here
      this.ffmpegProcess = ffmpeg()
        // Input 1: Generate a static colored video (1280x720, purple background)
        .input('color=c=0x6366F1:s=1280x720:r=30')
        .inputFormat('lavfi')
        // Add text overlay (optional - can show webinar title)
        .complexFilter([
          `drawtext=text='AI Presenter':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`
        ])
        // Audio input will be added dynamically as we play through slides
        .videoCodec('libx264')
        .audioCodec('aac')
        .format('flv')
        .outputOptions([
          '-preset veryfast',
          '-tune zerolatency',
          '-g 30', // Keyframe interval
          '-b:v 2500k', // Video bitrate
          '-maxrate 2500k',
          '-bufsize 5000k',
          '-b:a 128k', // Audio bitrate
          '-ar 44100', // Audio sample rate
          '-ac 2', // Stereo
          '-pix_fmt yuv420p',
        ])
        .output(rtmpEndpoint);

      this.ffmpegProcess.on('start', (commandLine: string) => {
        console.log('FFmpeg started:', commandLine);
        resolve();
      });

      this.ffmpegProcess.on('error', (err: Error) => {
        console.error('FFmpeg error:', err.message);
        reject(err);
      });

      this.ffmpegProcess.on('end', () => {
        console.log('FFmpeg process ended');
        this.status.isStreaming = false;
        this.emit('ended');
      });

      this.ffmpegProcess.run();
    });
  }

  /**
   * Track slide progression during stream
   */
  private startSlideTracking(): void {
    this.slideUpdateInterval = setInterval(() => {
      const elapsedSeconds = (Date.now() - this.startTime) / 1000;
      this.status.elapsedTime = elapsedSeconds;

      // Find current slide based on elapsed time
      const currentSlide = this.getCurrentSlide(elapsedSeconds);
      if (currentSlide && currentSlide.slideIndex !== this.status.currentSlideIndex) {
        this.status.currentSlideIndex = currentSlide.slideIndex;
        this.emit('slideChange', currentSlide);
      }

      // Check if presentation is complete
      if (elapsedSeconds >= this.config.timeline.totalDuration) {
        this.stop();
      }
    }, 100); // Check every 100ms
  }

  /**
   * Get current slide based on elapsed time
   */
  private getCurrentSlide(elapsedSeconds: number): SlideTimingConfig | null {
    for (const slide of this.config.timeline.slides) {
      const slideEndTime = slide.startTime + slide.duration + (slide.pauseAfter || 0);
      if (elapsedSeconds >= slide.startTime && elapsedSeconds < slideEndTime) {
        return slide;
      }
    }
    return null;
  }

  /**
   * Stop RTMP stream
   */
  async stop(): Promise<void> {
    try {
      console.log('Stopping RTMP stream');

      if (this.slideUpdateInterval) {
        clearInterval(this.slideUpdateInterval);
        this.slideUpdateInterval = null;
      }

      if (this.ffmpegProcess) {
        this.ffmpegProcess.kill('SIGTERM');
        this.ffmpegProcess = null;
      }

      this.status.isStreaming = false;
      this.emit('stopped');
    } catch (error) {
      console.error('Error stopping RTMP stream:', error);
      throw error;
    }
  }

  /**
   * Get current stream status
   */
  getStatus(): StreamStatus {
    return { ...this.status };
  }

  /**
   * Pause stream (not implemented yet - requires complex FFmpeg control)
   */
  async pause(): Promise<void> {
    throw new Error('Pause not yet implemented');
  }

  /**
   * Resume stream
   */
  async resume(): Promise<void> {
    throw new Error('Resume not yet implemented');
  }
}

/**
 * Build Stream.io RTMP ingestion URL
 */
export function buildStreamIoRTMPUrl(apiKey: string, webinarId: string): string {
  return `rtmps://ingress.stream-io-video.com:443/app/${apiKey}.livestream.${webinarId}`;
}

/**
 * Validate Stream.io credentials and RTMP endpoint
 */
export async function validateStreamEndpoint(
  rtmpUrl: string,
  streamKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Basic URL validation
    if (!rtmpUrl.startsWith('rtmp://') && !rtmpUrl.startsWith('rtmps://')) {
      return { valid: false, error: 'Invalid RTMP URL format' };
    }

    if (!streamKey || streamKey.length < 10) {
      return { valid: false, error: 'Invalid stream key' };
    }

    // In a production environment, you'd test the connection here
    // For now, we'll just validate format
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate slide images from PowerPoint or PDF (future enhancement)
 * This would extract each slide as a PNG for compositing
 */
export async function extractSlideImages(
  pptxPath: string,
  outputDir: string
): Promise<string[]> {
  // TODO: Implement slide extraction
  // This would use a library like pdf-poppler or libreoffice-convert
  // to extract each slide as an image
  throw new Error('Slide extraction not yet implemented');
}

/**
 * Advanced: Create video stream with slide transitions (future enhancement)
 * This would composite slide images with audio and transitions
 */
export async function createCompositeVideoStream(
  timeline: PresentationTimeline,
  slideImages: string[],
  rtmpEndpoint: string
): Promise<RTMPStreamController> {
  // TODO: Implement advanced video compositing
  // This would use FFmpeg complex filters to:
  // 1. Load slide images
  // 2. Apply transitions between slides
  // 3. Sync audio narration
  // 4. Add overlays (logos, progress bars, etc.)
  throw new Error('Composite video streaming not yet implemented');
}
