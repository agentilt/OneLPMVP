import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/db'
import { getCurrentSecret } from '@/lib/token-security'

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
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        mfaToken: { label: 'MFA Token', type: 'text', optional: true }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
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
            mFASettings: true
          }
        })

        if (!user) {
          recordLoginAttempt(credentials.email, false)
          return null
        }

        // Check if user is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          console.warn(`Locked user attempted login: ${credentials.email}`)
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
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

        // Check MFA if enabled
        if (user.mfaEnabled && user.mFASettings?.enabled) {
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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mfaEnabled: user.mfaEnabled
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.mfaRequired = (user as any).mfaRequired || false
        token.mfaEnabled = (user as any).mfaEnabled || false
        token.iat = Math.floor(Date.now() / 1000)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = (token as any).role
        (session.user as any).mfaRequired = (token as any).mfaRequired
        (session.user as any).mfaEnabled = (token as any).mfaEnabled
      }
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
  secret: getCurrentSecret(), // Use rotating secret
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
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '') : undefined,
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '') : undefined,
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

