'use client'

import { useVoice } from '@humeai/voice-react'
import { Bot, User } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { HumeExpressions } from './HumeExpressions'

export function HumeMessages() {
  const { messages } = useVoice()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto p-4">
      <div className="space-y-4 max-w-4xl mx-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
            <Bot className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Start speaking to begin the conversation</p>
          </div>
        )}

        {messages.map((msg, index) => {
          if (msg.type !== 'user_message' && msg.type !== 'assistant_message') {
            return null
          }

          const isUser = msg.type === 'user_message'

          return (
            <div
              key={index}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {msg.message.content}
                </p>

                {/* Show emotion expressions for assistant messages */}
                {!isUser && msg.models?.prosody?.scores && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <HumeExpressions scores={msg.models.prosody.scores} />
                  </div>
                )}

                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.receivedAt).toLocaleTimeString()}
                </p>
              </div>

              {isUser && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
