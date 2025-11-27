import { Redis } from 'ioredis'

declare global {
  // eslint-disable-next-line no-var
  var redisClient: Redis | undefined
}

export function getRedisClient() {
  if (global.redisClient) {
    return global.redisClient
  }

  const url = process.env.REDIS_URL
  if (!url) {
    throw new Error('Missing REDIS_URL environment variable')
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    enableAutoPipelining: true,
    tls: url.startsWith('rediss://') ? {} : undefined,
  })

  global.redisClient = client
  return client
}

