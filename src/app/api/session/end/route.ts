import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SessionTracker } from '@/lib/session-tracker'
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

    const body = await request.json().catch(() => ({}))
    const { sessionId } = body

    // If sessionId is provided, end that specific session
    if (sessionId) {
      const userSession = await prisma.userSession.findUnique({
        where: { id: sessionId },
        select: { userId: true }
      })

      // Verify the session belongs to the current user
      if (userSession && userSession.userId === session.user.id) {
        await SessionTracker.endSession(sessionId)
        return NextResponse.json({ success: true })
      }
    }

    // Otherwise, end all active sessions for the user
    const activeSessions = await prisma.userSession.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      }
    })

    for (const userSession of activeSessions) {
      await SessionTracker.endSession(userSession.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to end session:', error)
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    )
  }
}

