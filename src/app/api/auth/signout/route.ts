import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SessionTracker } from '@/lib/session-tracker'
import { AuditService } from '@/lib/audit'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (session?.user?.id) {
      // End all active sessions for the user
      const activeSessions = await prisma.userSession.findMany({
        where: {
          userId: session.user.id,
          isActive: true
        }
      })

      for (const userSession of activeSessions) {
        await SessionTracker.endSession(userSession.id)
      }

      // Log logout event
      await AuditService.logLogout(session.user.id, request)
    }

    // Return success - NextAuth will handle the actual signout via cookies
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to sign out:', error)
    // Still return success to allow signout to proceed
    return NextResponse.json({ success: true })
  }
}

