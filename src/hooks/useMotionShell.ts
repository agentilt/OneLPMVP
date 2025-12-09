import { useEffect } from 'react'

type MotionOptions = {
  enableTilt?: boolean
  enableScrollReveal?: boolean
  enableScrollGradient?: boolean
}

// Lightweight client-side motion inspired by theme_reference/script.js
export function useMotionShell({ enableTilt = true, enableScrollReveal = true, enableScrollGradient = true }: MotionOptions = {}) {
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

    // Scroll-driven gradient
    let scrollRaf: number | null = null
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
    const updateScrollGradient = () => {
      scrollRaf = null
      const doc = document.documentElement
      const styles = getComputedStyle(doc)
      const accent = styles.getPropertyValue('--accent-color').trim() || '#8fb1ff'
      const back = styles.getPropertyValue('--background').trim() || '#344363'
      const backAlt = styles.getPropertyValue('--background-alt').trim() || back
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight)
      const t = clamp(doc.scrollTop / maxScroll, 0, 1)

      const mix = (a: string, b: string, p: number) => `color-mix(in srgb, ${a} ${p}%, ${b} ${100 - p}%)`

      doc.style.setProperty('--scroll-angle', `${135 + 25 * t}deg`)
      doc.style.setProperty('--scroll-grad-a', mix(accent, back, 40 + 18 * t))
      doc.style.setProperty('--scroll-grad-b', mix(accent, backAlt, 34 + 14 * t))
      doc.style.setProperty('--scroll-grad-c', mix(accent, back, 28 + 12 * t))
      doc.style.setProperty('--scroll-linear-a', mix(backAlt, accent, 36 + 10 * t))
      doc.style.setProperty('--scroll-linear-b', mix(back, accent, 30 + 8 * t))
    }

    const onScroll = () => {
      if (scrollRaf !== null) return
      scrollRaf = requestAnimationFrame(updateScrollGradient)
    }

    const onResize = onScroll

    if (enableScrollGradient) {
      updateScrollGradient()
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)
    }

    return () => {
      revealObserver?.disconnect()
      tiltCleanup.forEach(fn => fn())
      if (scrollRaf) cancelAnimationFrame(scrollRaf)
      if (enableScrollGradient) {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onResize)
      }
    }
  }, [enableTilt, enableScrollReveal, enableScrollGradient])
}
