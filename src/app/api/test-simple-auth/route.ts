import NextAuth from 'next-auth'
import { authOptionsSimple } from '@/lib/auth-simple'

const handler = NextAuth(authOptionsSimple)

export { handler as GET, handler as POST }
