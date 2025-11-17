"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Bot, Zap, DollarSign } from "lucide-react";
import { toast } from "sonner";
import type { OpenAIVoice, TTSModel } from "@/lib/ai-presenter/types";

type Props = {
  presentationId: string;
  isEnabled?: boolean;
  onSuccess?: () => void;
};

const VOICES: Array<{ value: OpenAIVoice; label: string; description: string }> = [
  { value: "nova", label: "Nova", description: "Friendly, warm female voice" },
  { value: "alloy", label: "Alloy", description: "Neutral, balanced voice" },
  { value: "echo", label: "Echo", description: "Professional male voice" },
  { value: "fable", label: "Fable", description: "Expressive British accent" },
  { value: "onyx", label: "Onyx", description: "Deep, authoritative voice" },
  { value: "shimmer", label: "Shimmer", description: "Energetic female voice" },
];

const MODELS: Array<{ value: TTSModel; label: string; costNote: string }> = [
  { value: "tts-1", label: "Standard Quality", costNote: "$0.015 per 1K chars" },
  { value: "tts-1-hd", label: "High Definition", costNote: "$0.030 per 1K chars" },
];

export default function AIPresenterConfig({ presentationId, isEnabled, onSuccess }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voice, setVoice] = useState<OpenAIVoice>("nova");
  const [model, setModel] = useState<TTSModel>("tts-1-hd");
  const [speed, setSpeed] = useState<string>("0.95");

  const handlePrepare = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/ai-presenter/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentationId,
          voiceConfig: {
            voice,
            model,
            speed: parseFloat(speed),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to prepare AI presenter");
      }

      toast.success(
        `AI Presenter prepared! Duration: ${Math.floor(data.totalDuration / 60)}m ${data.totalDuration % 60}s, Cost: $${(data.costCents / 100).toFixed(2)}`
      );

      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error preparing AI presenter:", error);
      toast.error(error instanceof Error ? error.message : "Failed to prepare AI presenter");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isEnabled ? "outline" : "default"}
          size="sm"
          className="gap-2"
        >
          <Bot className="w-4 h-4" />
          {isEnabled ? "AI Presenter Enabled" : "Enable AI Presenter"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Configure AI Presenter
          </DialogTitle>
          <DialogDescription>
            Transform your presentation into an automated AI-powered webinar. Choose a voice and quality level.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Voice Selection */}
          <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <Select value={voice} onValueChange={(v) => setVoice(v as OpenAIVoice)}>
              <SelectTrigger id="voice">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    <div>
                      <div className="font-medium">{v.label}</div>
                      <div className="text-xs text-muted-foreground">{v.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Audio Quality</Label>
            <Select value={model} onValueChange={(m) => setModel(m as TTSModel)}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{m.label}</span>
                      <span className="text-xs text-muted-foreground">{m.costNote}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speed Selection */}
          <div className="space-y-2">
            <Label htmlFor="speed">Speech Speed</Label>
            <Select value={speed} onValueChange={setSpeed}>
              <SelectTrigger id="speed">
                <SelectValue placeholder="Select speed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.75">Slow (0.75x)</SelectItem>
                <SelectItem value="0.85">Slightly Slow (0.85x)</SelectItem>
                <SelectItem value="0.95">Normal (0.95x)</SelectItem>
                <SelectItem value="1.0">Default (1.0x)</SelectItem>
                <SelectItem value="1.1">Slightly Fast (1.1x)</SelectItem>
                <SelectItem value="1.25">Fast (1.25x)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cost Estimate */}
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="w-4 h-4" />
              Estimated Cost
            </div>
            <p className="text-xs text-muted-foreground">
              Approximately $0.20-$0.35 per webinar (based on average 10-slide presentation)
            </p>
          </div>

          {/* Features */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-sm font-medium">Features:</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ Automated audio narration from speaker notes</li>
              <li>✓ Synchronized slide progression</li>
              <li>✓ Automatic CTA triggers</li>
              <li>✓ 24/7 webinar capability</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handlePrepare} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Prepare AI Presenter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
