'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ActivityEventType } from '@/lib/activity-tracker'

interface ActivityEvent {
  eventType: ActivityEventType
  route?: string
  resourceId?: string
  resourceType?: string
  action?: string
  element?: string
  metadata?: any
}

// Batch events and send them periodically
const BATCH_INTERVAL = 5000 // 5 seconds
const MAX_BATCH_SIZE = 20

function useActivityTrackerInternal() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const eventQueueRef = useRef<ActivityEvent[]>([])
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastRouteRef = useRef<string>('')

  // Track page view on route change
  useEffect(() => {
    const currentRoute = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    
    // Only track if route actually changed
    if (currentRoute !== lastRouteRef.current) {
      lastRouteRef.current = currentRoute
      
      if (session?.user?.id) {
        trackEvent({
          eventType: ActivityEventType.PAGE_VIEW,
          route: pathname,
          metadata: {
            searchParams: searchParams?.toString() || null,
            timestamp: new Date().toISOString()
          }
        })
      }
    }
  }, [pathname, searchParams, session])

  // Flush events on unmount
  useEffect(() => {
    return () => {
      if (eventQueueRef.current.length > 0) {
        flushEvents()
      }
      if (batchTimerRef.current) {
        clearInterval(batchTimerRef.current)
      }
    }
  }, [])

  const trackEvent = useCallback((event: ActivityEvent) => {
    if (!session?.user?.id) return

    eventQueueRef.current.push({
      ...event,
      route: event.route || pathname
    })

    // Flush if batch is full
    if (eventQueueRef.current.length >= MAX_BATCH_SIZE) {
      flushEvents()
    } else {
      // Set timer to flush if not already set
      if (!batchTimerRef.current) {
        batchTimerRef.current = setTimeout(() => {
          flushEvents()
        }, BATCH_INTERVAL)
      }
    }
  }, [session, pathname])

  const flushEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0 || !session?.user?.id) return

    const eventsToSend = [...eventQueueRef.current]
    eventQueueRef.current = []

    if (batchTimerRef.current) {
      clearInterval(batchTimerRef.current)
      batchTimerRef.current = null
    }

    try {
      await fetch('/api/activity/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend })
      })
    } catch (error) {
      console.error('Failed to track activity events:', error)
      // Re-queue events on failure (optional - might want to limit retries)
    }
  }, [session])

  // Track clicks on significant elements
  const trackClick = useCallback((element: string, metadata?: any) => {
    trackEvent({
      eventType: ActivityEventType.CLICK,
      element,
      metadata
    })
  }, [trackEvent])

  // Track form submissions
  const trackFormSubmit = useCallback((formId: string, metadata?: any) => {
    trackEvent({
      eventType: ActivityEventType.FORM_SUBMIT,
      element: formId,
      metadata
    })
  }, [trackEvent])

  // Track document views
  const trackDocumentView = useCallback((documentId: string, documentType: string, metadata?: any) => {
    trackEvent({
      eventType: ActivityEventType.VIEW_DOCUMENT,
      resourceId: documentId,
      resourceType: documentType,
      metadata
    })
  }, [trackEvent])

  // Track fund views
  const trackFundView = useCallback((fundId: string, metadata?: any) => {
    trackEvent({
      eventType: ActivityEventType.VIEW_FUND,
      resourceId: fundId,
      resourceType: 'FUND',
      metadata
    })
  }, [trackEvent])

  // Track direct investment views
  const trackDirectInvestmentView = useCallback((investmentId: string, metadata?: any) => {
    trackEvent({
      eventType: ActivityEventType.VIEW_DIRECT_INVESTMENT,
      resourceId: investmentId,
      resourceType: 'DIRECT_INVESTMENT',
      metadata
    })
  }, [trackEvent])

  // Track search
  const trackSearch = useCallback((query: string, resourceType?: string, metadata?: any) => {
    trackEvent({
      eventType: ActivityEventType.SEARCH,
      resourceType,
      metadata: {
        query,
        ...metadata
      }
    })
  }, [trackEvent])

  // Track filter
  const trackFilter = useCallback((filterType: string, filterValue: any, metadata?: any) => {
    trackEvent({
      eventType: ActivityEventType.FILTER,
      metadata: {
        filterType,
        filterValue,
        ...metadata
      }
    })
  }, [trackEvent])

  // Track export
  const trackExport = useCallback((exportType: string, resourceType?: string, metadata?: any) => {
    trackEvent({
      eventType: ActivityEventType.EXPORT,
      resourceType,
      metadata: {
        exportType,
        ...metadata
      }
    })
  }, [trackEvent])

  // Track download
  const trackDownload = useCallback((resourceId: string, resourceType: string, metadata?: any) => {
    trackEvent({
      eventType: ActivityEventType.DOWNLOAD,
      resourceId,
      resourceType,
      metadata
    })
  }, [trackEvent])

  return {
    trackClick,
    trackFormSubmit,
    trackDocumentView,
    trackFundView,
    trackDirectInvestmentView,
    trackSearch,
    trackFilter,
    trackExport,
    trackDownload,
    trackEvent
  }
}

// Wrapper to handle Suspense boundary requirement
export function useActivityTracker() {
  return useActivityTrackerInternal()
}

