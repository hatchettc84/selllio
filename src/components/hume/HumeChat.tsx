'use client'

import { HumeVoiceProviderWrapper } from './HumeVoiceProvider'
import { HumeStartCall } from './HumeStartCall'
import { HumeControls } from './HumeControls'
import { HumeMessages } from './HumeMessages'
import { useVoice } from '@humeai/voice-react'

interface Props {
  accessToken: string
  agentName: string
  configId?: string
}

function HumeChatInner({ agentName }: { agentName: string }) {
  const { status } = useVoice()

  return (
    <div className="flex flex-col h-full w-full border border-border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold">AI</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{agentName}</h3>
            <p className="text-sm text-muted-foreground">
              {status.value === 'connected' ? (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Connected
                </span>
              ) : (
                'Disconnected'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {status.value === 'connected' ? (
        <>
          <HumeMessages />
          <HumeControls />
        </>
      ) : (
        <HumeStartCall />
      )}
    </div>
  )
}

export function HumeChat({ accessToken, agentName, configId }: Props) {
  return (
    <HumeVoiceProviderWrapper accessToken={accessToken} configId={configId}>
      <HumeChatInner agentName={agentName} />
    </HumeVoiceProviderWrapper>
  )
}
