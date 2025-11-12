import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

export enum ActivityEventType {
  PAGE_VIEW = 'PAGE_VIEW',
  CLICK = 'CLICK',
  FORM_SUBMIT = 'FORM_SUBMIT',
  DOWNLOAD = 'DOWNLOAD',
  SEARCH = 'SEARCH',
  FILTER = 'FILTER',
  SORT = 'SORT',
  EXPORT = 'EXPORT',
  PRINT = 'PRINT',
  SHARE = 'SHARE',
  COPY = 'COPY',
  NAVIGATE = 'NAVIGATE',
  VIEW_DOCUMENT = 'VIEW_DOCUMENT',
  VIEW_FUND = 'VIEW_FUND',
  VIEW_DIRECT_INVESTMENT = 'VIEW_DIRECT_INVESTMENT',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE'
}

export interface ActivityEventData {
  userId: string
  eventType: ActivityEventType
  route?: string
  resourceId?: string
  resourceType?: string
  action?: string
  element?: string
  metadata?: any
  sessionId?: string
  ipAddress?: string
  userAgent?: string
}

export class ActivityTracker {
  /**
   * Track a single activity event
   */
  static async track(data: ActivityEventData): Promise<void> {
    try {
      await prisma.activityEvent.create({
        data: {
          userId: data.userId,
          eventType: data.eventType,
          route: data.route,
          resourceId: data.resourceId,
          resourceType: data.resourceType,
          action: data.action,
          element: data.element,
          metadata: data.metadata || undefined,
          sessionId: data.sessionId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      })

      // Update session stats if sessionId is provided
      if (data.sessionId) {
        await this.updateSessionStats(data.sessionId, data.eventType)
      }
    } catch (error) {
      console.error('Failed to track activity event:', error)
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Track multiple activity events in batch
   */
  static async trackBatch(events: ActivityEventData[]): Promise<void> {
    try {
      await prisma.activityEvent.createMany({
        data: events.map(event => ({
          userId: event.userId,
          eventType: event.eventType,
          route: event.route,
          resourceId: event.resourceId,
          resourceType: event.resourceType,
          action: event.action,
          element: event.element,
          metadata: event.metadata || undefined,
          sessionId: event.sessionId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent
        }))
      })

      // Update session stats for unique sessions
      const uniqueSessionIds = [...new Set(events.map(e => e.sessionId).filter(Boolean))]
      for (const sessionId of uniqueSessionIds) {
        if (sessionId) {
          const sessionEvents = events.filter(e => e.sessionId === sessionId)
          for (const event of sessionEvents) {
            await this.updateSessionStats(sessionId, event.eventType)
          }
        }
      }
    } catch (error) {
      console.error('Failed to track activity events batch:', error)
    }
  }

  /**
   * Update session statistics based on activity
   */
  private static async updateSessionStats(sessionId: string, eventType: ActivityEventType): Promise<void> {
    try {
      const isPageView = eventType === ActivityEventType.PAGE_VIEW
      const isAction = [
        ActivityEventType.CLICK,
        ActivityEventType.FORM_SUBMIT,
        ActivityEventType.DOWNLOAD,
        ActivityEventType.SEARCH,
        ActivityEventType.FILTER,
        ActivityEventType.SORT,
        ActivityEventType.EXPORT,
        ActivityEventType.PRINT,
        ActivityEventType.SHARE,
        ActivityEventType.COPY
      ].includes(eventType)

      const updateData: any = {}
      if (isPageView) {
        updateData.pageViews = { increment: 1 }
      }
      if (isAction) {
        updateData.actionsCount = { increment: 1 }
      }
      updateData.lastActivity = new Date()

      if (Object.keys(updateData).length > 0) {
        await prisma.userSession.update({
          where: { id: sessionId },
          data: updateData
        })
      }
    } catch (error) {
      console.error('Failed to update session stats:', error)
    }
  }

  /**
   * Get client IP from request
   */
  static getClientIP(request?: NextRequest): string | undefined {
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

  /**
   * Get user agent from request
   */
  static getUserAgent(request?: NextRequest): string | undefined {
    if (!request) return undefined
    return request.headers.get('user-agent') || undefined
  }
}

