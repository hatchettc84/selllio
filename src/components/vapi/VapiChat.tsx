"use client";

import { useState, useEffect, useRef } from "react";
import { vapi } from "@/lib/vapi/vapiClient";
import { Send, Loader2, Bot, User, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface VapiChatProps {
  assistantId: string;
  assistantName?: string;
}

export function VapiChat({ assistantId, assistantName = "AI Assistant" }: VapiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for assistant messages
    vapi.on("message", (message: any) => {
      if (message.type === "transcript" && message.role === "assistant") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: message.transcript,
            timestamp: new Date(),
          },
        ]);
      }
    });

    // Listen for speech start/end
    vapi.on("speech-start", () => {
      setIsSpeaking(true);
    });

    vapi.on("speech-end", () => {
      setIsSpeaking(false);
    });

    // Listen for call start
    vapi.on("call-start", () => {
      setIsConnected(true);
      setIsLoading(false);
    });

    // Listen for call end
    vapi.on("call-end", () => {
      setIsConnected(false);
      setIsSpeaking(false);
    });

    // Listen for errors
    vapi.on("error", (error: any) => {
      console.error("VAPI Error:", error);
      setIsLoading(false);
    });

    return () => {
      // Cleanup: Stop call on unmount
      if (isConnected) {
        vapi.stop();
      }
    };
  }, [isConnected]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const startChat = async () => {
    try {
      setIsLoading(true);
      await vapi.start(assistantId);
    } catch (error) {
      console.error("Failed to start chat:", error);
      setIsLoading(false);
    }
  };

  const endChat = () => {
    vapi.stop();
    setIsConnected(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !isConnected) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Send message to VAPI
    vapi.send({
      type: "add-message",
      message: {
        role: "user",
        content: input,
      },
    });

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto border border-border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{assistantName}</h3>
            <p className="text-sm text-muted-foreground">
              {isConnected ? (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  {isSpeaking ? "Speaking..." : "Connected"}
                </span>
              ) : (
                "Disconnected"
              )}
            </p>
          </div>
        </div>
        <div>
          {!isConnected ? (
            <Button
              onClick={startChat}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Phone className="h-4 w-4" />
              )}
              Start Chat
            </Button>
          ) : (
            <Button
              onClick={endChat}
              variant="destructive"
              className="gap-2"
            >
              <PhoneOff className="h-4 w-4" />
              End Chat
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {messages.length === 0 && !isConnected && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">Click "Start Chat" to begin talking with the AI agent</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[70%] rounded-lg px-4 py-2",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isSpeaking && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isConnected
                ? "Type your message..."
                : "Start chat to send messages"
            }
            disabled={!isConnected}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || !isConnected}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
