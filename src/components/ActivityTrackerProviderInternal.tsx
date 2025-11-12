'use client'

import { useActivityTracker } from '@/hooks/useActivityTracker'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Internal provider component that uses the activity tracker hook
 * This is wrapped in Suspense by ActivityTrackerProvider
 */
export function ActivityTrackerProviderInternal({ children }: { children: React.ReactNode }) {
  const activityTracker = useActivityTracker()
  const { data: session, status } = useSession()

  // Start session when user is authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      // Create or update session
      // Use a small delay to ensure the session is created after page load
      const timer = setTimeout(() => {
        fetch('/api/session/start', {
          method: 'POST',
          credentials: 'include'
        }).catch(error => {
          console.error('Failed to start session:', error)
          // Don't block the app if session creation fails
        })
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [status, session])

  // End session on unmount or when user logs out
  useEffect(() => {
    return () => {
      if (status === 'authenticated' && session?.user?.id) {
        // Note: This will run on unmount, but we can't reliably detect logout here
        // Session ending is better handled in the logout API endpoint
      }
    }
  }, [status, session])

  return <>{children}</>
}

