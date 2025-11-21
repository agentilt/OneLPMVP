import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AnalyticsClient } from './AnalyticsClient'
import { Topbar } from '@/components/Topbar'
import { inferFundAssetClass, mapInvestmentTypeToAssetClass } from '@/lib/assetClass'

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
    capitalCallDocsRaw,
    distributionEntriesRaw,
    pendingCapitalCallsRaw,
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
      select: {
        id: true,
        fundId: true,
        callAmount: true,
        dueDate: true,
        uploadDate: true,
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
      select: {
        id: true,
        fundId: true,
        amount: true,
        distributionDate: true,
        distributionType: true,
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

  const fundsWithAssetClass = funds.map((fund) => ({
    ...fund,
    assetClass: fund.assetClass || inferFundAssetClass(fund),
  }))
  const fundSummaries = fundsWithAssetClass.map((fund) => ({
    id: fund.id,
    name: fund.name,
    manager: fund.manager,
    domicile: fund.domicile,
    commitment: fund.commitment,
    paidIn: fund.paidIn,
    nav: fund.nav,
    dpi: fund.dpi,
    assetClass: fund.assetClass,
  }))
  const assetClasses = Array.from(new Set(fundSummaries.map((fund) => fund.assetClass))).sort()
  const fundAssetClassMap = new Map(fundSummaries.map((fund) => [fund.id, fund.assetClass]))

  const directInvestmentSummaries = directInvestments.map((di) => ({
    id: di.id,
    name: di.name,
    investmentAmount: di.investmentAmount || 0,
    currentValue: di.currentValue || 0,
    assetClass: mapInvestmentTypeToAssetClass(di.investmentType),
  }))

  const recentCapitalCallsFormatted = recentCapitalCalls.map((call) => ({
    id: call.id,
    fundId: call.fundId,
    fundName: call.fund.name,
    amount: call.callAmount || 0,
    dueDate: call.dueDate ? call.dueDate.toISOString() : null,
    uploadDate: call.uploadDate ? call.uploadDate.toISOString() : null,
    assetClass: fundAssetClassMap.get(call.fundId) || 'Multi-Strategy',
  }))

  const recentDistributionsFormatted = recentDistributions.map((dist) => ({
    id: dist.id,
    fundId: dist.fundId,
    fundName: dist.fund.name,
    amount: dist.amount,
    distributionDate: dist.distributionDate ? dist.distributionDate.toISOString() : null,
    assetClass: fundAssetClassMap.get(dist.fundId) || 'Multi-Strategy',
  }))

  const capitalCallDocs = capitalCallDocsRaw.map((doc) => ({
    id: doc.id,
    fundId: doc.fundId,
    fundName: doc.fund.name,
    callAmount: doc.callAmount || 0,
    dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
    uploadDate: doc.uploadDate ? doc.uploadDate.toISOString() : null,
    paymentStatus: doc.paymentStatus || 'PENDING',
    assetClass: fundAssetClassMap.get(doc.fundId) || 'Multi-Strategy',
  }))

  const distributionEntries = distributionEntriesRaw.map((entry) => ({
    id: entry.id,
    fundId: entry.fundId,
    fundName: entry.fund.name,
    amount: entry.amount,
    distributionDate: entry.distributionDate ? entry.distributionDate.toISOString() : null,
    assetClass: fundAssetClassMap.get(entry.fundId) || 'Multi-Strategy',
  }))

  const pendingCapitalCalls = pendingCapitalCallsRaw.map((call) => ({
    id: call.id,
    fundId: call.fundId,
    fundName: call.fund.name,
    callAmount: call.callAmount || 0,
    dueDate: call.dueDate ? call.dueDate.toISOString() : null,
    uploadDate: call.uploadDate ? call.uploadDate.toISOString() : null,
    paymentStatus: call.paymentStatus || 'PENDING',
    assetClass: fundAssetClassMap.get(call.fundId) || 'Multi-Strategy',
  }))

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
    const eventDateStr = doc.dueDate || doc.uploadDate
    if (!eventDateStr) return
    const eventDate = new Date(eventDateStr)
    if (eventDate < cashFlowWindowStart) return
    const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}`
    if (!monthBuckets[key]) return
    monthBuckets[key].capitalCalls += doc.callAmount || 0
  })

  distributionEntries.forEach((dist) => {
    const eventDateStr = dist.distributionDate
    if (!eventDateStr) return
    const eventDate = new Date(eventDateStr)
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
      fundName: call.fundName,
      dueDate: call.dueDate || call.uploadDate || '',
      amount: call.callAmount || 0,
      status: call.paymentStatus || 'PENDING',
      assetClass: call.assetClass,
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
          capitalCalls: recentCapitalCallsFormatted,
          distributions: recentDistributionsFormatted,
        }}
        cashFlowSnapshot={cashFlowSnapshot}
        funds={fundSummaries}
        directInvestments={directInvestmentSummaries}
        capitalCallDocs={capitalCallDocs}
        distributionEntries={distributionEntries}
        pendingCapitalCallsRaw={pendingCapitalCalls}
        assetClasses={assetClasses}
        cashFlowMonths={months}
        cashFlowWindowStart={cashFlowWindowStart.toISOString()}
      />
    </div>
  )
}
