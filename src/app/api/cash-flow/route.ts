import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const FORECAST_QUARTERS = 8

type QuarterAggregate = {
  key: string
  label: string
  amount: number
}

const aggregateQuarterlyTotals = <T,>(
  items: T[],
  getAmount: (item: T) => number,
  getDate: (item: T) => Date | null
): QuarterAggregate[] => {
  const totals = new Map<string, { label: string; amount: number; sortValue: number }>()

  items.forEach((item) => {
    const date = getDate(item)
    const amount = getAmount(item)
    if (!date || !isFinite(amount)) return

    const year = date.getFullYear()
    const quarter = Math.floor(date.getMonth() / 3) + 1
    const key = `${year}-Q${quarter}`
    const label = `Q${quarter} ${year}`
    const existing = totals.get(key)
    if (existing) {
      existing.amount += amount
    } else {
      totals.set(key, {
        label,
        amount,
        sortValue: year * 4 + quarter,
      })
    }
  })

  return Array.from(totals.entries())
    .sort((a, b) => a[1].sortValue - b[1].sortValue)
    .map(([key, value]) => ({ key, label: value.label, amount: value.amount }))
}

const getPeriodOrder = (period: string) => {
  const [quarterPart, yearPart] = period.split(' ')
  const quarter = Number(quarterPart?.replace('Q', '')) || 0
  const year = Number(yearPart) || 0
  return year * 4 + quarter
}

const getPeriodLabelFromOrder = (order: number) => {
  const quarter = order % 4 || 4
  const year = (order - quarter) / 4
  return `Q${quarter} ${year}`
}

const getCurrentQuarterOrder = () => {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3) + 1
  return now.getFullYear() * 4 + quarter
}

type CapitalCallDoc = {
  callAmount: number
  dueDate: Date | null
  uploadDate: Date
}

type DistributionRecord = {
  amount: number
  distributionDate: Date
  createdAt?: Date
}

const generateForecastDrawdowns = (
  funds: { commitment?: number; paidIn?: number; nav: number }[],
  capitalCalls: CapitalCallDoc[],
  distributions: DistributionRecord[]
) => {
  const totalCommitment = funds.reduce((sum, fund) => sum + (fund.commitment || 0), 0)
  const totalPaidIn = funds.reduce((sum, fund) => sum + (fund.paidIn || 0), 0)
  const totalNav = funds.reduce((sum, fund) => sum + (fund.nav || 0), 0)
  const unfundedCommitments = Math.max(totalCommitment - totalPaidIn, 0)

  const capitalHistory = aggregateQuarterlyTotals(
    capitalCalls,
    (call) => Math.abs(call.callAmount || 0),
    (call) => call.dueDate || call.uploadDate
  )

  const distributionHistory = aggregateQuarterlyTotals(
    distributions,
    (dist) => dist.amount || 0,
    (dist) => dist.distributionDate || dist.createdAt || null
  )

  const recentCapitalWindow = capitalHistory.slice(-FORECAST_QUARTERS)
  const recentDistributionWindow = distributionHistory.slice(-FORECAST_QUARTERS)
  const avgQuarterlyCapitalCalls = recentCapitalWindow.length
    ? recentCapitalWindow.reduce((sum, entry) => sum + entry.amount, 0) / recentCapitalWindow.length
    : null
  const avgQuarterlyDistributions = recentDistributionWindow.length
    ? recentDistributionWindow.reduce((sum, entry) => sum + entry.amount, 0) / recentDistributionWindow.length
    : null

  const historicalDeploymentRate = avgQuarterlyCapitalCalls && unfundedCommitments > 0
    ? Math.min(Math.max(avgQuarterlyCapitalCalls / unfundedCommitments, 0.03), 0.5)
    : null

  const historicalDistributionRate = avgQuarterlyDistributions && totalNav > 0
    ? Math.min(Math.max(avgQuarterlyDistributions / totalNav, 0.02), 0.5)
    : null

  const currentQuarterOrder = getCurrentQuarterOrder()
  const historyMaxOrder = Math.max(
    capitalHistory.length ? Math.max(...capitalHistory.map((entry) => getPeriodOrder(entry.label))) : Number.NEGATIVE_INFINITY,
    distributionHistory.length ? Math.max(...distributionHistory.map((entry) => getPeriodOrder(entry.label))) : Number.NEGATIVE_INFINITY
  )

  const projectionStartOrder = Number.isFinite(historyMaxOrder) && historyMaxOrder !== Number.NEGATIVE_INFINITY
    ? historyMaxOrder + 1
    : currentQuarterOrder

  const quarters = Array.from({ length: FORECAST_QUARTERS }, (_, index) =>
    getPeriodLabelFromOrder(projectionStartOrder + index)
  )

  const baseDeploymentPace = historicalDeploymentRate ?? 0.15
  const baseDistributionRate = historicalDistributionRate ?? 0.08

  let remainingUnfunded = unfundedCommitments
  const capitalCallProjections = quarters.map((period, index) => {
    const timeFactor = Math.max(0.3, 1 - (index / FORECAST_QUARTERS) * 0.7)
    const amount = Math.min(remainingUnfunded, remainingUnfunded * baseDeploymentPace * timeFactor)
    remainingUnfunded -= amount
    return {
      period,
      amount: Math.round(amount),
      cumulative: Math.round(unfundedCommitments - remainingUnfunded),
    }
  })

  let cumulativeDistributions = 0
  const distributionProjections = quarters.map((period, index) => {
    const maturityFactor = 1 + (index / FORECAST_QUARTERS) * 0.5
    const amount = totalNav * baseDistributionRate * maturityFactor
    cumulativeDistributions += amount
    return {
      period,
      amount: Math.round(amount),
      cumulative: Math.round(cumulativeDistributions),
    }
  })

  let cumulativeNet = 0
  let minCumulative = 0
  const netCashFlow = quarters.map((period, index) => {
    const callAmount = capitalCallProjections[index]?.amount ?? 0
    const distAmount = distributionProjections[index]?.amount ?? 0
    const net = distAmount - callAmount
    cumulativeNet += net
    minCumulative = Math.min(minCumulative, cumulativeNet)
    return {
      period,
      capitalCalls: -callAmount,
      distributions: distAmount,
      net,
      cumulativeNet,
    }
  })

  return {
    capitalCallProjections,
    distributionProjections,
    netCashFlow,
    requiredReserve: Math.abs(minCumulative),
    upcomingDrawdowns: capitalCallProjections.slice(0, 4),
    totalProjectedCalls: capitalCallProjections.reduce((sum, projection) => sum + projection.amount, 0),
  }
}

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
      commitment?: number
      paidIn?: number
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
        createdAt: Date
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

    // Direct investments access control mirrors funds
    let directInvestmentsWhereClause: any = {}
    if (user.role === 'ADMIN') {
      directInvestmentsWhereClause = {}
    } else if (user.clientId) {
      directInvestmentsWhereClause = { clientId: user.clientId }
    } else {
      directInvestmentsWhereClause = { userId }
    }

    const directInvestments = await prisma.directInvestment.findMany({
      where: directInvestmentsWhereClause,
      orderBy: { investmentDate: 'asc' },
      select: {
        id: true,
        name: true,
        investmentType: true,
        investmentDate: true,
        investmentAmount: true,
        currentValue: true,
        cashBalance: true,
        balance: true,
        createdAt: true,
      },
    })

    // Aggregate cash flow events
    interface CashFlowEvent {
      id: string
      fundId: string
      fundName: string
      type: 'CAPITAL_CALL' | 'DISTRIBUTION' | 'NAV_UPDATE' | 'NEW_HOLDING' | 'DIRECT_INVESTMENT' | 'CASH'
      date: Date
      amount: number
      description: string
      status?: string
      cumulativeInvested?: number
      cumulativeDistributed?: number
      netCashFlow?: number
    }

    const cashFlowEvents: CashFlowEvent[] = []
    const capitalCallDocsForForecast: CapitalCallDoc[] = []
    const distributionRecordsForForecast: DistributionRecord[] = []
    let cashAvailable = 0

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

          capitalCallDocsForForecast.push({
            callAmount: doc.callAmount,
            dueDate: doc.dueDate,
            uploadDate: doc.uploadDate,
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

        distributionRecordsForForecast.push({
          amount: dist.amount,
          distributionDate: dist.distributionDate,
          createdAt: dist.createdAt,
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

    // Direct Investment cash flow events and cash positions
    directInvestments.forEach((di) => {
      const diDate = di.investmentDate || di.createdAt || new Date()

      if (di.investmentAmount && di.investmentAmount > 0) {
        cashFlowEvents.push({
          id: di.id,
          fundId: di.id,
          fundName: di.name,
          type: 'DIRECT_INVESTMENT',
          date: diDate,
          amount: -di.investmentAmount,
          description: `Direct investment allocation`,
        })
      }

      if (di.investmentType === 'CASH') {
        const available = di.cashBalance ?? di.balance ?? 0
        if (available > 0) {
          cashAvailable += available
          cashFlowEvents.push({
            id: `${di.id}-cash`,
            fundId: di.id,
            fundName: di.name,
            type: 'CASH',
            date: new Date(),
            amount: available,
            description: 'Cash account balance',
          })
        }
      }
    })

    // Sort by date
    cashFlowEvents.sort((a, b) => a.date.getTime() - b.date.getTime())

    const forecastData = generateForecastDrawdowns(
      funds,
      capitalCallDocsForForecast,
      distributionRecordsForForecast
    )

    // Calculate cumulative values
    let cumulativeInvested = 0
    let cumulativeDistributed = 0

    cashFlowEvents.forEach((event) => {
      if (
        event.type === 'CAPITAL_CALL' ||
        event.type === 'NEW_HOLDING' ||
        event.type === 'DIRECT_INVESTMENT'
      ) {
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
          cashAvailable,
        },
        fundSnapshots: funds.map((fund) => ({
          id: fund.id,
          name: fund.name,
          nav: fund.nav,
          commitment: fund.commitment || 0,
          paidIn: fund.paidIn || 0,
        })),
        distributionsByYear,
        pendingCapitalCalls,
        forecast: forecastData,
        cashAvailable,
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
