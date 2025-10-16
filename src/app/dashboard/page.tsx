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

  // Fetch user's funds with access control
  const fundsWithAccess = await prisma.fundAccess.findMany({
    where: { userId: session.user.id },
    include: {
      fund: {
        include: {
          navHistory: {
            orderBy: { date: 'asc' },
          },
          documents: {
            where: {
              type: 'CAPITAL_CALL',
              paymentStatus: {
                in: ['PENDING', 'LATE', 'OVERDUE'],
              },
            },
            orderBy: { dueDate: 'asc' },
          },
        },
      },
    },
  })

  const funds = fundsWithAccess.map((fa) => fa.fund)

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
  const user = await prisma.user.findUnique({
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
      userFirstName={user?.firstName || user?.name?.split(' ')[0] || 'User'}
    />
  )
}

