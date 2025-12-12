'use client'

import { useVoice } from '@humeai/voice-react'
import { Phone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function HumeStartCall() {
  const { connect, status } = useVoice()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await connect()
    } catch (error) {
      console.error('[Hume] Failed to connect:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  if (status.value === 'connected') {
    return null // Hide button when connected
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 h-full">
      <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
        <Phone className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-semibold">Start Voice Conversation</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Connect to start an empathic voice conversation with AI
      </p>
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        size="lg"
        className="gap-2"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Phone className="h-5 w-5" />
            Start Call
          </>
        )}
      </Button>
    </div>
  )
}
