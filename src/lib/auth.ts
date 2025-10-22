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
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
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
          where: { email: credentials.email }
        })

        if (!user) {
          recordLoginAttempt(credentials.email, false)
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          recordLoginAttempt(credentials.email, false)
          return null
        }

        // Record successful login
        recordLoginAttempt(credentials.email, true)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.iat = Math.floor(Date.now() / 1000)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = (token as any).role
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
    maxAge: 8 * 60 * 60, // 8 hours (reduced from 30 days)
    updateAge: 2 * 60 * 60, // 2 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
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

