import { neon, NeonQueryFunction } from '@neondatabase/serverless'

let cachedClient: NeonQueryFunction<any> | null = null

export function getNeonClient(): NeonQueryFunction<any> {
  if (cachedClient) return cachedClient

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  cachedClient = neon(connectionString)
  return cachedClient
}
