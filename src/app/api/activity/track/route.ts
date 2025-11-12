import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ActivityTracker, ActivityEventType } from '@/lib/activity-tracker'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { events } = body

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Invalid events array' },
        { status: 400 }
      )
    }

    // Get or create the user's active session
    let activeSession = await prisma.userSession.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // If no active session exists, create one
    if (!activeSession) {
      const { SessionTracker } = await import('@/lib/session-tracker')
      const { randomBytes } = await import('crypto')
      const sessionToken = randomBytes(32).toString('hex')
      
      try {
        const sessionId = await SessionTracker.startSession(
          session.user.id,
          sessionToken,
          request
        )
        activeSession = await prisma.userSession.findUnique({
          where: { id: sessionId }
        })
      } catch (error) {
        console.error('Failed to create session for activity tracking:', error)
      }
    }

    const sessionId = activeSession?.id

    // Prepare events with user context
    const activityEvents = events.map((event: any) => ({
      userId: session.user.id,
      eventType: event.eventType as ActivityEventType,
      route: event.route,
      resourceId: event.resourceId,
      resourceType: event.resourceType,
      action: event.action,
      element: event.element,
      metadata: event.metadata,
      sessionId,
      ipAddress: ActivityTracker.getClientIP(request),
      userAgent: ActivityTracker.getUserAgent(request)
    }))

    // Track events in batch
    await ActivityTracker.trackBatch(activityEvents)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to track activity events:', error)
    return NextResponse.json(
      { error: 'Failed to track activity events' },
      { status: 500 }
    )
  }
}

