'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { ThemeSelector } from '@/components/ThemeSelector'
import { User, Mail, Calendar, Shield, Key } from 'lucide-react'

interface UserInfo {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  name: string
  role: string
  createdAt: Date
}

interface SettingsClientProps {
  user: UserInfo
}

export function SettingsClient({ user }: SettingsClientProps) {
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePasswordResetRequest = async () => {
    setLoading(true)
    setError('')
    setResetEmailSent(false)

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })

      if (response.ok) {
        setResetEmailSent(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send reset email')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Settings</h1>
              <p className="text-foreground/60">
                Manage your account preferences and information
              </p>
            </div>

            {/* Theme Settings */}
            <div className="border rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Appearance</h2>
              <p className="text-sm text-foreground/60 mb-4">
                Customize the look and feel of your dashboard
              </p>
              <ThemeSelector />
            </div>

            {/* User Information */}
            <div className="border rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-foreground/60 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground/60">Name</p>
                    <p className="text-base">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-foreground/60 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground/60">Email</p>
                    <p className="text-base">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-foreground/60 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground/60">Role</p>
                    <p className="text-base capitalize">
                      {user.role.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-foreground/60 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground/60">Member Since</p>
                    <p className="text-base">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Reset */}
            <div className="border rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Key className="w-5 h-5 text-foreground/60 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">Password</h2>
                  <p className="text-sm text-foreground/60 mb-4">
                    Request a password reset link to be sent to your email
                  </p>

                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {resetEmailSent && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Password reset instructions have been sent to {user.email}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handlePasswordResetRequest}
                    disabled={loading || resetEmailSent}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Sending...' : resetEmailSent ? 'Email Sent' : 'Request Password Reset'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

