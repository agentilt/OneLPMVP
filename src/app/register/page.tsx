'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

    setLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          password,
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          <p className="mt-4 text-foreground/60">Validating invitation...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">EuroLP</h1>
            <p className="text-sm text-foreground/60">Limited Partner Portal</p>
          </div>

          <div className="border rounded-lg p-8 bg-background shadow-sm">
            <div className="text-center">
              <div className="text-red-600 dark:text-red-400 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
              <p className="text-foreground/60 mb-6">{error}</p>
              <Link
                href="/login"
                className="inline-block px-6 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">EuroLP</h1>
          <p className="text-sm text-foreground/60">Limited Partner Portal</p>
        </div>

        <div className="border rounded-lg p-8 bg-background shadow-sm">
          <h2 className="text-2xl font-semibold mb-6">Create Account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-foreground/5 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-foreground/60">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-foreground text-background rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/60">
            Already have an account?{' '}
            <Link href="/login" className="underline hover:opacity-70">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}

