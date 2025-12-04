import { neon, NeonQueryFunction } from '@neondatabase/serverless'

let cachedClient: NeonQueryFunction<any> | null = null

export function getNeonClient(): NeonQueryFunction<any> {
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
