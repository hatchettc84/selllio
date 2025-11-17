"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Bot } from "lucide-react";

type Props = {
  webinarId: string;
  totalSlides: number;
  channel: any; // Stream Chat channel instance
};

/**
 * AI Slide Viewer Component
 * Displays the current slide during an AI-powered presentation
 * Listens to Stream Chat events for slide synchronization
 */
export default function AISlideViewer({ webinarId, totalSlides, channel }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!channel) return;

    // Listen for slide change events from AI presenter
    const handleEvent = (event: any) => {
      if (event.type === "ai_presenter_slide_change") {
        const slideIndex = event.data?.slideIndex;
        if (typeof slideIndex === "number") {
          setCurrentSlide(slideIndex);
        }
      }
    };

    channel.on("ai_presenter_slide_change", handleEvent);

    return () => {
      channel.off("ai_presenter_slide_change", handleEvent);
    };
  }, [channel]);

  const progress = totalSlides > 0 ? ((currentSlide + 1) / totalSlides) * 100 : 0;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-medium">AI Presentation</span>
        </div>
        <span className="text-sm text-muted-foreground">
          Slide {currentSlide + 1} of {totalSlides}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="text-xs text-muted-foreground">
        Synchronized with AI presenter
      </div>
    </Card>
  );
}
