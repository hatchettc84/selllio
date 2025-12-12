'use client'

import { useVoice } from '@humeai/voice-react'
import { Mic, MicOff, PhoneOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HumeMicFFT } from './HumeMicFFT'

export function HumeControls() {
  const { disconnect, status, isMuted, mute, unmute } = useVoice()

  if (status.value !== 'connected') {
    return null
  }

  const toggleMute = () => {
    if (isMuted) {
      unmute()
    } else {
      mute()
    }
  }

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Mic FFT Visualization */}
        <div className="flex-1">
          <HumeMicFFT />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          <Button
            onClick={toggleMute}
            variant={isMuted ? 'destructive' : 'secondary'}
            size="icon"
            className="h-12 w-12 rounded-full"
          >
            {isMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          <Button
            onClick={disconnect}
            variant="destructive"
            size="icon"
            className="h-12 w-12 rounded-full"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1" /> {/* Spacer for centering */}
      </div>
    </div>
  )
}
