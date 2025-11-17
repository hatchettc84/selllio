/**
 * AI Presentation Controller
 * Main orchestration component that manages the entire AI-powered presentation
 */

import { RTMPStreamController, buildStreamIoRTMPUrl } from './rtmpStreamer';
import { getSlideAtTime } from './slideSequencer';
import type { PresentationTimeline, AIPresenterStatus, AIPresenterConfig } from './types';
import { EventEmitter } from 'events';
import { StreamChat } from 'stream-chat';

export interface ControllerConfig {
  presentationTimeline: PresentationTimeline;
  streamApiKey: string;
  streamApiSecret: string;
  streamToken: string;
  channelId: string; // Stream Chat channel ID for sending slide updates
}

/**
 * AI Presenter Controller
 * Orchestrates the entire automated webinar presentation
 */
export class AIPresenterController extends EventEmitter {
  private config: ControllerConfig;
  private streamController: RTMPStreamController | null = null;
  private chatClient: StreamChat | null = null;
  private status: AIPresenterStatus;
  private startTime: number = 0;
  private updateInterval: NodeJS.Timeout | null = null;
  private ctaTriggered: Set<number> = new Set(); // Track which CTAs have been triggered

  constructor(config: ControllerConfig) {
    super();
    this.config = config;
    this.status = {
      webinarId: config.presentationTimeline.webinarId,
      status: 'idle',
      currentSlideIndex: 0,
      totalSlides: config.presentationTimeline.slides.length,
      elapsedTime: 0,
      totalDuration: config.presentationTimeline.totalDuration,
    };
  }

  /**
   * Initialize the presentation
   * Sets up Stream.io connection and prepares for streaming
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing AI Presenter Controller');
      this.status.status = 'preparing';
      this.emit('statusChange', this.status);

      // Initialize Stream Chat client for sending slide updates
      this.chatClient = StreamChat.getInstance(
        this.config.streamApiKey,
        this.config.streamApiSecret
      );

      // Build RTMP URL for Stream.io
      const rtmpUrl = buildStreamIoRTMPUrl(
        this.config.streamApiKey,
        this.config.presentationTimeline.webinarId
      );

      // Create RTMP stream controller
      this.streamController = new RTMPStreamController({
        webinarId: this.config.presentationTimeline.webinarId,
        rtmpUrl,
        streamKey: this.config.streamToken,
        timeline: this.config.presentationTimeline,
      });

      // Set up stream event handlers
      this.setupStreamHandlers();

      console.log('AI Presenter Controller initialized');
    } catch (error) {
      console.error('Error initializing AI Presenter Controller:', error);
      this.status.status = 'error';
      this.status.error = error instanceof Error ? error.message : 'Initialization failed';
      this.emit('error', this.status.error);
      throw error;
    }
  }

  /**
   * Set up event handlers for stream controller
   */
  private setupStreamHandlers(): void {
    if (!this.streamController) return;

    this.streamController.on('started', () => {
      console.log('Stream started');
      this.emit('streamStarted');
    });

    this.streamController.on('slideChange', (slide) => {
      console.log(`Slide changed to ${slide.slideIndex}`);
      this.handleSlideChange(slide.slideIndex);
    });

    this.streamController.on('ended', () => {
      console.log('Stream ended');
      this.stop();
    });

    this.streamController.on('error', (error) => {
      console.error('Stream error:', error);
      this.status.status = 'error';
      this.status.error = error;
      this.emit('error', error);
    });
  }

  /**
   * Start the AI-powered presentation
   */
  async start(): Promise<void> {
    try {
      if (this.status.status === 'streaming') {
        throw new Error('Presentation is already running');
      }

      console.log('Starting AI presentation');

      // Start RTMP stream
      if (!this.streamController) {
        throw new Error('Stream controller not initialized');
      }

      await this.streamController.start();

      this.status.status = 'streaming';
      this.startTime = Date.now();
      this.emit('started');

      // Start update loop
      this.startUpdateLoop();

      console.log('AI presentation started successfully');
    } catch (error) {
      console.error('Error starting AI presentation:', error);
      this.status.status = 'error';
      this.status.error = error instanceof Error ? error.message : 'Start failed';
      this.emit('error', this.status.error);
      throw error;
    }
  }

  /**
   * Start the update loop that tracks progress and triggers events
   */
  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      if (this.status.status !== 'streaming') return;

      // Calculate elapsed time
      const elapsedSeconds = (Date.now() - this.startTime) / 1000;
      this.status.elapsedTime = elapsedSeconds;

      // Get current slide
      const currentSlideData = getSlideAtTime(
        this.config.presentationTimeline,
        elapsedSeconds
      );

      if (currentSlideData) {
        const { slide, slideIndex } = currentSlideData;

        // Update current slide if changed
        if (slideIndex !== this.status.currentSlideIndex) {
          this.status.currentSlideIndex = slideIndex;
          this.handleSlideChange(slideIndex);
        }

        // Check for CTA triggers
        if (slide.ctaTrigger && !this.ctaTriggered.has(slideIndex)) {
          const timeInSlide = elapsedSeconds - slide.startTime;
          if (timeInSlide >= slide.ctaTrigger.atSecond) {
            this.triggerCTA(slide.ctaTrigger.ctaType);
            this.ctaTriggered.add(slideIndex);
          }
        }
      }

      // Check if presentation is complete
      if (elapsedSeconds >= this.config.presentationTimeline.totalDuration) {
        console.log('Presentation duration reached, stopping...');
        this.stop();
      }

      // Emit status update
      this.emit('statusUpdate', this.status);
    }, 500); // Update every 500ms
  }

  /**
   * Handle slide change
   * Sends events to viewers to update their displays
   */
  private async handleSlideChange(slideIndex: number): Promise<void> {
    try {
      console.log(`Handling slide change to ${slideIndex}`);

      // Send slide change event via Stream Chat
      if (this.chatClient) {
        const channel = this.chatClient.channel('livestream', this.config.channelId);

        await channel.sendEvent({
          type: 'ai_presenter_slide_change',
          data: {
            slideIndex,
            timestamp: Date.now(),
          },
        });

        console.log(`Sent slide change event for slide ${slideIndex}`);
      }

      this.emit('slideChanged', slideIndex);
    } catch (error) {
      console.error('Error handling slide change:', error);
      // Don't throw - slide display is not critical
    }
  }

  /**
   * Trigger CTA (Call-to-Action)
   * Sends event to open CTA dialog for viewers
   */
  private async triggerCTA(ctaType: 'BOOK_A_CALL' | 'BUY_NOW'): Promise<void> {
    try {
      console.log(`Triggering CTA: ${ctaType}`);

      // Send CTA event via Stream Chat (same as human presenter would)
      if (this.chatClient) {
        const channel = this.chatClient.channel('livestream', this.config.channelId);

        await channel.sendEvent({
          type: 'open_cta_dialog',
          data: {
            ctaType,
            timestamp: Date.now(),
          },
        });

        console.log(`CTA triggered: ${ctaType}`);
      }

      this.emit('ctaTriggered', ctaType);
    } catch (error) {
      console.error('Error triggering CTA:', error);
      // Don't throw - CTA is not critical for presentation flow
    }
  }

  /**
   * Stop the presentation
   */
  async stop(): Promise<void> {
    try {
      console.log('Stopping AI presentation');

      // Clear update interval
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      // Stop stream
      if (this.streamController) {
        await this.streamController.stop();
      }

      // Disconnect chat client
      if (this.chatClient) {
        await this.chatClient.disconnectUser();
        this.chatClient = null;
      }

      this.status.status = 'ended';
      this.emit('stopped');
      this.emit('statusChange', this.status);

      console.log('AI presentation stopped');
    } catch (error) {
      console.error('Error stopping AI presentation:', error);
      this.status.status = 'error';
      this.status.error = error instanceof Error ? error.message : 'Stop failed';
      this.emit('error', this.status.error);
      throw error;
    }
  }

  /**
   * Pause the presentation (not fully implemented yet)
   */
  async pause(): Promise<void> {
    if (this.status.status !== 'streaming') {
      throw new Error('Cannot pause - presentation is not streaming');
    }

    this.status.status = 'paused';
    this.emit('paused');
    this.emit('statusChange', this.status);
    // Note: Actual stream pause requires complex FFmpeg control
  }

  /**
   * Resume the presentation
   */
  async resume(): Promise<void> {
    if (this.status.status !== 'paused') {
      throw new Error('Cannot resume - presentation is not paused');
    }

    this.status.status = 'streaming';
    this.emit('resumed');
    this.emit('statusChange', this.status);
  }

  /**
   * Get current status
   */
  getStatus(): AIPresenterStatus {
    return { ...this.status };
  }

  /**
   * Get current slide index
   */
  getCurrentSlideIndex(): number {
    return this.status.currentSlideIndex;
  }

  /**
   * Get progress percentage (0-100)
   */
  getProgress(): number {
    if (this.status.totalDuration === 0) return 0;
    return Math.min(100, (this.status.elapsedTime / this.status.totalDuration) * 100);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.stop();
    this.removeAllListeners();
  }
}

/**
 * Global registry of active AI presenters
 * Allows tracking and management of multiple concurrent presentations
 */
class AIPresenterRegistry {
  private controllers: Map<string, AIPresenterController> = new Map();

  register(webinarId: string, controller: AIPresenterController): void {
    this.controllers.set(webinarId, controller);
  }

  unregister(webinarId: string): void {
    this.controllers.delete(webinarId);
  }

  get(webinarId: string): AIPresenterController | undefined {
    return this.controllers.get(webinarId);
  }

  has(webinarId: string): boolean {
    return this.controllers.has(webinarId);
  }

  getAll(): AIPresenterController[] {
    return Array.from(this.controllers.values());
  }

  async stopAll(): Promise<void> {
    const promises = Array.from(this.controllers.values()).map(controller =>
      controller.stop().catch(err => console.error('Error stopping controller:', err))
    );
    await Promise.all(promises);
    this.controllers.clear();
  }
}

// Export singleton instance
export const aiPresenterRegistry = new AIPresenterRegistry();
