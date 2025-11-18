import { useCallback } from 'react'

export function useActivityTracker() {
  const trackClick = useCallback((elementId: string, metadata?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Click tracked:', elementId, metadata)
    }
  }, [])

  const trackFundView = useCallback((fundId: string, metadata?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Fund view tracked:', fundId, metadata)
    }
  }, [])

  const trackPageView = useCallback((pagePath: string, metadata?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Page view tracked:', pagePath, metadata)
    }
  }, [])

  return {
    trackClick,
    trackFundView,
    trackPageView,
  }
}
