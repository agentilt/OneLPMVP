import { Queue } from 'bullmq'
import { getRedisClient } from './redis'

// Shared export job queue for report/fund/risk exports
export const exportQueue = new Queue('export-jobs', {
  connection: getRedisClient(),
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
  },
})

