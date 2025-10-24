'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Mail, Briefcase, ArrowRight } from 'lucide-react'
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
      console.log('Calling signIn...')
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      console.log('SignIn result:', result)

      if (!result) {
        console.error('No result from signIn')
        setError('Unable to sign in. Please try again.')
      } else if (result.error) {
        console.error('SignIn error:', result.error)
        setError(`Login failed: ${result.error}`)
      } else {
        console.log('Login successful!')
        
        // Wait a moment to see console output before redirecting
        console.log('Waiting 3 seconds to see console output...')
        
        // Test user endpoint
        try {
          const userTestResponse = await fetch('/api/test-user')
          const userTest = await userTestResponse.json()
          console.log('User test result:', userTest)
        } catch (error) {
          console.error('User test error:', error)
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Try to get session data first
        try {
          const sessionResponse = await fetch('/api/auth/session')
          const session = await sessionResponse.json()
          console.log('Session data:', session)
          
          if (session?.user?.role) {
            console.log('Found user role:', session.user.role)
            console.log('Redirecting to test-session page to debug')
            window.location.href = '/test-session'
          } else {
            console.log('No session data found, redirecting to test-session page to debug')
            window.location.href = '/test-session'
          }
        } catch (error) {
          console.error('Error fetching session:', error)
          console.log('Redirecting to test-session page to debug')
          window.location.href = '/test-session'
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

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-800/60 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-sm text-foreground/60">Sign in to access your portfolio</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            </div>
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
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  placeholder="user@example.com"
                />
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
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  placeholder="*******"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              onClick={handleButtonClick}
              className="w-full py-4 px-6 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-bold shadow-lg shadow-accent/25 hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
            <p className="text-center text-sm text-foreground/60">
              Need an account? <span className="font-semibold text-accent">Contact your fund manager</span> for an invitation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  )
}

