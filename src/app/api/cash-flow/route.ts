import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user role and client ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, clientId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let fundsQuery: any = {}

    // Access control based on role
    if (user.role === 'ADMIN') {
      // Admin can see all funds
      fundsQuery = {}
    } else if (user.clientId) {
      // Client user can see their client's funds
      fundsQuery = { clientId: user.clientId }
    } else {
      // Regular user sees their own funds and those they have access to
      const accessibleFundIds = await prisma.fundAccess.findMany({
        where: { userId },
        select: { fundId: true },
      })

      fundsQuery = {
        OR: [
          { userId },
          { id: { in: accessibleFundIds.map((a) => a.fundId) } },
        ],
      }
    }

    // Fetch all funds with their documents, NAV history, and distributions
    // Note: distributions may not exist if migration hasn't been run yet
    type FundWithRelations = {
      id: string
      name: string
      nav: number
      documents: Array<{
        id: string
        type: string
        title: string
        uploadDate: Date
        dueDate: Date | null
        callAmount: number | null
        paymentStatus: string | null
        investmentValue: number | null
      }>
      navHistory: Array<{
        id: string
        date: Date
        nav: number
      }>
      distributions: Array<{
        id: string
        distributionDate: Date
        amount: number
        distributionType: string
        description: string | null
      }>
    }

    let funds: FundWithRelations[]
    try {
      funds = await prisma.fund.findMany({
        where: fundsQuery,
        include: {
          documents: {
            where: {
              OR: [
                { type: 'CAPITAL_CALL' },
                // Include quarterly/annual reports that might have investment value
                {
                  AND: [
                    { type: { in: ['QUARTERLY_REPORT', 'ANNUAL_REPORT'] } },
                    { investmentValue: { not: null } },
                  ],
                },
              ],
            },
            orderBy: { uploadDate: 'asc' },
          },
          navHistory: {
            orderBy: { date: 'asc' },
          },
          distributions: {
            orderBy: { distributionDate: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      // If distributions table doesn't exist yet, fetch without it
      console.log('Distributions not available yet, falling back to basic query')
      const fundsWithoutDistributions = await prisma.fund.findMany({
        where: fundsQuery,
        include: {
          documents: {
            where: {
              OR: [
                { type: 'CAPITAL_CALL' },
                {
                  AND: [
                    { type: { in: ['QUARTERLY_REPORT', 'ANNUAL_REPORT'] } },
                    { investmentValue: { not: null } },
                  ],
                },
              ],
            },
            orderBy: { uploadDate: 'asc' },
          },
          navHistory: {
            orderBy: { date: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      })
      // Add empty distributions array for compatibility
      funds = fundsWithoutDistributions.map((fund) => ({ ...fund, distributions: [] })) as FundWithRelations[]
    }

    // Aggregate cash flow events
    interface CashFlowEvent {
      id: string
      fundId: string
      fundName: string
      type: 'CAPITAL_CALL' | 'DISTRIBUTION' | 'NAV_UPDATE' | 'NEW_HOLDING'
      date: Date
      amount: number
      description: string
      status?: string
      cumulativeInvested?: number
      cumulativeDistributed?: number
      netCashFlow?: number
    }

    const cashFlowEvents: CashFlowEvent[] = []

    funds.forEach((fund) => {
      // Capital Calls
      fund.documents.forEach((doc) => {
        if (doc.type === 'CAPITAL_CALL' && doc.callAmount) {
          cashFlowEvents.push({
            id: doc.id,
            fundId: fund.id,
            fundName: fund.name,
            type: 'CAPITAL_CALL',
            date: doc.dueDate || doc.uploadDate,
            amount: -doc.callAmount, // Negative for cash outflow
            description: doc.title,
            status: doc.paymentStatus || 'PENDING',
          })
        }

        // New Holdings (from investment value in reports)
        if (doc.investmentValue && doc.investmentValue > 0) {
          cashFlowEvents.push({
            id: `${doc.id}-investment`,
            fundId: fund.id,
            fundName: fund.name,
            type: 'NEW_HOLDING',
            date: doc.uploadDate,
            amount: -doc.investmentValue, // Negative for cash outflow
            description: `New investment reported in ${doc.title}`,
          })
        }
      })

      // Distributions
      fund.distributions.forEach((dist) => {
        cashFlowEvents.push({
          id: dist.id,
          fundId: fund.id,
          fundName: fund.name,
          type: 'DISTRIBUTION',
          date: dist.distributionDate,
          amount: dist.amount, // Positive for cash inflow
          description: dist.description || `${dist.distributionType} Distribution`,
        })
      })

      // NAV Updates (for visualization purposes)
      fund.navHistory.forEach((nav) => {
        cashFlowEvents.push({
          id: nav.id,
          fundId: fund.id,
          fundName: fund.name,
          type: 'NAV_UPDATE',
          date: nav.date,
          amount: 0, // NAV updates don't affect cash flow
          description: `NAV Update: ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(nav.nav)}`,
        })
      })
    })

    // Sort by date
    cashFlowEvents.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Calculate cumulative values
    let cumulativeInvested = 0
    let cumulativeDistributed = 0

    cashFlowEvents.forEach((event) => {
      if (event.type === 'CAPITAL_CALL' || event.type === 'NEW_HOLDING') {
        cumulativeInvested += Math.abs(event.amount)
      } else if (event.type === 'DISTRIBUTION') {
        cumulativeDistributed += event.amount
      }

      event.cumulativeInvested = cumulativeInvested
      event.cumulativeDistributed = cumulativeDistributed
      event.netCashFlow = cumulativeDistributed - cumulativeInvested
    })

    // Calculate summary metrics
    const totalInvested = cumulativeInvested
    const totalDistributed = cumulativeDistributed
    const netCashFlow = totalDistributed - totalInvested
    const currentNAV = funds.reduce((sum, fund) => sum + fund.nav, 0)
    const totalValue = currentNAV + totalDistributed
    const moic = totalInvested > 0 ? totalValue / totalInvested : 0

    // Get pending capital calls
    const pendingCapitalCalls = cashFlowEvents.filter(
      (e) =>
        e.type === 'CAPITAL_CALL' &&
        e.status &&
        ['PENDING', 'LATE', 'OVERDUE'].includes(e.status)
    )

    // Get distributions by year
    const distributionsByYear: { [year: string]: number } = {}
    cashFlowEvents
      .filter((e) => e.type === 'DISTRIBUTION')
      .forEach((e) => {
        const year = new Date(e.date).getFullYear().toString()
        distributionsByYear[year] = (distributionsByYear[year] || 0) + e.amount
      })

    return NextResponse.json({
      success: true,
      data: {
        events: cashFlowEvents,
        summary: {
          totalInvested,
          totalDistributed,
          netCashFlow,
          currentNAV,
          totalValue,
          moic,
          fundCount: funds.length,
          pendingCallsCount: pendingCapitalCalls.length,
          pendingCallsAmount: pendingCapitalCalls.reduce(
            (sum, call) => sum + Math.abs(call.amount),
            0
          ),
        },
        distributionsByYear,
        pendingCapitalCalls,
      },
    })
  } catch (error) {
    console.error('Cash flow API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cash flow data' },
      { status: 500 }
    )
  }
}

