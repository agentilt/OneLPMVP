import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Fetch user to get their clientId
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clientId: true, role: true },
  })

  // Build query: if user has clientId, fetch funds by clientId; otherwise fallback to userId (legacy)
  // Admins can see all funds
  const whereClause = 
    session.user.role === 'ADMIN'
      ? {}
      : user?.clientId
        ? { clientId: user.clientId }
        : { userId: session.user.id }

  // Fetch user's funds based on client relationship
  const funds = await prisma.fund.findMany({
    where: whereClause,
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
      lastReportDate: true,
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
          paymentStatus: {
            in: ['PENDING', 'LATE', 'OVERDUE'],
          },
        },
        orderBy: { dueDate: 'asc' },
        select: {
          id: true,
          title: true,
          dueDate: true,
          callAmount: true,
          paymentStatus: true,
        },
      },
    },
  })

  // Calculate portfolio summary
  const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
  const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
  const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
  
  // Calculate total distributions: DPI * Paid-in for each fund
  const totalDistributions = funds.reduce((sum, fund) => sum + (fund.dpi * fund.paidIn), 0)
  
  // Calculate portfolio TVPI: (NAV + Distributions) / Paid-in
  const portfolioTvpi = totalPaidIn > 0 ? (totalNav + totalDistributions) / totalPaidIn : 0

  // Count active capital calls
  const activeCapitalCalls = funds.reduce(
    (sum, fund) => sum + fund.documents.length,
    0
  )

  // Fetch user's direct investments using the same access logic
  const directInvestmentsWhereClause = 
    session.user.role === 'ADMIN'
      ? {}
      : user?.clientId
        ? { clientId: user.clientId }
        : { userId: session.user.id }

  const directInvestments = await prisma.directInvestment.findMany({
    where: directInvestmentsWhereClause,
    select: {
      id: true,
      name: true,
      industry: true,
      stage: true,
      investmentDate: true,
      investmentAmount: true,
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
    orderBy: { createdAt: 'desc' },
  })

  // Calculate direct investments summary
  const totalDirectInvestmentAmount = directInvestments.reduce(
    (sum, inv) => sum + (inv.investmentAmount || 0),
    0
  )
  const totalDirectInvestmentRevenue = directInvestments.reduce(
    (sum, inv) => sum + (inv.revenue || 0),
    0
  )
  const totalDirectInvestmentARR = directInvestments.reduce(
    (sum, inv) => sum + (inv.arr || 0),
    0
  )

  // Fetch user details for greeting
  const userDetails = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, name: true },
  })

  return (
    <DashboardClient
      funds={funds}
      portfolioSummary={{
        totalCommitment,
        totalNav,
        portfolioTvpi,
        activeCapitalCalls,
      }}
      directInvestments={directInvestments}
      directInvestmentsSummary={{
        totalInvestmentAmount: totalDirectInvestmentAmount,
        totalRevenue: totalDirectInvestmentRevenue,
        totalARR: totalDirectInvestmentARR,
        count: directInvestments.length,
      }}
      userRole={session.user.role}
      userFirstName={userDetails?.firstName || userDetails?.name?.split(' ')[0] || 'User'}
    />
  )
}

