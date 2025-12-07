import { useEffect } from 'react'

type MotionOptions = {
  enableTilt?: boolean
  enableScrollReveal?: boolean
}

// Lightweight client-side motion inspired by theme_reference/script.js
export function useMotionShell({ enableTilt = true, enableScrollReveal = true }: MotionOptions = {}) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const prefersReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointerFine = window.matchMedia('(pointer: fine)').matches
    const enableMotion = pointerFine && !prefersReduceMotion && window.innerWidth >= 900

    document.documentElement.classList.toggle('has-animations', enableMotion)

    // Scroll reveal
    let revealObserver: IntersectionObserver | null = null
    if (enableMotion && enableScrollReveal) {
      const animated = document.querySelectorAll<HTMLElement>('[data-animate]')
      animated.forEach((el, idx) => {
        const slight = (idx % 6) * 0.04
        el.style.setProperty('--delay', `${slight}s`)
      })
      revealObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            revealObserver?.unobserve(entry.target)
          }
        }
      }, { threshold: 0.08, rootMargin: '0px 0px -10% 0px' })
      document.querySelectorAll<HTMLElement>('[data-animate]').forEach(el => revealObserver?.observe(el))
    } else {
      document.querySelectorAll<HTMLElement>('[data-animate]').forEach(el => el.classList.add('visible'))
    }

    // Tilt
    const tiltCleanup: Array<() => void> = []
    if (enableMotion && enableTilt) {
      const hoverCapable = window.matchMedia('(hover: hover)').matches
      if (hoverCapable) {
        document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
          let raf: number | null = null
          let lastUpdate = 0
          const throttleDelay = 32

          const reset = () => {
            card.style.setProperty('--tiltX', '0deg')
            card.style.setProperty('--tiltY', '0deg')
            card.style.setProperty('--glowX', '50%')
            card.style.setProperty('--glowY', '50%')
            card.classList.remove('is-tilting')
          }

          const onMove = (e: PointerEvent) => {
            const now = performance.now()
            if (now - lastUpdate < throttleDelay) return
            lastUpdate = now
            const rect = card.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width
            const y = (e.clientY - rect.top) / rect.height
            const tiltY = (0.5 - x) * 8
            const tiltX = (y - 0.5) * 8
            const glowX = x * 100
            const glowY = y * 100
            if (raf) cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
              card.style.setProperty('--tiltX', `${tiltY}deg`)
              card.style.setProperty('--tiltY', `${tiltX}deg`)
              card.style.setProperty('--glowX', `${glowX}%`)
              card.style.setProperty('--glowY', `${glowY}%`)
              card.classList.add('is-tilting')
            })
          }

          const onLeave = () => {
            if (raf) cancelAnimationFrame(raf)
            raf = requestAnimationFrame(reset)
          }

          card.addEventListener('pointermove', onMove)
          card.addEventListener('pointerleave', onLeave)
          tiltCleanup.push(() => {
            card.removeEventListener('pointermove', onMove)
            card.removeEventListener('pointerleave', onLeave)
          })
        })
      }
    }

    return () => {
      revealObserver?.disconnect()
      tiltCleanup.forEach(fn => fn())
    }
  }, [enableTilt, enableScrollReveal])
}
