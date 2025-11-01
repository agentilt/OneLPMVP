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
  
  // Calculate weighted TVPI
  const portfolioTvpi = totalPaidIn > 0 ? totalNav / totalPaidIn : 0

  // Count active capital calls
  const activeCapitalCalls = funds.reduce(
    (sum, fund) => sum + fund.documents.length,
    0
  )

  // Fetch user's crypto holdings
  const cryptoHoldings = await prisma.cryptoHolding.findMany({
    where: { userId: session.user.id },
  })

  const totalCryptoValue = cryptoHoldings.reduce(
    (sum, holding) => sum + holding.valueUsd,
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
      cryptoHoldings={cryptoHoldings}
      userRole={session.user.role}
      userFirstName={userDetails?.firstName || userDetails?.name?.split(' ')[0] || 'User'}
    />
  )
}

