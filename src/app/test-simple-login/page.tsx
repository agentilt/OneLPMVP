'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function TestSimpleLoginPage() {
  const [email, setEmail] = useState('demo@onelp.capital')
  const [password, setPassword] = useState('demo123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('SIMPLE: Form submitted!', { email, hasPassword: !!password })
    setError('')
    setLoading(true)

    try {
      console.log('SIMPLE: Calling signIn with credentials provider...')
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      console.log('SIMPLE: SignIn result:', result)
      console.log('SIMPLE: SignIn result error:', result?.error)
      console.log('SIMPLE: SignIn result status:', result?.status)
      console.log('SIMPLE: SignIn result ok:', result?.ok)

      if (!result) {
        console.error('SIMPLE: No result from signIn')
        setError('Unable to sign in. Please try again.')
      } else if (result.error) {
        console.error('SIMPLE: SignIn error:', result.error)
        setError(`Login failed: ${result.error}`)
      } else {
        console.log('SIMPLE: Login successful!')
        
        // Wait to see console output
        console.log('SIMPLE: Waiting 3 seconds to see console output...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Test session
        try {
          const sessionResponse = await fetch('/api/auth/session')
          const session = await sessionResponse.json()
          console.log('SIMPLE: Session data:', session)
          console.log('SIMPLE: Session user:', session?.user)
          console.log('SIMPLE: Session user role:', session?.user?.role)
        } catch (error) {
          console.error('SIMPLE: Session error:', error)
        }
        
        // Test credentials provider directly
        try {
          const credentialsTestResponse = await fetch('/api/test-credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          const credentialsTest = await credentialsTestResponse.json()
          console.log('SIMPLE: Credentials test result:', credentialsTest)
          console.log('SIMPLE: Credentials test status:', credentialsTest?.status)
        } catch (error) {
          console.error('SIMPLE: Credentials test error:', error)
        }
        
        // Test NextAuth configuration
        try {
          const nextAuthConfigResponse = await fetch('/api/test-nextauth-config')
          const nextAuthConfig = await nextAuthConfigResponse.json()
          console.log('SIMPLE: NextAuth config result:', nextAuthConfig)
          console.log('SIMPLE: NextAuth config status:', nextAuthConfig?.status)
          console.log('SIMPLE: NextAuth credentials provider exists:', nextAuthConfig?.credentialsProviderExists)
        } catch (error) {
          console.error('SIMPLE: NextAuth config test error:', error)
        }
        
        // Test if user exists in database
        try {
          const userExistsResponse = await fetch('/api/test-user-exists')
          const userExists = await userExistsResponse.json()
          console.log('SIMPLE: User exists result:', userExists)
          console.log('SIMPLE: User exists status:', userExists?.status)
          console.log('SIMPLE: User exists in database:', userExists?.userExists)
        } catch (error) {
          console.error('SIMPLE: User exists test error:', error)
        }
      }
    } catch (err) {
      console.error('SIMPLE: Login error:', err)
      setError(`An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Simple Auth Test
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Test with simplified NextAuth configuration
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="demo@onelp.capital"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="demo123"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? 'Signing in...' : 'Test Simple Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a 
              href="/login" 
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              Back to Regular Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
