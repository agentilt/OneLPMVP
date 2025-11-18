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

  const trackDirectInvestmentView = useCallback((investmentId: string, metadata?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Direct investment view tracked:', investmentId, metadata)
    }
  }, [])

  const trackDocumentView = useCallback((documentId: string, documentType?: string, metadata?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Document view tracked:', documentId, documentType, metadata)
    }
  }, [])

  const trackDownload = useCallback((documentId: string, fileName?: string, metadata?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Download tracked:', documentId, fileName, metadata)
    }
  }, [])

  return {
    trackClick,
    trackFundView,
    trackPageView,
    trackDirectInvestmentView,
    trackDocumentView,
    trackDownload,
  }
}
