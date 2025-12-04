import { neon } from '@neondatabase/serverless'

type NeonClient = ReturnType<typeof neon>

let cachedClient: NeonClient | null = null

export function getNeonClient(): NeonClient {
  if (cachedClient) return cachedClient

  // Only access DATABASE_URL at runtime, not during build
  if (typeof window !== 'undefined') {
    throw new Error('getNeonClient can only be used server-side')
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  cachedClient = neon(connectionString)
  return cachedClient
}
