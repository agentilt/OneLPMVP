import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptionsMinimal: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('MINIMAL: Credentials provider - authorize called with:', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('MINIMAL: Missing credentials')
          return null
        }

        // Simple test - just return a user object
        if (credentials.email === 'demo@onelp.capital' && credentials.password === 'demo123') {
          const user = {
            id: 'minimal-test-user-id',
            email: 'demo@onelp.capital',
            name: 'Demo User',
            role: 'USER' as const
          }
          console.log('MINIMAL: Returning user:', user)
          return user
        }

        console.log('MINIMAL: Invalid credentials')
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('MINIMAL: JWT callback - user:', user)
      console.log('MINIMAL: JWT callback - token:', token)
      
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      
      console.log('MINIMAL: JWT callback - final token:', token)
      return token
    },
    async session({ session, token }) {
      console.log('MINIMAL: Session callback - token:', token)
      console.log('MINIMAL: Session callback - session:', session)
      
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = (token as any).role
      }
      
      console.log('MINIMAL: Session callback - final session:', session)
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: true,
}
