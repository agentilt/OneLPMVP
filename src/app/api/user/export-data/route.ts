import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        mfaEnabled: true,
        lastLoginAt: true,
        termsAcceptedAt: true,
        privacyAcceptedAt: true,
        websiteTermsAcceptedAt: true,
        emailWeeklyReports: true,
        emailMonthlyReports: true,
        createdAt: true,
        updatedAt: true,
        clientId: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch funds
    const funds = await prisma.fund.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        domicile: true,
        vintage: true,
        manager: true,
        commitment: true,
        paidIn: true,
        nav: true,
        irr: true,
        tvpi: true,
        dpi: true,
        lastReportDate: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Fetch fund access
    const fundAccess = await prisma.fundAccess.findMany({
      where: { userId },
      include: {
        fund: {
          select: {
            name: true,
            manager: true
          }
        }
      }
    })

    // Fetch direct investments
    const directInvestments = await prisma.directInvestment.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        investmentType: true,
        industry: true,
        stage: true,
        investmentDate: true,
        investmentAmount: true,
        currentValue: true,
        lastReportDate: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Fetch recent activity (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const activityEvents = await prisma.activityEvent.findMany({
      where: {
        userId,
        createdAt: {
          gte: ninetyDaysAgo
        }
      },
      select: {
        eventType: true,
        route: true,
        resourceType: true,
        action: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })

    // Fetch recent sessions (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        deviceInfo: true,
        ipAddress: true,
        lastActivity: true,
        createdAt: true,
        expiresAt: true,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch recent security events (last 90 days)
    const securityEvents = await prisma.securityEvent.findMany({
      where: {
        userId,
        createdAt: {
          gte: ninetyDaysAgo
        }
      },
      select: {
        eventType: true,
        description: true,
        severity: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    // Get client information if associated
    let client = null
    if (user.clientId) {
      client = await prisma.client.findUnique({
        where: { id: user.clientId },
        select: {
          name: true,
          email: true,
          phone: true
        }
      })
    }

    // Build export data
    const exportData = {
      exportMetadata: {
        exportDate: new Date().toISOString(),
        exportVersion: '1.0',
        dataRetentionNote: 'This export includes data from the last 90 days for activity and security events, and last 30 days for sessions.'
      },
      personalInformation: {
        userId: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        accountCreated: user.createdAt,
        lastUpdated: user.updatedAt
      },
      securitySettings: {
        mfaEnabled: user.mfaEnabled,
        lastLogin: user.lastLoginAt
      },
      consent: {
        termsAcceptedAt: user.termsAcceptedAt,
        privacyAcceptedAt: user.privacyAcceptedAt,
        websiteTermsAcceptedAt: user.websiteTermsAcceptedAt
      },
      emailPreferences: {
        weeklyReports: user.emailWeeklyReports,
        monthlyReports: user.emailMonthlyReports
      },
      client: client,
      funds: funds.map(fund => ({
        id: fund.id,
        name: fund.name,
        domicile: fund.domicile,
        vintage: fund.vintage,
        manager: fund.manager,
        commitment: fund.commitment,
        paidIn: fund.paidIn,
        nav: fund.nav,
        irr: fund.irr,
        tvpi: fund.tvpi,
        dpi: fund.dpi,
        lastReportDate: fund.lastReportDate,
        addedToAccount: fund.createdAt
      })),
      fundAccess: fundAccess.map(access => ({
        fundName: access.fund.name,
        manager: access.fund.manager,
        relationshipType: access.relationshipType,
        permissionLevel: access.permissionLevel,
        grantedAt: access.createdAt
      })),
      directInvestments: directInvestments.map(inv => ({
        id: inv.id,
        name: inv.name,
        type: inv.investmentType,
        industry: inv.industry,
        stage: inv.stage,
        investmentDate: inv.investmentDate,
        investmentAmount: inv.investmentAmount,
        currentValue: inv.currentValue,
        lastReportDate: inv.lastReportDate,
        addedToAccount: inv.createdAt
      })),
      activityHistory: activityEvents.map(event => ({
        type: event.eventType,
        route: event.route,
        resourceType: event.resourceType,
        action: event.action,
        timestamp: event.createdAt
      })),
      sessionHistory: sessions.map(session => ({
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isActive: session.isActive
      })),
      securityEvents: securityEvents.map(event => ({
        type: event.eventType,
        description: event.description,
        severity: event.severity,
        timestamp: event.createdAt
      })),
      dataProcessingInformation: {
        purposes: [
          'Account management and authentication',
          'Investment portfolio tracking',
          'Document storage and retrieval',
          'Security monitoring and fraud prevention',
          'Communication regarding your investments'
        ],
        legalBasis: 'Contract performance, Legitimate interests, Consent',
        dataRetention: 'Account data retained for account lifetime. Activity logs retained for 90 days. Audit logs retained for 1 year minimum for compliance.',
        internationalTransfers: 'Data may be processed in regions where cloud providers operate (US, EU)',
        yourRights: [
          'Right to access your data (this export)',
          'Right to rectify inaccurate data',
          'Right to erasure (account deletion)',
          'Right to restrict processing',
          'Right to data portability',
          'Right to object to processing',
          'Right to withdraw consent'
        ]
      }
    }

    // Log the export action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EXPORT_DATA',
        resource: 'USER',
        resourceId: userId,
        description: 'User exported their personal data',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'DATA_EXPORT',
        description: 'User exported personal data',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'INFO'
      }
    })

    const filename = `onelp-data-export-${user.email.replace('@', '-at-')}-${Date.now()}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    })

  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

