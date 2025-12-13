'use client'

import { useEffect, useRef } from 'react'

type Palette = {
  stops: string[]
  opacity: number
}

const palettes: Record<string, Palette> = {
  blue: {
    stops: ['rgba(15,155,244,0.22)', 'rgba(147,197,255,0.18)', 'rgba(255,255,255,0.12)'],
    opacity: 0.9,
  },
  teal: {
    stops: ['rgba(34,197,167,0.22)', 'rgba(125,249,232,0.18)', 'rgba(255,255,255,0.12)'],
    opacity: 0.9,
  },
  purple: {
    stops: ['rgba(139,92,246,0.22)', 'rgba(193,166,255,0.18)', 'rgba(255,255,255,0.12)'],
    opacity: 0.9,
  },
  green: {
    stops: ['rgba(52,211,153,0.22)', 'rgba(187,247,208,0.18)', 'rgba(255,255,255,0.12)'],
    opacity: 0.9,
  },
  orange: {
    stops: ['rgba(245,158,11,0.22)', 'rgba(255,213,128,0.18)', 'rgba(255,255,255,0.12)'],
    opacity: 0.9,
  },
}

function pickPalette(): Palette {
  if (typeof document === 'undefined') return palettes.blue
  const classes = document.documentElement.classList
  if (classes.contains('theme-teal')) return palettes.teal
  if (classes.contains('theme-purple')) return palettes.purple
  if (classes.contains('theme-green')) return palettes.green
  if (classes.contains('theme-orange')) return palettes.orange
  return palettes.blue
}

export function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let raf: number
    const palette = pickPalette()

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = Math.max(window.innerHeight, document.body.scrollHeight)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      frame += 0.005
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      // Base gradient sweep
      const grad = ctx.createLinearGradient(0, 0, width, height)
      grad.addColorStop(0, palette.stops[0])
      grad.addColorStop(0.5, palette.stops[1])
      grad.addColorStop(1, palette.stops[2])
      ctx.fillStyle = grad
      ctx.globalAlpha = palette.opacity
      ctx.fillRect(0, 0, width, height)

      // Blobs
      const blobs = [
        { x: width * 0.2 + Math.sin(frame) * 40, y: height * 0.3 + Math.cos(frame * 0.8) * 40, r: width * 0.22 },
        { x: width * 0.8 + Math.cos(frame * 0.6) * 60, y: height * 0.25 + Math.sin(frame * 0.7) * 50, r: width * 0.26 },
        { x: width * 0.5 + Math.sin(frame * 0.4) * 60, y: height * 0.8 + Math.cos(frame * 0.5) * 80, r: width * 0.3 },
      ]

      blobs.forEach((b, i) => {
        const radial = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        radial.addColorStop(0, palette.stops[i % palette.stops.length])
        radial.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = radial
        ctx.globalAlpha = palette.opacity * 0.9
        ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2)
      })

      // Light streak
      const streak = ctx.createLinearGradient(0, height * 0.4, width, height * 0.6)
      streak.addColorStop(0, 'rgba(255,255,255,0)')
      streak.addColorStop(0.5, 'rgba(255,255,255,0.24)')
      streak.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.globalAlpha = 0.28
      ctx.fillStyle = streak
      ctx.fillRect(0, height * 0.25 + Math.sin(frame * 0.6) * 40, width, height * 0.5)

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-100 block"
    />
  )
}
