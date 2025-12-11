'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function TestMinimalLoginPage() {
  const [email, setEmail] = useState('demo@onelp.capital')
  const [password, setPassword] = useState('demo123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('MINIMAL: Form submitted!', { email, hasPassword: !!password })
    setError('')
    setLoading(true)

    try {
      console.log('MINIMAL: Calling signIn with credentials provider...')
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      console.log('MINIMAL: SignIn result:', result)
      console.log('MINIMAL: SignIn result error:', result?.error)
      console.log('MINIMAL: SignIn result status:', result?.status)
      console.log('MINIMAL: SignIn result ok:', result?.ok)

      if (!result) {
        console.error('MINIMAL: No result from signIn')
        setError('Unable to sign in. Please try again.')
      } else if (result.error) {
        console.error('MINIMAL: SignIn error:', result.error)
        setError(`Login failed: ${result.error}`)
      } else {
        console.log('MINIMAL: Login successful!')
        
        // Wait to see console output
        console.log('MINIMAL: Waiting 3 seconds to see console output...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Test session
        try {
          const sessionResponse = await fetch('/api/test-minimal-auth/session')
          const session = await sessionResponse.json()
          console.log('MINIMAL: Session data:', session)
          console.log('MINIMAL: Session user:', session?.user)
          console.log('MINIMAL: Session user role:', session?.user?.role)
        } catch (error) {
          console.error('MINIMAL: Session error:', error)
        }
      }
    } catch (err) {
      console.error('MINIMAL: Login error:', err)
      setError(`An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen glass-page flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-panel rounded-2xl shadow-2xl shadow-black/10 border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Minimal Auth Test
            </h1>
            <p className="text-foreground/70">
              Test with minimal NextAuth configuration
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-border rounded-xl bg-[var(--surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                placeholder="demo@onelp.capital"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-border rounded-xl bg-[var(--surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                placeholder="demo123"
              />
            </div>

            {error && (
              <div className="glass-panel border border-red-300/60 dark:border-red-800/60 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:bg-accent/60 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 shadow-lg shadow-accent/25"
            >
              {loading ? 'Signing in...' : 'Test Minimal Login'}
            </button>
          </form>

          <div className="mt-6 text-center space-x-4">
            <a 
              href="/test-simple-login" 
              className="text-accent hover:text-accent-hover text-sm font-medium"
            >
              Simple Login Test
            </a>
            <a 
              href="/login" 
              className="text-accent hover:text-accent-hover text-sm font-medium"
            >
              Regular Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
