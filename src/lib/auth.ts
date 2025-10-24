import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/db'

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

function isRateLimited(email: string): boolean {
  const attempts = loginAttempts.get(email)
  if (!attempts) return false
  
  const now = Date.now()
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(email)
    return false
  }
  
  return attempts.count >= MAX_LOGIN_ATTEMPTS
}

function recordLoginAttempt(email: string, success: boolean): void {
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 }
  
  if (success) {
    loginAttempts.delete(email)
  } else {
    attempts.count += 1
    attempts.lastAttempt = Date.now()
    loginAttempts.set(email, attempts)
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        mfaToken: { label: 'MFA Token', type: 'text', optional: true }
      },
      async authorize(credentials) {
        console.log('=== CREDENTIALS PROVIDER CALLED ===')
        console.log('Credentials provider - authorize called with:', { email: credentials?.email })
        console.log('Credentials provider - credentials object:', credentials)
        console.log('Credentials provider - credentials type:', typeof credentials)
        console.log('Credentials provider - credentials keys:', credentials ? Object.keys(credentials) : 'null')
        
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Credentials provider - missing credentials')
            return null
          }

          // Check rate limiting
          if (isRateLimited(credentials.email)) {
            console.warn(`Rate limited login attempt for ${credentials.email}`)
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              mfaSettings: true
            }
          })

          if (!user) {
            console.log('Credentials provider - user not found')
            recordLoginAttempt(credentials.email, false)
            return null
          }

          // Check if user is locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            console.warn(`Locked user attempted login: ${credentials.email}`)
            return null
          }

          console.log('Credentials provider - checking password...')
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('Credentials provider - password valid:', isPasswordValid)
          if (!isPasswordValid) {
            console.log('Credentials provider - invalid password')
            // Increment login attempts
            const newAttempts = (user.loginAttempts || 0) + 1
            const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
            
            await prisma.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: newAttempts,
                lockedUntil: lockUntil
              }
            })

            recordLoginAttempt(credentials.email, false)
            return null
          }

          // Check MFA if enabled (skip for demo users)
          const isDemoUser = user.email === 'demo@onelp.capital'
          console.log('Credentials provider - isDemoUser:', isDemoUser, 'mfaEnabled:', user.mfaEnabled)
          
          if (user.mfaEnabled && user.mfaSettings?.enabled && !isDemoUser) {
            if (!credentials.mfaToken) {
              // Return special indicator for MFA required
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                mfaRequired: true
              }
            }

            // Verify MFA token
            const isValidMFA = await verifyMFAToken(credentials.mfaToken, user.id)
            if (!isValidMFA) {
              recordLoginAttempt(credentials.email, false)
              return null
            }
          }

          // Reset login attempts on successful login
          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date()
            }
          })

          // Record successful login
          recordLoginAttempt(credentials.email, true)

          // Log security event
          await prisma.securityEvent.create({
            data: {
              userId: user.id,
              eventType: 'LOGIN_SUCCESS',
              description: 'Successful login',
              severity: 'INFO'
            }
          })

          const result = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            mfaRequired: false,
            mfaEnabled: user.mfaEnabled
          }
          console.log('Credentials provider - returning user:', result)
          return result
        } catch (error) {
          console.error('Credentials provider - error:', error)
          console.error('Credentials provider - error stack:', error instanceof Error ? error.stack : 'No stack')
          console.error('Credentials provider - error name:', error instanceof Error ? error.name : 'No name')
          console.error('Credentials provider - error message:', error instanceof Error ? error.message : 'No message')
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT callback - user:', user)
      console.log('JWT callback - token:', token)
      
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.mfaRequired = (user as any).mfaRequired || false
        token.mfaEnabled = (user as any).mfaEnabled || false
        token.iat = Math.floor(Date.now() / 1000)
      }
      
      console.log('JWT callback - final token:', token)
      return token
    },
    async session({ session, token }) {
      console.log('Session callback - token:', token)
      console.log('Session callback - session:', session)
      
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = (token as any).role
        (session.user as any).mfaRequired = (token as any).mfaRequired
        (session.user as any).mfaEnabled = (token as any).mfaEnabled
      }
      
      console.log('Session callback - final session:', session)
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 4 * 60 * 60, // 4 hours (reduced from 8 hours)
    updateAge: 30 * 60, // 30 minutes (reduced from 2 hours)
  },
  jwt: {
    maxAge: 4 * 60 * 60, // 4 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Only set domain for onelp.capital, not for Vercel URLs
        domain: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.includes('onelp.capital') ? '.onelp.capital' : undefined,
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Only set domain for onelp.capital, not for Vercel URLs
        domain: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.includes('onelp.capital') ? '.onelp.capital' : undefined,
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}

// Helper function to verify MFA token
async function verifyMFAToken(token: string, userId: string): Promise<boolean> {
  try {
    const { verifyMFAToken: verifyToken } = await import('@/lib/token-security')
    const result = await verifyToken(token)
    return result.userId === userId && result.valid
  } catch (error) {
    console.error('MFA verification error:', error)
    return false
  }
}

