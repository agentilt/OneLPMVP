import { NextRequest, NextResponse } from 'next/server'
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
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    
    let data: any = {}
    
    switch (reportType) {
      case 'overview':
        data = await generateSecurityReport()
        break
      case 'metrics':
        data = { metrics: await getSecurityMetrics() }
        break
      case 'events':
        const userId = searchParams.get('userId')
        const eventType = searchParams.get('eventType')
        const severity = searchParams.get('severity')
        const limit = parseInt(searchParams.get('limit') || '100')
        const offset = parseInt(searchParams.get('offset') || '0')
        
        data = {
          events: await getSecurityEvents(userId || undefined, eventType || undefined, severity || undefined, limit, offset)
        }
        break
      case 'sessions':
        const sessionUserId = searchParams.get('userId')
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

// Cleanup security data
export async function POST(request: NextRequest) {
  const rateLimitResponse = adminRateLimit(5 * 60 * 1000, 5)(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { action } = await request.json()
    
    if (action === 'cleanup') {
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
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Security cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to perform security cleanup' },
      { status: 500 }
    )
  }
}
