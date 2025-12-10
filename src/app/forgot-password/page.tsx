'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, ArrowRight, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to send reset email. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center glass-page p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-panel shadow-xl shadow-accent/20 mb-4">
            <Image src="/onelp-logo.png" alt="OneLP Logo" width={40} height={40} className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">OneLP</h1>
          <p className="text-sm text-foreground/60 font-medium">Limited Partner Portal</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className="glass-panel rounded-2xl shadow-2xl shadow-black/10 border border-border p-8"
        >
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--accent-100)] flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold">Check Your Email</h2>
              <p className="text-foreground/70">
                If an account with <strong>{email}</strong> exists, we've sent you a password reset link. Please check your inbox and follow the instructions.
              </p>
              <p className="text-sm text-foreground/60">The reset link will expire in 15 minutes.</p>
              <div className="flex justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/32 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Forgot Password?</h2>
                <p className="text-sm text-foreground/70">Enter your email address and we'll send you a link to reset your password</p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 glass-panel bg-[var(--accent-100)]/20 border border-border rounded-xl"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground font-medium">{error}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground/80 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-foreground/40" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-border rounded-xl bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold shadow-lg shadow-accent/20 hover:shadow-accent/32 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-border/70">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center glass-page">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl glass-panel shadow-xl shadow-accent/20 flex items-center justify-center animate-pulse">
              <Image src="/onelp-logo.png" alt="OneLP Logo" width={40} height={40} className="w-10 h-10" />
            </div>
            <div className="text-foreground font-medium">Loading...</div>
          </div>
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  )
}
