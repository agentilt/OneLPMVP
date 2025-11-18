'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Mail, Briefcase, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(
        errorParam === 'CredentialsSignin'
          ? 'Invalid email or password'
          : 'Please sign in to continue'
      )
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted!', { email, hasPassword: !!password })
    setError('')
    setLoading(true)

    try {
      console.log('Calling signIn with credentials provider...')
      console.log('Email:', email)
      console.log('Password length:', password.length)
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      console.log('SignIn result:', result)
      console.log('SignIn result error:', result?.error)
      console.log('SignIn result status:', result?.status)
      console.log('SignIn result ok:', result?.ok)

      if (!result) {
        console.error('No result from signIn')
        setError('Unable to sign in. Please try again.')
      } else if (result.error) {
        console.error('SignIn error:', result.error)
        setError(`Login failed: ${result.error}`)
      } else {
        console.log('Login successful!')
        
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Redirect based on user role
        try {
          const sessionResponse = await fetch('/api/auth/session')
          const session = await sessionResponse.json()
          
          if (session?.user?.role) {
            if (session.user.role === 'DATA_MANAGER') {
              window.location.href = '/data-manager'
            } else if (session.user.role === 'ADMIN') {
              window.location.href = '/admin'
            } else {
              window.location.href = '/dashboard'
            }
          } else {
            window.location.href = '/dashboard'
          }
        } catch (error) {
          console.error('Error fetching session:', error)
          window.location.href = '/dashboard'
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(`An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleButtonClick = () => {
    console.log('Button clicked!')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-lg bg-white dark:bg-surface border border-border shadow-sm mb-3">
            <Image
              src="/onelp-logo.png"
              alt="OneLP Logo"
              width={160}
              height={48}
              className="dark:invert"
            />
          </div>
          <p className="text-xs text-foreground/50 font-medium tracking-wide uppercase">Limited Partner Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-surface rounded-lg shadow-sm border border-border p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">Welcome Back</h2>
            <p className="text-sm text-foreground/50">Sign in to access your portfolio</p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-md">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-foreground/60 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-foreground/30" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-border rounded-md bg-white dark:bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-foreground/30" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-border rounded-md bg-white dark:bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  placeholder="*******"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              onClick={handleButtonClick}
              className="w-full mt-6 py-2.5 px-4 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="inline-block p-4 rounded-lg bg-white dark:bg-surface border border-border shadow-sm animate-pulse">
            <Image
              src="/onelp-logo.png"
              alt="OneLP Logo"
              width={160}
              height={48}
              className="dark:invert"
            />
          </div>
          <div className="text-foreground/60 text-sm font-medium">Loading...</div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

