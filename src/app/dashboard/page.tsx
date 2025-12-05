import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DashboardClient } from './DashboardClient'
import { inferFundAssetClass } from '@/lib/assetClass'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard | OneLPM',
  description: 'Your investment portfolio overview',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, clientId: true, firstName: true, name: true },
  })

  if (!user) {
    redirect('/login')
  }

  // Build query for funds based on user role and client relationship
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

  // Fetch funds with all necessary data
  const funds = await prisma.fund.findMany({
    where: fundsWhereClause,
    select: {
      id: true,
      name: true,
      domicile: true,
      vintage: true,
      manager: true,
      managerEmail: true,
      managerPhone: true,
      managerWebsite: true,
      commitment: true,
      paidIn: true,
      nav: true,
      tvpi: true,
      dpi: true,
      irr: true,
      lastReportDate: true,
      assetClass: true,
      strategy: true,
      sector: true,
      navHistory: {
        orderBy: { date: 'asc' },
        select: {
          date: true,
          nav: true,
        },
      },
      documents: {
        where: {
          type: 'CAPITAL_CALL',
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          callAmount: true,
          paymentStatus: true,
        },
      },
    },
    orderBy: {
      nav: 'desc',
    },
  })

  // Fetch direct investments
  const directInvestments = await prisma.directInvestment.findMany({
    where:
      user.role === 'ADMIN'
        ? {}
        : user.clientId
        ? { clientId: user.clientId }
        : { userId: session.user.id },
    select: {
      id: true,
      name: true,
      investmentType: true,
      industry: true,
      stage: true,
      investmentDate: true,
      investmentAmount: true,
      principalAmount: true,
      interestRate: true,
      couponRate: true,
      maturityDate: true,
      creditRating: true,
      defaultStatus: true,
      currentValue: true,
      yield: true,
      tickerSymbol: true,
      shares: true,
      purchasePrice: true,
      currentPrice: true,
      dividends: true,
      marketValue: true,
      propertyType: true,
      propertyAddress: true,
      squareFootage: true,
      purchaseDate: true,
      purchaseValue: true,
      currentAppraisal: true,
      rentalIncome: true,
      occupancyRate: true,
      propertyTax: true,
      maintenanceCost: true,
      netOperatingIncome: true,
      assetType: true,
      assetDescription: true,
      assetLocation: true,
      acquisitionDate: true,
      acquisitionValue: true,
      assetCurrentValue: true,
      assetIncome: true,
      holdingCost: true,
      accountType: true,
      accountName: true,
      cashInterestRate: true,
      balance: true,
      currency: true,
      cashMaturityDate: true,
      revenue: true,
      arr: true,
      mrr: true,
      cashBalance: true,
      lastReportDate: true,
      documents: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Calculate portfolio summary
  const fundCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
  const fundNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
  const fundPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
  const fundDistributions = funds.reduce((sum, fund) => sum + fund.dpi * fund.paidIn, 0)
  const fundTvpi = fundPaidIn > 0 ? (fundNav + fundDistributions) / fundPaidIn : 0

  const directInvestmentAmount = directInvestments.reduce(
    (sum, di) => sum + (di.investmentAmount || 0),
    0
  )
  const directInvestmentValue = directInvestments.reduce(
    (sum, di) => sum + (di.currentValue || di.marketValue || di.currentAppraisal || di.assetCurrentValue || di.balance || di.investmentAmount || 0),
    0
  )

  const combinedCommitment = fundCommitment + directInvestmentAmount
  const combinedNav = fundNav + directInvestmentValue

  // Count active capital calls
  const activeCapitalCalls = funds.reduce(
    (sum, fund) =>
      sum +
      fund.documents.filter(
        (doc) =>
          doc.dueDate &&
          doc.callAmount &&
          (doc.paymentStatus === 'PENDING' ||
            doc.paymentStatus === 'LATE' ||
            doc.paymentStatus === 'OVERDUE')
      ).length,
    0
  )

  // Calculate allocation data
  const fundsWithAssetClass = funds.map((fund) => ({
    ...fund,
    assetClass: fund.assetClass || inferFundAssetClass(fund),
  }))

  // By Manager
  const allocationByManager = fundsWithAssetClass.reduce(
    (acc: { [key: string]: number }, fund) => {
      const manager = fund.manager || 'Unknown'
      acc[manager] = (acc[manager] || 0) + fund.nav
      return acc
    },
    {}
  )

  // By Asset Class
  const allocationByAssetClass = fundsWithAssetClass.reduce(
    (acc: { [key: string]: number }, fund) => {
      const assetClass = fund.assetClass || 'Unspecified'
      acc[assetClass] = (acc[assetClass] || 0) + fund.nav
      return acc
    },
    {}
  )

  // By Geography (using domicile)
  const allocationByGeography = fundsWithAssetClass.reduce(
    (acc: { [key: string]: number }, fund) => {
      const geography = fund.domicile || 'Unknown'
      acc[geography] = (acc[geography] || 0) + fund.nav
      return acc
    },
    {}
  )

  // Convert to array format with percentages
  const totalNavForAllocation = combinedNav || 1

  const convertToAllocationData = (
    obj: { [key: string]: number }
  ): Array<{ name: string; value: number; percentage: number }> => {
    return Object.entries(obj)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / totalNavForAllocation) * 100,
      }))
      .sort((a, b) => b.value - a.value)
  }

  // Direct investments summary
  const directInvestmentsSummary = {
    totalInvestmentAmount: directInvestmentAmount,
    totalRevenue: directInvestments.reduce((sum, di) => sum + (di.revenue || 0), 0),
    totalARR: directInvestments.reduce((sum, di) => sum + (di.arr || 0), 0),
    count: directInvestments.length,
  }

  return (
    <DashboardClient
      funds={funds.map((fund) => ({
        ...fund,
        navHistory: fund.navHistory.map((nh) => ({
          date: nh.date,
          nav: nh.nav,
        })),
        documents: fund.documents.map((doc) => ({
          id: doc.id,
          title: doc.title,
          dueDate: doc.dueDate,
          callAmount: doc.callAmount,
          paymentStatus: doc.paymentStatus,
        })),
      }))}
      portfolioSummary={{
        combinedCommitment,
        combinedNav,
        combinedTvpi: fundTvpi,
        activeCapitalCalls,
        fundCommitment,
        fundNav,
        fundPaidIn,
        fundTvpi,
        directInvestmentAmount,
        directInvestmentValue,
      }}
      directInvestments={directInvestments.map((di) => ({
        ...di,
        investmentDate: di.investmentDate,
        maturityDate: di.maturityDate,
        purchaseDate: di.purchaseDate,
        acquisitionDate: di.acquisitionDate,
        cashMaturityDate: di.cashMaturityDate,
        lastReportDate: di.lastReportDate,
      }))}
      directInvestmentsSummary={directInvestmentsSummary}
      allocationData={{
        byManager: convertToAllocationData(allocationByManager),
        byAssetClass: convertToAllocationData(allocationByAssetClass),
        byGeography: convertToAllocationData(allocationByGeography),
      }}
      userRole={user.role || 'USER'}
      userFirstName={user.firstName || user.name?.split(' ')[0] || 'User'}
    />
  )
}
