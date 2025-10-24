'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function TestSessionPage() {
  const { data: session, status } = useSession()
  const [serverSession, setServerSession] = useState(null)

  useEffect(() => {
    // Test server-side session
    fetch('/api/debug-auth')
      .then(res => res.json())
      .then(data => {
        console.log('Server session debug:', data)
        setServerSession(data)
      })
      .catch(err => console.error('Server session error:', err))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
          Session Debug Page
        </h1>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Client-Side Session
          </h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Session:</strong></p>
            <pre className="bg-slate-100 dark:bg-slate-700 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Server-Side Session
          </h2>
          <div className="space-y-2">
            <p><strong>Server Session:</strong></p>
            <pre className="bg-slate-100 dark:bg-slate-700 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(serverSession, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-6">
          <a 
            href="/login" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}
