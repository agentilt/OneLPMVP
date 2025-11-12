'use client'

import { Suspense } from 'react'
import { ActivityTrackerProviderInternal } from './ActivityTrackerProviderInternal'

/**
 * Provider component that initializes activity tracking
 * This should be added to the root layout
 * Wrapped in Suspense to handle useSearchParams() requirement
 */
export function ActivityTrackerProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ActivityTrackerProviderInternal>
        {children}
      </ActivityTrackerProviderInternal>
    </Suspense>
  )
}

