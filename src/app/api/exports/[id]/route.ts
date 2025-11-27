import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exportQueue } from '@/lib/exportQueue'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const job = await exportQueue.getJob(id)

    if (!job) {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 })
    }

    // Basic ownership check (job data carries userId)
    if (job.data?.userId && job.data.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const state = await job.getState()
    const progress = job.progress || 0
    const result = job.returnvalue || null
    const failedReason = job.failedReason || null

    return NextResponse.json({
      jobId: job.id,
      state,
      progress,
      result,
      failedReason,
      attemptsMade: job.attemptsMade,
      createdAt: job.timestamp,
      finishedOn: job.finishedOn,
    })
  } catch (error) {
    console.error('Export status error:', error)
    return NextResponse.json({ error: 'Failed to fetch export status' }, { status: 500 })
  }
}

