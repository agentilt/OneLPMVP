import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

export class SessionTracker {
  /**
   * Start a new session for a user
   */
  static async startSession(
    userId: string,
    sessionToken: string,
    request?: NextRequest
  ): Promise<string> {
    try {
      const deviceInfo = this.extractDeviceInfo(request)
      const ipAddress = this.getClientIP(request)
      const userAgent = request?.headers.get('user-agent') || undefined

      // Calculate expiration (30 days default)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const session = await prisma.userSession.create({
        data: {
          userId,
          sessionToken,
          deviceInfo,
          ipAddress,
          userAgent,
          lastActivity: new Date(),
          expiresAt,
          isActive: true,
          pageViews: 0,
          actionsCount: 0
        }
      })

      return session.id
    } catch (error) {
      console.error('Failed to start session:', error)
      throw error
    }
  }

  /**
   * End a session and calculate duration
   */
  static async endSession(sessionId: string): Promise<void> {
    try {
      const session = await prisma.userSession.findUnique({
        where: { id: sessionId }
      })

      if (!session) {
        throw new Error('Session not found')
      }

      const endedAt = new Date()
      const durationMs = endedAt.getTime() - session.createdAt.getTime()
      const durationMinutes = Math.floor(durationMs / 60000)

      await prisma.userSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          endedAt,
          durationMinutes
        }
      })
    } catch (error) {
      console.error('Failed to end session:', error)
      throw error
    }
  }

  /**
   * Update session activity timestamp
   */
  static async updateActivity(sessionId: string): Promise<void> {
    try {
      await prisma.userSession.update({
        where: { id: sessionId },
        data: {
          lastActivity: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to update session activity:', error)
    }
  }

  /**
   * Get session duration in minutes
   */
  static async getSessionDuration(sessionId: string): Promise<number | null> {
    try {
      const session = await prisma.userSession.findUnique({
        where: { id: sessionId },
        select: {
          createdAt: true,
          endedAt: true,
          durationMinutes: true
        }
      })

      if (!session) {
        return null
      }

      // If session has ended, return stored duration
      if (session.endedAt && session.durationMinutes !== null) {
        return session.durationMinutes
      }

      // If session is still active, calculate current duration
      if (!session.endedAt) {
        const durationMs = new Date().getTime() - session.createdAt.getTime()
        return Math.floor(durationMs / 60000)
      }

      return null
    } catch (error) {
      console.error('Failed to get session duration:', error)
      return null
    }
  }

  /**
   * Get active sessions for a user
   */
  static async getActiveSessions(userId: string): Promise<any[]> {
    try {
      return await prisma.userSession.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          lastActivity: 'desc'
        }
      })
    } catch (error) {
      console.error('Failed to get active sessions:', error)
      return []
    }
  }

  /**
   * Mark inactive sessions as ended (sessions with no activity for 30+ minutes)
   */
  static async markInactiveSessionsAsEnded(): Promise<number> {
    try {
      const thirtyMinutesAgo = new Date()
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30)

      const inactiveSessions = await prisma.userSession.findMany({
        where: {
          isActive: true,
          lastActivity: {
            lt: thirtyMinutesAgo
          }
        }
      })

      let count = 0
      for (const session of inactiveSessions) {
        const endedAt = new Date()
        const durationMs = endedAt.getTime() - session.createdAt.getTime()
        const durationMinutes = Math.floor(durationMs / 60000)

        await prisma.userSession.update({
          where: { id: session.id },
          data: {
            isActive: false,
            endedAt,
            durationMinutes
          }
        })
        count++
      }

      return count
    } catch (error) {
      console.error('Failed to mark inactive sessions as ended:', error)
      return 0
    }
  }

  /**
   * Extract device information from request
   */
  private static extractDeviceInfo(request?: NextRequest): any {
    if (!request) return null

    const userAgent = request.headers.get('user-agent') || ''
    
    // Simple device detection (can be enhanced with a library like ua-parser-js)
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent)
    const isTablet = /iPad|Android/i.test(userAgent) && !/Mobile/i.test(userAgent)
    const isDesktop = !isMobile && !isTablet

    return {
      userAgent,
      isMobile,
      isTablet,
      isDesktop,
      platform: this.detectPlatform(userAgent)
    }
  }

  /**
   * Detect platform from user agent
   */
  private static detectPlatform(userAgent: string): string {
    if (/Windows/i.test(userAgent)) return 'Windows'
    if (/Mac/i.test(userAgent)) return 'macOS'
    if (/Linux/i.test(userAgent)) return 'Linux'
    if (/Android/i.test(userAgent)) return 'Android'
    if (/iOS|iPhone|iPad/i.test(userAgent)) return 'iOS'
    return 'Unknown'
  }

  /**
   * Get client IP from request
   */
  private static getClientIP(request?: NextRequest): string | undefined {
    if (!request) return undefined
    
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    return undefined
  }
}

