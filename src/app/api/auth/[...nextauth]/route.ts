import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

console.log('NextAuth API route - authOptions providers:', authOptions.providers?.length)
console.log('NextAuth API route - authOptions callbacks:', !!authOptions.callbacks)

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

