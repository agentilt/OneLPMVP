import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SessionTracker } from '@/lib/session-tracker'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user already has an active session
    const existingSession = await prisma.userSession.findFirst({
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

    // If there's an active session, update its activity instead of creating a new one
    if (existingSession) {
      await SessionTracker.updateActivity(existingSession.id)
      return NextResponse.json({
        sessionId: existingSession.id,
        isNew: false
      })
    }

    // Generate a unique session token (using JWT token or random bytes)
    const sessionToken = randomBytes(32).toString('hex')

    // Create new session
    const sessionId = await SessionTracker.startSession(
      session.user.id,
      sessionToken,
      request
    )

    return NextResponse.json({
      sessionId,
      isNew: true
    })
  } catch (error) {
    console.error('Failed to start session:', error)
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    )
  }
}

