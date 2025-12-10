'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DeleteAccountPage() {
  const router = useRouter()
  const [step, setStep] = useState<'warning' | 'confirm' | 'success'>('warning')
  const [confirmationText, setConfirmationText] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (confirmationText !== 'DELETE') {
      setError('Please type DELETE exactly as shown to confirm')
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmationText, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process deletion request')
      }

      setStep('success')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const backLink = (
    <Link
      href="/settings"
      className="inline-flex items-center text-foreground/70 hover:text-foreground mb-6 transition-colors"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Settings
    </Link>
  )

  if (step === 'warning') {
    return (
      <div className="min-h-screen glass-page">
        <div className="max-w-2xl mx-auto p-6 py-12">
          {backLink}

          <div className="glass-panel rounded-3xl border border-border shadow-2xl shadow-black/15 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl glass-panel bg-[var(--accent-100)] flex items-center justify-center text-accent shadow-inner shadow-black/10">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Delete Your Account</h1>
                <p className="text-foreground/70">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="space-y-4 text-foreground/90">
              <p className="text-lg font-semibold">⚠️ Warning: This action is permanent.</p>
              <p>Deleting your account will permanently remove:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/85">
                <li>Your account and profile information</li>
                <li>Access to all funds and investments</li>
                <li>All personal documents and data</li>
                <li>Your preferences and settings</li>
                <li>All active sessions and devices</li>
              </ul>

              <div className="glass-panel border border-border rounded-2xl p-4 bg-[color-mix(in_srgb,var(--accent-color) 10%,var(--surface))]">
                <p className="font-semibold mb-2 text-foreground">What we retain for compliance:</p>
                <ul className="text-sm space-y-1 text-foreground/80">
                  <li>• Anonymized audit logs (required by law)</li>
                  <li>• Transaction records (financial regulations)</li>
                  <li>• No personal identifying information</li>
                </ul>
              </div>

              <p className="mt-4">Before proceeding, consider:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/85">
                <li>Downloading your data (available in Settings)</li>
                <li>Saving any important documents locally</li>
                <li>Contacting support if you're having issues instead</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => router.push('/settings')}
                className="flex-1 px-6 py-3 rounded-xl border border-border bg-[var(--surface)] text-foreground font-semibold hover:bg-[var(--surface-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/32 transition-colors"
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen glass-page">
        <div className="max-w-2xl mx-auto p-6 py-12">
          {backLink}

          <div className="glass-panel rounded-3xl border border-border shadow-2xl shadow-black/15 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl glass-panel bg-[var(--accent-100)] flex items-center justify-center text-accent shadow-inner shadow-black/10">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Confirm Account Deletion</h1>
                <p className="text-foreground/70">We need to verify before processing.</p>
              </div>
            </div>

            <form onSubmit={handleRequestDeletion} className="space-y-6">
              {error && (
                <div className="glass-panel bg-[var(--accent-100)]/20 border border-border rounded-xl p-4 text-foreground">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Type <span className="font-mono font-bold text-accent">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-[var(--surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-sm text-foreground/70 mt-2">Must be typed exactly in capital letters.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Enter your password to verify:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your current password"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-[var(--surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  disabled={loading}
                />
              </div>

              <div className="glass-panel bg-[color-mix(in_srgb,var(--accent-color) 8%,var(--surface))] border border-border rounded-2xl p-4">
                <p className="text-sm text-foreground/85">
                  <strong>Next step:</strong> After clicking "Request Deletion", we'll send a confirmation email to your registered email address. You must click the link in that email to complete the deletion process. This is a security measure to prevent unauthorized account deletion.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setStep('warning')}
                  className="flex-1 px-6 py-3 rounded-xl border border-border bg-[var(--surface)] text-foreground font-semibold hover:bg-[var(--surface-hover)] transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || confirmationText !== 'DELETE' || !password}
                  className="flex-1 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/32 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Request Deletion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen glass-page flex items-center justify-center p-6">
        <div className="max-w-2xl w-full glass-panel rounded-3xl border border-border shadow-2xl shadow-black/15 p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full glass-panel bg-[var(--accent-100)] flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-foreground">Check Your Email</h1>

            <div className="glass-panel bg-[color-mix(in_srgb,var(--accent-color) 10%,var(--surface))] border border-border rounded-2xl p-6 text-left space-y-3">
              <p className="text-foreground/85">We've sent a confirmation email to your registered email address.</p>
              <p className="text-foreground/85"><strong>To complete the account deletion:</strong></p>
              <ol className="list-decimal pl-6 space-y-2 text-foreground/80">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the "Confirm Account Deletion" button in the email</li>
                <li>Your account will be permanently deleted</li>
              </ol>
              <div className="pt-4 border-t border-border/70">
                <p className="text-sm text-foreground/70">
                  <strong>Security note:</strong> The confirmation link expires in 24 hours. If you don't click it, your account will remain active and you can continue using OneLP normally.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full px-6 py-3 rounded-xl border border-border bg-[var(--surface)] text-foreground font-semibold hover:bg-[var(--surface-hover)] transition-colors"
              >
                Sign Out Now
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/32 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>

            <p className="text-sm text-foreground/60">
              Changed your mind? Simply don't click the confirmation link and your account will remain active.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
