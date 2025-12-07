 'use client'

import { useEffect, useState } from 'react'

export function IntroOverlay() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduceMotion) {
      setHidden(true)
      return
    }
    const timer = setTimeout(() => {
      setHidden(true)
    }, 1600)
    return () => clearTimeout(timer)
  }, [])

  if (hidden) return null

  return (
    <div className="intro-overlay fixed inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(124,93,255,0.22),transparent_45%),radial-gradient(circle_at_60%_65%,rgba(107,220,255,0.18),transparent_48%),linear-gradient(180deg,#050812_0%,#0b1124_100%)] grid place-items-center z-[999] overflow-hidden transition-opacity duration-700">
      <div className="intro-veil absolute inset-[-12%] bg-[conic-gradient(from_120deg_at_50%_40%,rgba(107,220,255,0.24),rgba(124,93,255,0.22),rgba(44,243,199,0.22),rgba(83,201,255,0.24)),radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.16),transparent_45%)] blur-[60px] opacity-80 animate-[intro-flow_14s_ease-in-out_infinite_alternate] mix-blend-screen" />
      <div className="intro-content relative z-10 grid gap-4 text-center">
        <div className="w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] mx-auto rounded-[36px] bg-[url('/onelp-logo.png')] bg-center bg-contain bg-no-repeat filter invert brightness-125 drop-shadow-[0_24px_80px_rgba(107,220,255,0.45)]" />
        <p className="text-base text-muted">Preparing OneLP OS</p>
      </div>
    </div>
  )
}
