"use server";

/**
 * AI Presenter Server Actions
 * Handles backend operations for AI-powered webinar presentations
 */

import { prismaClient } from "@/lib/prismaClient";
import { onAuthenticateUser } from "./auth";
import { generatePresentationTimeline, detectCTATriggers } from "@/lib/ai-presenter/slideSequencer";
import { validateVoiceConfig } from "@/lib/ai-presenter/ttsGenerator";
import type { SlideData, VoiceConfig } from "@/lib/ai-presenter/types";
import { revalidatePath } from "next/cache";

/**
 * Prepare AI presenter timeline for a presentation
 * Generates audio narration and creates timeline
 */
export const prepareAIPresenter = async (
  presentationId: string,
  voiceConfig?: Partial<VoiceConfig>
) => {
  try {
    const user = await onAuthenticateUser();
    if (!user.user) {
      return { status: 401, message: "Unauthorized" };
    }

    // Get presentation with webinar
    const presentation = await prismaClient.presentation.findUnique({
      where: { id: presentationId },
      include: {
        webinar: {
          select: {
            id: true,
            presenterId: true,
            ctaType: true,
          },
        },
      },
    });

    if (!presentation) {
      return { status: 404, message: "Presentation not found" };
    }

    // Verify ownership
    if (presentation.webinar.presenterId !== user.user.id) {
      return { status: 403, message: "Forbidden" };
    }

    // Check if presentation has slides in metadata
    const metadata = presentation.metadata as any;
    if (!metadata?.slides || !Array.isArray(metadata.slides)) {
      return {
        status: 400,
        message: "Presentation has no slides. Generate presentation first.",
      };
    }

    const slides: SlideData[] = metadata.slides;

    // Validate and set voice configuration
    const validatedVoiceConfig = validateVoiceConfig(voiceConfig || {});

    // Detect CTA triggers automatically
    const ctaTimings = detectCTATriggers(slides);

    console.log(`Preparing AI presenter for presentation ${presentationId}`);
    console.log(`Slides: ${slides.length}, CTAs: ${ctaTimings.length}`);

    // Generate timeline with audio narration
    const timeline = await generatePresentationTimeline(
      presentationId,
      presentation.webinar.id,
      slides,
      validatedVoiceConfig,
      {
        pauseBetweenSlides: 1,
        ctaTimings,
      }
    );

    // Save timeline to database
    const aiTimeline = await prismaClient.aIPresenterTimeline.create({
      data: {
        presentationId,
        voiceModel: validatedVoiceConfig.model,
        voiceName: validatedVoiceConfig.voice,
        voiceSpeed: validatedVoiceConfig.speed,
        totalDuration: timeline.totalDuration,
        slides: timeline.slides as any,
        status: "ready",
        ttsTokens: timeline.ttsTokens,
        ttsCostCents: timeline.ttsCostCents,
      },
    });

    // Enable AI presenter on presentation
    await prismaClient.presentation.update({
      where: { id: presentationId },
      data: { aiPresenterEnabled: true },
    });

    revalidatePath(`/webinars/${presentation.webinar.id}/presentations`);

    return {
      status: 200,
      message: "AI presenter prepared successfully",
      data: {
        timelineId: aiTimeline.id,
        totalDuration: timeline.totalDuration,
        slideCount: timeline.slides.length,
        costCents: timeline.ttsCostCents,
      },
    };
  } catch (error) {
    console.error("Error preparing AI presenter:", error);
    return {
      status: 500,
      message: "Failed to prepare AI presenter",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Get AI presenter timeline for a presentation
 */
export const getAIPresenterTimeline = async (presentationId: string) => {
  try {
    const user = await onAuthenticateUser();
    if (!user.user) {
      return { status: 401, message: "Unauthorized" };
    }

    const timeline = await prismaClient.aIPresenterTimeline.findUnique({
      where: { presentationId },
      include: {
        presentation: {
          include: {
            webinar: {
              select: {
                presenterId: true,
              },
            },
          },
        },
      },
    });

    if (!timeline) {
      return { status: 404, message: "Timeline not found" };
    }

    // Verify ownership
    if (timeline.presentation.webinar.presenterId !== user.user.id) {
      return { status: 403, message: "Forbidden" };
    }

    return {
      status: 200,
      data: timeline,
    };
  } catch (error) {
    console.error("Error getting AI presenter timeline:", error);
    return {
      status: 500,
      message: "Failed to get timeline",
    };
  }
};

/**
 * Delete AI presenter timeline
 */
export const deleteAIPresenterTimeline = async (presentationId: string) => {
  try {
    const user = await onAuthenticateUser();
    if (!user.user) {
      return { status: 401, message: "Unauthorized" };
    }

    const timeline = await prismaClient.aIPresenterTimeline.findUnique({
      where: { presentationId },
      include: {
        presentation: {
          include: {
            webinar: {
              select: {
                id: true,
                presenterId: true,
              },
            },
          },
        },
      },
    });

    if (!timeline) {
      return { status: 404, message: "Timeline not found" };
    }

    // Verify ownership
    if (timeline.presentation.webinar.presenterId !== user.user.id) {
      return { status: 403, message: "Forbidden" };
    }

    // Delete timeline
    await prismaClient.aIPresenterTimeline.delete({
      where: { presentationId },
    });

    // Disable AI presenter on presentation
    await prismaClient.presentation.update({
      where: { id: presentationId },
      data: { aiPresenterEnabled: false },
    });

    revalidatePath(`/webinars/${timeline.presentation.webinar.id}/presentations`);

    return {
      status: 200,
      message: "AI presenter timeline deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting AI presenter timeline:", error);
    return {
      status: 500,
      message: "Failed to delete timeline",
    };
  }
};

/**
 * Update voice configuration for AI presenter
 */
export const updateAIPresenterVoice = async (
  presentationId: string,
  voiceConfig: Partial<VoiceConfig>
) => {
  try {
    const user = await onAuthenticateUser();
    if (!user.user) {
      return { status: 401, message: "Unauthorized" };
    }

    const timeline = await prismaClient.aIPresenterTimeline.findUnique({
      where: { presentationId },
      include: {
        presentation: {
          include: {
            webinar: {
              select: {
                id: true,
                presenterId: true,
              },
            },
          },
        },
      },
    });

    if (!timeline) {
      return { status: 404, message: "Timeline not found" };
    }

    // Verify ownership
    if (timeline.presentation.webinar.presenterId !== user.user.id) {
      return { status: 403, message: "Forbidden" };
    }

    // Validate voice config
    const validatedConfig = validateVoiceConfig(voiceConfig);

    // Update timeline voice config
    // Note: This requires regenerating audio files
    await prismaClient.aIPresenterTimeline.update({
      where: { presentationId },
      data: {
        voiceModel: validatedConfig.model,
        voiceName: validatedConfig.voice,
        voiceSpeed: validatedConfig.speed,
        status: "pending", // Mark as needing regeneration
      },
    });

    revalidatePath(`/webinars/${timeline.presentation.webinar.id}/presentations`);

    return {
      status: 200,
      message: "Voice configuration updated. Timeline will be regenerated.",
    };
  } catch (error) {
    console.error("Error updating voice config:", error);
    return {
      status: 500,
      message: "Failed to update voice configuration",
    };
  }
};

/**
 * Get AI presenter status for a webinar
 */
export const getAIPresenterStatus = async (webinarId: string) => {
  try {
    const user = await onAuthenticateUser();
    if (!user.user) {
      return { status: 401, message: "Unauthorized" };
    }

    // Get webinar with presentation timeline
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
      return { status: 404, message: "Webinar not found" };
    }

    // Verify ownership
    if (webinar.presenterId !== user.user.id) {
      return { status: 403, message: "Forbidden" };
    }

    const aiEnabledPresentation = webinar.presentations.find(
      (p) => p.aiPresenterEnabled && p.aiPresenterTimeline
    );

    if (!aiEnabledPresentation) {
      return {
        status: 200,
        data: {
          enabled: false,
          message: "No AI presenter configured for this webinar",
        },
      };
    }

    return {
      status: 200,
      data: {
        enabled: true,
        presentationId: aiEnabledPresentation.id,
        timeline: aiEnabledPresentation.aiPresenterTimeline,
      },
    };
  } catch (error) {
    console.error("Error getting AI presenter status:", error);
    return {
      status: 500,
      message: "Failed to get AI presenter status",
    };
  }
};
