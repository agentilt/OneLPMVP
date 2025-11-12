'use client'

import { useActivityTracker } from '@/hooks/useActivityTracker'
import { useEffect } from 'react'

/**
 * Internal provider component that uses the activity tracker hook
 * This is wrapped in Suspense by ActivityTrackerProvider
 */
export function ActivityTrackerProviderInternal({ children }: { children: React.ReactNode }) {
  const activityTracker = useActivityTracker()

  // The hook handles all tracking automatically
  // We just need to mount it to start tracking
  useEffect(() => {
    // Activity tracking is now active
    // The useActivityTracker hook will automatically track:
    // - Page views on route changes
    // - Can be used to track clicks, form submissions, etc. via the returned functions
  }, [])

  return <>{children}</>
}

