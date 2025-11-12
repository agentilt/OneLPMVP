import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'DATA_MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')

    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    const whereClause: any = {}
    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter
    }
    if (userId) {
      whereClause.userId = userId
    }

    // Get user activity summary
    const [
      totalUsers,
      activeUsers,
      totalSessions,
      activeSessions,
      totalPageViews,
      totalActions,
      sessionsByDay,
      topPages,
      topUsers,
      activityByType
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users (users with activity in date range)
      userId
        ? 1
        : prisma.activityEvent.findMany({
            where: whereClause,
            select: { userId: true },
            distinct: ['userId']
          }).then(events => events.length),

      // Total sessions
      prisma.userSession.count({
        where: userId ? { userId } : {}
      }),

      // Active sessions
      prisma.userSession.count({
        where: {
          ...(userId ? { userId } : {}),
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      }),

      // Total page views
      prisma.activityEvent.count({
        where: {
          ...whereClause,
          eventType: 'PAGE_VIEW'
        }
      }),

      // Total actions
      prisma.activityEvent.count({
        where: {
          ...whereClause,
          eventType: {
            in: ['CLICK', 'FORM_SUBMIT', 'DOWNLOAD', 'SEARCH', 'FILTER', 'EXPORT']
          }
        }
      }),

      // Sessions by day (last 30 days) - using Prisma query instead of raw SQL
      (async () => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const sessions = await prisma.userSession.findMany({
          where: {
            ...(userId ? { userId } : {}),
            createdAt: { gte: thirtyDaysAgo }
          },
          select: {
            createdAt: true
          }
        })

        // Group by day
        const sessionsByDayMap = new Map<string, number>()
        sessions.forEach(session => {
          const date = session.createdAt.toISOString().split('T')[0]
          sessionsByDayMap.set(date, (sessionsByDayMap.get(date) || 0) + 1)
        })

        return Array.from(sessionsByDayMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 30)
      })(),

      // Top pages
      prisma.activityEvent.groupBy({
        by: ['route'],
        where: {
          ...whereClause,
          eventType: 'PAGE_VIEW',
          route: { not: null }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      }),

      // Top users by activity
      prisma.activityEvent.groupBy({
        by: ['userId'],
        where: whereClause,
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      }),

      // Activity by type
      prisma.activityEvent.groupBy({
        by: ['eventType'],
        where: whereClause,
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })
    ])

    // Get user details for top users
    const topUserIds = topUsers.map(u => u.userId)
    const topUserDetails = await prisma.user.findMany({
      where: {
        id: { in: topUserIds }
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true
      }
    })

    const topUsersWithDetails = topUsers.map(tu => {
      const user = topUserDetails.find(u => u.id === tu.userId)
      return {
        userId: tu.userId,
        count: tu._count.id,
        user: user ? {
          email: user.email,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()
        } : null
      }
    })

    // Calculate average session duration
    const sessionsWithDuration = await prisma.userSession.findMany({
      where: {
        ...(userId ? { userId } : {}),
        durationMinutes: { not: null },
        ...(Object.keys(dateFilter).length > 0 ? {
          createdAt: dateFilter
        } : {})
      },
      select: {
        durationMinutes: true
      }
    })

    const avgSessionDuration = sessionsWithDuration.length > 0
      ? sessionsWithDuration.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / sessionsWithDuration.length
      : 0

    return NextResponse.json({
      summary: {
        totalUsers,
        activeUsers,
        totalSessions,
        activeSessions,
        totalPageViews,
        totalActions,
        avgSessionDuration: Math.round(avgSessionDuration)
      },
      sessionsByDay,
      topPages: topPages.map(p => ({
        route: p.route,
        views: p._count.id
      })),
      topUsers: topUsersWithDetails,
      activityByType: activityByType.map(a => ({
        eventType: a.eventType,
        count: a._count.id
      }))
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching analytics' },
      { status: 500 }
    )
  }
}

