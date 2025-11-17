'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function ConfirmDeleteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Invalid deletion link. No token provided.')
      return
    }

    const confirmDeletion = async () => {
      try {
        const response = await fetch(`/api/user/delete-account?token=${token}`, {
          method: 'DELETE'
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete account')
        }

        setStatus('success')
        
        // Sign out after 3 seconds
        setTimeout(() => {
          signOut({ callbackUrl: '/' })
        }, 3000)

      } catch (err: any) {
        setStatus('error')
        setError(err.message || 'An error occurred')
      }
    }

    confirmDeletion()
  }, [token])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Deleting Your Account...
          </h1>
          <p className="text-foreground/60">
            Please wait while we process your request
          </p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-border rounded-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-4">
              Account Deleted Successfully
            </h1>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6 text-left">
              <p className="text-foreground/90 mb-4">
                Your OneLP account has been permanently deleted.
              </p>

              <p className="text-sm text-foreground/70 mb-2">
                <strong>What was deleted:</strong>
              </p>
              <ul className="text-sm text-foreground/70 list-disc pl-6 space-y-1">
                <li>Your account and profile information</li>
                <li>All personal data and preferences</li>
                <li>Fund access and investment data</li>
                <li>Active sessions and authentication tokens</li>
              </ul>

              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                <p className="text-sm text-foreground/60">
                  <strong>Note:</strong> Anonymized audit logs have been retained for legal and compliance purposes as required by law. These logs contain no personally identifiable information.
                </p>
              </div>
            </div>

            <p className="text-foreground/60 mb-6">
              You will be automatically signed out in a few seconds...
            </p>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign Out Now
            </button>

            <p className="text-sm text-foreground/60 mt-6">
              Thank you for using OneLP. If you change your mind in the future, you're welcome to create a new account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-border rounded-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-4">
              Deletion Failed
            </h1>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
              <p className="text-foreground/90 mb-2">
                We couldn't delete your account:
              </p>
              <p className="text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/settings')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Return to Settings
              </button>
              <button
                onClick={() => router.push('/settings/delete-account')}
                className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-foreground rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Request New Deletion Link
              </button>
            </div>

            <p className="text-sm text-foreground/60 mt-6">
              If you continue to experience issues, please contact support at info@onelp.capital
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function ConfirmDeletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        </div>
      }
    >
      <ConfirmDeleteContent />
    </Suspense>
  )
}

