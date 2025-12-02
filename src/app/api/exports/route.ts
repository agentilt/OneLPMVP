import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exportQueue } from '@/lib/exportQueue'

// Basic enqueue endpoint for exports (reports, funds, etc.)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
  const { type = 'report', format = 'xlsx', payload = {} } = body || {}

    if (!['report', 'fund', 'risk', 'custom'].includes(type)) {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    if (!['xlsx', 'pdf', 'csv'].includes(format)) {
      return NextResponse.json({ error: 'Invalid export format' }, { status: 400 })
    }

    if (!exportQueue) {
      return NextResponse.json(
        { error: 'Export queue is not configured. Check REDIS_URL / SKIP_EXPORT_QUEUE.' },
        { status: 503 }
      )
    }

    const job = await exportQueue.add(
      'export',
      {
        type,
        format,
        payload,
        userId: session.user.id,
        requestedAt: new Date().toISOString(),
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }
    )

    return NextResponse.json({ jobId: job.id })
  } catch (error) {
    console.error('Export enqueue error:', error)
    return NextResponse.json({ error: 'Failed to enqueue export' }, { status: 500 })
  }
}
