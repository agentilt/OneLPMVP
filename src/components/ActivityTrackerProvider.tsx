'use client'

import { useActivityTracker } from '@/hooks/useActivityTracker'
import { useEffect } from 'react'

/**
 * Provider component that initializes activity tracking
 * This should be added to the root layout
 */
export function ActivityTrackerProvider({ children }: { children: React.ReactNode }) {
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

