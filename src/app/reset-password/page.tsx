'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-xl shadow-accent/30 mb-4">
              <Image
                src="/onelp-logo.png"
                alt="OneLP Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              OneLP
            </h1>
            <p className="text-sm text-foreground/60 font-medium">Limited Partner Portal</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-800/60 p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Invalid Reset Link</h2>
            <p className="text-foreground/60 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-xl shadow-accent/30 mb-4">
              <Image
                src="/onelp-logo.png"
                alt="OneLP Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              OneLP
            </h1>
            <p className="text-sm text-foreground/60 font-medium">Limited Partner Portal</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-800/60 p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Password Reset Successful</h2>
            <p className="text-foreground/60 mb-6">
              Your password has been updated. Redirecting to login...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-foreground/50">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Redirecting...</span>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-xl shadow-accent/30 mb-4">
            <Image
              src="/onelp-logo.png"
              alt="OneLP Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            OneLP
          </h1>
          <p className="text-sm text-foreground/60 font-medium">Limited Partner Portal</p>
        </motion.div>

        {/* Reset Password Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-800/60 p-8"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
            <p className="text-sm text-foreground/60">Enter your new password below</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground/70 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-foreground/40" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-2 text-xs text-foreground/60">
                Must be at least 8 characters with one uppercase, one lowercase, one number, and one special character
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground/70 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-foreground/40" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-bold shadow-lg shadow-accent/25 hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-xl shadow-accent/30 flex items-center justify-center animate-pulse">
            <Image
              src="/onelp-logo.png"
              alt="OneLP Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
          </div>
          <div className="text-foreground font-medium">Loading...</div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

