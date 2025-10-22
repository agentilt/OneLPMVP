import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cleanupExpiredTokens } from '@/lib/token-security'

// Security monitoring and maintenance utilities

export interface SecurityMetrics {
  totalUsers: number
  activeSessions: number
  failedLogins: number
  mfaEnabledUsers: number
  recentSecurityEvents: number
  lockedUsers: number
}

export async function getSecurityMetrics(): Promise<SecurityMetrics> {
  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    activeSessions,
    failedLogins,
    mfaEnabledUsers,
    recentSecurityEvents,
    lockedUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.userSession.count({
      where: {
        isActive: true,
        expiresAt: { gt: now }
      }
    }),
    prisma.securityEvent.count({
      where: {
        eventType: 'LOGIN_FAILED',
        createdAt: { gte: last24Hours }
      }
    }),
    prisma.user.count({
      where: { mfaEnabled: true }
    }),
    prisma.securityEvent.count({
      where: {
        createdAt: { gte: last24Hours }
      }
    }),
    prisma.user.count({
      where: {
        lockedUntil: { gt: now }
      }
    })
  ])

  return {
    totalUsers,
    activeSessions,
    failedLogins,
    mfaEnabledUsers,
    recentSecurityEvents,
    lockedUsers
  }
}

export async function cleanupSecurityData(): Promise<void> {
  const now = new Date()
  
  // Clean up expired tokens
  await cleanupExpiredTokens()
  
  // Clean up old security events (keep last 90 days)
  const cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  
  await prisma.securityEvent.deleteMany({
    where: {
      createdAt: { lt: cutoffDate }
    }
  })
  
  // Clean up old sessions
  await prisma.userSession.deleteMany({
    where: {
      expiresAt: { lt: now }
    }
  })
  
  // Clean up inactive sessions (older than 7 days)
  const inactiveCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  await prisma.userSession.deleteMany({
    where: {
      lastActivity: { lt: inactiveCutoff }
    }
  })
}

export async function lockUser(userId: string, reason: string, duration: number = 15 * 60 * 1000): Promise<void> {
  const lockedUntil = new Date(Date.now() + duration)
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      lockedUntil,
      loginAttempts: 5 // Max attempts
    }
  })
  
  await prisma.securityEvent.create({
    data: {
      userId,
      eventType: 'USER_LOCKED',
      description: `User locked: ${reason}`,
      severity: 'WARNING'
    }
  })
}

export async function unlockUser(userId: string, reason: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lockedUntil: null,
      loginAttempts: 0
    }
  })
  
  await prisma.securityEvent.create({
    data: {
      userId,
      eventType: 'USER_UNLOCKED',
      description: `User unlocked: ${reason}`,
      severity: 'INFO'
    }
  })
}

export async function revokeAllUserSessions(userId: string, reason: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { userId },
    data: {
      isActive: false
    }
  })
  
  await prisma.securityEvent.create({
    data: {
      userId,
      eventType: 'SESSIONS_REVOKED',
      description: `All sessions revoked: ${reason}`,
      severity: 'WARNING'
    }
  })
}

export async function getSecurityEvents(
  userId?: string,
  eventType?: string,
  severity?: string,
  limit: number = 100,
  offset: number = 0
) {
  const where: any = {}
  
  if (userId) where.userId = userId
  if (eventType) where.eventType = eventType
  if (severity) where.severity = severity
  
  return prisma.securityEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  })
}

export async function getActiveSessions(userId?: string) {
  const now = new Date()
  const where: any = {
    isActive: true,
    expiresAt: { gt: now }
  }
  
  if (userId) where.userId = userId
  
  return prisma.userSession.findMany({
    where,
    orderBy: { lastActivity: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  })
}

export async function generateSecurityReport(): Promise<{
  metrics: SecurityMetrics
  recentEvents: any[]
  activeSessions: any[]
  recommendations: string[]
}> {
  const metrics = await getSecurityMetrics()
  const recentEvents = await getSecurityEvents(undefined, undefined, undefined, 50)
  const activeSessions = await getActiveSessions()
  
  const recommendations: string[] = []
  
  // Generate recommendations based on metrics
  if (metrics.failedLogins > 10) {
    recommendations.push('High number of failed login attempts detected. Consider implementing additional security measures.')
  }
  
  if (metrics.lockedUsers > 0) {
    recommendations.push(`${metrics.lockedUsers} users are currently locked. Review and unlock if necessary.`)
  }
  
  if (metrics.mfaEnabledUsers / metrics.totalUsers < 0.5) {
    recommendations.push('Low MFA adoption rate. Consider encouraging users to enable MFA.')
  }
  
  if (metrics.recentSecurityEvents > 100) {
    recommendations.push('High number of security events. Review security logs for potential issues.')
  }
  
  return {
    metrics,
    recentEvents,
    activeSessions,
    recommendations
  }
}

// Security middleware for admin endpoints
export function requireAdminAuth(handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context: any) => {
    // This would integrate with your existing auth system
    // For now, we'll assume the auth check is done in middleware
    
    try {
      return await handler(req, context)
    } catch (error) {
      console.error('Admin endpoint error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Rate limiting for admin operations
export function adminRateLimit(windowMs: number = 60 * 1000, maxRequests: number = 10) {
  const attempts = new Map<string, { count: number; resetTime: number }>()
  
  return (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const key = `admin-${ip}`
    
    const current = attempts.get(key)
    
    if (!current || current.resetTime < now) {
      attempts.set(key, { count: 1, resetTime: now + windowMs })
      return null
    }
    
    if (current.count >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many admin requests' },
        { status: 429 }
      )
    }
    
    current.count++
    attempts.set(key, current)
    return null
  }
}

// Security event logging
export async function logSecurityEvent(
  userId: string | null,
  eventType: string,
  description: string,
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO',
  metadata?: any,
  req?: NextRequest
) {
  await prisma.securityEvent.create({
    data: {
      userId,
      eventType,
      description,
      severity,
      metadata,
      ipAddress: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || null,
      userAgent: req?.headers.get('user-agent') || null
    }
  })
}

// Password strength analysis
export function analyzePasswordStrength(password: string): {
  score: number
  feedback: string[]
  recommendations: string[]
} {
  const feedback: string[] = []
  const recommendations: string[] = []
  let score = 0
  
  // Length check
  if (password.length >= 12) {
    score += 2
  } else if (password.length >= 8) {
    score += 1
    feedback.push('Consider using a longer password')
  } else {
    feedback.push('Password is too short')
  }
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z\d]/.test(password)) score += 1
  
  // Pattern checks
  if (/(.)\1{2,}/.test(password)) {
    score -= 1
    feedback.push('Avoid repeating characters')
  }
  
  if (/123|234|345|456|567|678|789|890/.test(password)) {
    score -= 1
    feedback.push('Avoid sequential numbers')
  }
  
  // Recommendations
  if (score < 4) {
    recommendations.push('Use a mix of uppercase, lowercase, numbers, and special characters')
  }
  if (password.length < 12) {
    recommendations.push('Use at least 12 characters')
  }
  if (!/[^a-zA-Z\d]/.test(password)) {
    recommendations.push('Include special characters')
  }
  
  return {
    score: Math.max(0, Math.min(10, score)),
    feedback,
    recommendations
  }
}
