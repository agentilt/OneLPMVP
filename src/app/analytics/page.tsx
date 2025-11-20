import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AnalyticsClient } from './AnalyticsClient'
import { Topbar } from '@/components/Topbar'

export const metadata = {
  title: 'Analytics Hub | OneLPM',
  description: 'Comprehensive analytics and insights for your investment portfolio',
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, clientId: true },
  })

  if (!user) {
    redirect('/login')
  }

  let fundsWhereClause: any = {}

  if (user.role === 'ADMIN') {
    fundsWhereClause = {}
  } else if (user.clientId) {
    fundsWhereClause = { clientId: user.clientId }
  } else {
    const accessibleFundIds = await prisma.fundAccess.findMany({
      where: { userId: session.user.id },
      select: { fundId: true },
    })

    fundsWhereClause = {
      OR: [
        { userId: session.user.id },
        { id: { in: accessibleFundIds.map((a) => a.fundId) } },
      ],
    }
  }

  const cashFlowWindowStart = new Date()
  cashFlowWindowStart.setMonth(cashFlowWindowStart.getMonth() - 11)
  cashFlowWindowStart.setDate(1)

  const [
    funds,
    directInvestments,
    recentCapitalCalls,
    recentDistributions,
    capitalCallDocs,
    distributionEntries,
    pendingCapitalCalls,
  ] = await Promise.all([
    prisma.fund.findMany({
      where: fundsWhereClause,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.directInvestment.findMany({
      where:
        user.role === 'ADMIN'
          ? {}
          : user.clientId
          ? { clientId: user.clientId }
          : { userId: session.user.id },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.document.findMany({
      where: {
        fund: {
          is: fundsWhereClause,
        },
        type: 'CAPITAL_CALL',
      },
      include: {
        fund: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'desc',
      },
      take: 5,
    }),
    prisma.distribution.findMany({
      where: {
        fund: {
          is: fundsWhereClause,
        },
      },
      include: {
        fund: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        distributionDate: 'desc',
      },
      take: 5,
    }),
    prisma.document.findMany({
      where: {
        type: 'CAPITAL_CALL',
        fund: {
          is: fundsWhereClause,
        },
        OR: [
          { dueDate: { gte: cashFlowWindowStart } },
          {
            AND: [
              { dueDate: null },
              { uploadDate: { gte: cashFlowWindowStart } },
            ],
          },
        ],
      },
      select: {
        id: true,
        fundId: true,
        callAmount: true,
        dueDate: true,
        uploadDate: true,
        paymentStatus: true,
        fund: {
          select: { name: true },
        },
      },
    }),
    prisma.distribution.findMany({
      where: {
        fund: {
          is: fundsWhereClause,
        },
        distributionDate: {
          gte: cashFlowWindowStart,
        },
      },
      select: {
        id: true,
        fundId: true,
        amount: true,
        distributionDate: true,
        fund: {
          select: { name: true },
        },
      },
    }),
    prisma.document.findMany({
      where: {
        type: 'CAPITAL_CALL',
        fund: {
          is: fundsWhereClause,
        },
        paymentStatus: {
          in: ['PENDING', 'LATE', 'OVERDUE'],
        },
      },
      select: {
        id: true,
        fundId: true,
        callAmount: true,
        dueDate: true,
        uploadDate: true,
        paymentStatus: true,
        fund: {
          select: { name: true },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
    }),
  ])

  // Calculate portfolio summary
  const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
  const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
  const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
  const totalDistributions = funds.reduce((sum, fund) => sum + fund.dpi * fund.paidIn, 0)

  const portfolioTvpi =
    totalPaidIn > 0 ? (totalNav + totalDistributions) / totalPaidIn : 0

  // Calculate direct investments totals
  const diTotalInvested = directInvestments.reduce(
    (sum, di) => sum + (di.investmentAmount || 0),
    0
  )
  const diTotalValue = directInvestments.reduce(
    (sum, di) => sum + (di.currentValue || 0),
    0
  )

  // Calculate risk metrics
  const unfundedCommitments = funds.reduce(
    (sum, fund) => sum + (fund.commitment - fund.paidIn),
    0
  )

  // Count active investments (all funds and direct investments are considered active for now)
  const activeFunds = funds.length
  const activeDirectInvestments = directInvestments.length

  // Cash flow snapshot (rolling 12 months)
  const totalCapitalCallsAmount = capitalCallDocs.reduce(
    (sum, doc) => sum + (doc.callAmount || 0),
    0
  )
  const totalDistributionsAmount = distributionEntries.reduce(
    (sum, dist) => sum + dist.amount,
    0
  )
  const netCashFlow = totalDistributionsAmount - totalCapitalCallsAmount

  const pendingCallsAmount = pendingCapitalCalls.reduce(
    (sum, call) => sum + (call.callAmount || 0),
    0
  )

  const months: { key: string; label: string }[] = []
  const monthBuckets: Record<string, { capitalCalls: number; distributions: number }> = {}
  const referenceDate = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    months.push({
      key,
      label: `${date.toLocaleString('default', { month: 'short' })} '${date
        .getFullYear()
        .toString()
        .slice(-2)}`,
    })
    monthBuckets[key] = { capitalCalls: 0, distributions: 0 }
  }

  capitalCallDocs.forEach((doc) => {
    const eventDate = doc.dueDate || doc.uploadDate
    if (!eventDate) return
    if (eventDate < cashFlowWindowStart) return
    const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}`
    if (!monthBuckets[key]) return
    monthBuckets[key].capitalCalls += doc.callAmount || 0
  })

  distributionEntries.forEach((dist) => {
    const eventDate = dist.distributionDate
    if (!eventDate) return
    if (eventDate < cashFlowWindowStart) return
    const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}`
    if (!monthBuckets[key]) return
    monthBuckets[key].distributions += dist.amount
  })

  const monthlySeries = months.map(({ key, label }) => {
    const bucket = monthBuckets[key] || { capitalCalls: 0, distributions: 0 }
    return {
      month: label,
      capitalCalls: bucket.capitalCalls,
      distributions: bucket.distributions,
      net: bucket.distributions - bucket.capitalCalls,
    }
  })

  const cashFlowSnapshot = {
    totalCapitalCalls: totalCapitalCallsAmount,
    totalDistributions: totalDistributionsAmount,
    netCashFlow,
    pendingCallsCount: pendingCapitalCalls.length,
    pendingCallsAmount,
    monthlySeries,
    pendingCalls: pendingCapitalCalls.map((call) => ({
      id: call.id,
      fundName: call.fund.name,
      dueDate: (call.dueDate || call.uploadDate)?.toISOString() || '',
      amount: call.callAmount || 0,
      status: call.paymentStatus || 'PENDING',
    })),
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar />
      <AnalyticsClient
        portfolioSummary={{
          totalCommitment,
          totalNav,
          totalPaidIn,
          totalDistributions,
          portfolioTvpi,
          diTotalInvested,
          diTotalValue,
          unfundedCommitments,
          activeFunds,
          activeDirectInvestments,
        }}
        recentActivity={{
          capitalCalls: recentCapitalCalls,
          distributions: recentDistributions,
        }}
        cashFlowSnapshot={cashFlowSnapshot}
      />
    </div>
  )
}

