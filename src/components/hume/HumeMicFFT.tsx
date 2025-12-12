'use client'

import { useVoice } from '@humeai/voice-react'
import { useEffect, useRef } from 'react'

export function HumeMicFFT() {
  const { micFft } = useVoice()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const draw = () => {
      if (!micFft || micFft.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        animationFrameId = requestAnimationFrame(draw)
        return
      }

      const barWidth = canvas.width / micFft.length
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      micFft.forEach((value, index) => {
        const barHeight = (value / 255) * canvas.height
        const x = index * barWidth
        const y = canvas.height - barHeight

        // Use primary color from theme
        ctx.fillStyle = 'hsl(var(--primary))'
        ctx.fillRect(x, y, barWidth - 1, barHeight)
      })

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [micFft])

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Audio:</span>
      <canvas
        ref={canvasRef}
        width={150}
        height={30}
        className="rounded border border-border"
      />
    </div>
  )
}
