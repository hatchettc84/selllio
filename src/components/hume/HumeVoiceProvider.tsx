'use client'

import { VoiceProvider } from '@humeai/voice-react'
import { ReactNode } from 'react'
import { toast } from 'sonner'

interface Props {
  accessToken: string
  configId?: string
  children: ReactNode
}

export function HumeVoiceProviderWrapper({ accessToken, configId, children }: Props) {
  return (
    <VoiceProvider
      auth={{ type: 'accessToken', value: accessToken }}
      configId={configId}
      onMessage={() => {
        // Auto-scroll handled by child components
      }}
      onError={(error) => {
        console.error('[Hume] Voice error:', error)
        toast.error('Voice connection error', {
          description: error.message,
        })
      }}
    >
      {children}
    </VoiceProvider>
  )
}
