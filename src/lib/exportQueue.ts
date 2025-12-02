import { Queue } from 'bullmq'
import { getRedisClient } from './redis'

// Build a single shared queue instance, but fail-soft during build or when Redis
// isn't configured so Next.js static analysis doesn't blow up.
function createExportQueue(): Queue | null {
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

  if (isBuildPhase) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[exportQueue] Skipping queue setup during build phase')
    }
    return null
  }

  if (process.env.SKIP_EXPORT_QUEUE === 'true') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[exportQueue] Export queue disabled via SKIP_EXPORT_QUEUE')
    }
    return null
  }

  if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[exportQueue] REDIS_URL not set; export queue disabled')
    }
    return null
  }

  return new Queue('export-jobs', {
    connection: getRedisClient(),
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  })
}

export const exportQueue = createExportQueue()

export function getExportQueue(): Queue | null {
  return exportQueue
}
