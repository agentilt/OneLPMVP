'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [platformTermsAccepted, setPlatformTermsAccepted] = useState(false)
  const [websiteTermsAccepted, setWebsiteTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token')
      setValidating(false)
      return
    }

    // Validate token
    fetch(`/api/invitations/validate?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setTokenValid(true)
          setEmail(data.email)
        } else {
          setError(data.error || 'Invalid invitation token')
        }
      })
      .catch(() => {
        setError('Failed to validate invitation')
      })
      .finally(() => {
        setValidating(false)
      })
  }, [token])

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

    if (!platformTermsAccepted || !websiteTermsAccepted || !privacyAccepted) {
      setError('You must accept all terms and policies to register')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName,
          lastName,
          password,
          platformTermsAccepted,
          websiteTermsAccepted,
          privacyAccepted,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Redirect to login with success message
      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
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
          <div className="text-foreground font-medium">Validating invitation...</div>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="w-full max-w-md">
          {/* Logo and Branding */}
          <div className="text-center mb-8">
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
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-800/60 p-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Invalid Invitation</h2>
              <p className="text-foreground/60 mb-6">{error}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Login
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
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

        {/* Registration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-800/60 p-8"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Create Your Account</h2>
            <p className="text-sm text-foreground/60">Complete your registration to access your portfolio</p>
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
              <label htmlFor="email" className="block text-sm font-semibold text-foreground/70 mb-2">
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
                  disabled
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-70"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-foreground/70 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-foreground/40" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    placeholder="John"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-foreground/70 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-foreground/40" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground/70 mb-2">
                Password
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

            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-foreground/70 mb-3">Legal Agreements</p>
              
              <div className="flex items-start gap-3">
                <input
                  id="platformTerms"
                  type="checkbox"
                  checked={platformTermsAccepted}
                  onChange={(e) => setPlatformTermsAccepted(e.target.checked)}
                  required
                  className="mt-1 w-5 h-5 text-accent border-2 border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-accent focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="platformTerms" className="text-sm text-foreground/80 leading-relaxed">
                  I accept the{' '}
                  <Link href="/legal/platform-terms" target="_blank" className="text-accent hover:underline font-medium">
                    Platform Terms of Use
                  </Link>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="websiteTerms"
                  type="checkbox"
                  checked={websiteTermsAccepted}
                  onChange={(e) => setWebsiteTermsAccepted(e.target.checked)}
                  required
                  className="mt-1 w-5 h-5 text-accent border-2 border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-accent focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="websiteTerms" className="text-sm text-foreground/80 leading-relaxed">
                  I accept the{' '}
                  <Link href="/legal/website-terms" target="_blank" className="text-accent hover:underline font-medium">
                    Website Terms & Conditions
                  </Link>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="privacy"
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  required
                  className="mt-1 w-5 h-5 text-accent border-2 border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-accent focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="privacy" className="text-sm text-foreground/80 leading-relaxed">
                  I accept the{' '}
                  <Link href="/legal/privacy" target="_blank" className="text-accent hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </label>
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
            <p className="text-center text-sm text-foreground/60">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
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
      <RegisterForm />
    </Suspense>
  )
}

