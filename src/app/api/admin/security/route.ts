import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSecurityMetrics, getSecurityEvents, getActiveSessions, generateSecurityReport, cleanupSecurityData } from '@/lib/security-utils'
import { adminRateLimit, logSecurityEvent } from '@/lib/security-utils'
import { addSecurityHeaders } from '@/lib/security-middleware'

// Get security dashboard data
export async function GET(request: NextRequest) {
  // Apply admin rate limiting
  const rateLimitResponse = adminRateLimit(60 * 1000, 20)(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Require authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isAdmin = session.user.role === 'ADMIN'
    const currentUserId = session.user.id

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    
    let data: any = {}
    
    switch (reportType) {
      case 'overview':
        // Only admins can see overview
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          )
        }
        data = await generateSecurityReport()
        break
      case 'metrics':
        // Only admins can see metrics
        if (!isAdmin) {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          )
        }
        data = { metrics: await getSecurityMetrics() }
        break
      case 'events':
        let userId = searchParams.get('userId')
        // Non-admin users can only see their own events
        if (!isAdmin) {
          userId = currentUserId
        }
        const eventType = searchParams.get('eventType')
        const severity = searchParams.get('severity')
        const limit = parseInt(searchParams.get('limit') || '100')
        const offset = parseInt(searchParams.get('offset') || '0')
        
        data = {
          events: await getSecurityEvents(userId || undefined, eventType || undefined, severity || undefined, limit, offset)
        }
        break
      case 'sessions':
        let sessionUserId = searchParams.get('userId')
        // Non-admin users can only see their own sessions
        if (!isAdmin) {
          sessionUserId = currentUserId
        }
        data = {
          sessions: await getActiveSessions(sessionUserId || undefined)
        }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    const response = NextResponse.json(data)
    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Security dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    )
  }
}

// Cleanup security data and session management
export async function POST(request: NextRequest) {
  const rateLimitResponse = adminRateLimit(5 * 60 * 1000, 5)(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Require authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isAdmin = session.user.role === 'ADMIN'
    const currentUserId = session.user.id

    const { action, sessionId } = await request.json()
    
    if (action === 'cleanup') {
      // Only admins can cleanup
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      await cleanupSecurityData()
      
      // Log the cleanup action
      await logSecurityEvent(
        null,
        'SECURITY_CLEANUP',
        'Security data cleanup performed',
        'INFO',
        { timestamp: new Date().toISOString() },
        request
      )
      
      const response = NextResponse.json({
        message: 'Security data cleanup completed successfully'
      })
      
      return addSecurityHeaders(response)
    }

    if (action === 'revoke_session') {
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Session ID required' },
          { status: 400 }
        )
      }

      // Check if session belongs to user (or user is admin)
      const userSession = await prisma.userSession.findUnique({
        where: { id: sessionId },
        select: { userId: true }
      })

      if (!userSession) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }

      // Non-admin users can only revoke their own sessions
      if (!isAdmin && userSession.userId !== currentUserId) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      // Revoke the session
      await prisma.userSession.update({
        where: { id: sessionId },
        data: { isActive: false }
      })

      // Log the revocation
      await logSecurityEvent(
        userSession.userId,
        'SESSION_REVOKED',
        `Session revoked: ${sessionId}`,
        'INFO',
        { sessionId, revokedBy: currentUserId },
        request
      )

      const response = NextResponse.json({
        message: 'Session revoked successfully'
      })
      
      return addSecurityHeaders(response)
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Security operation error:', error)
    return NextResponse.json(
      { error: 'Failed to perform security operation' },
      { status: 500 }
    )
  }
}
