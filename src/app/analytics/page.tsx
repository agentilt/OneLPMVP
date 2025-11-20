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

  // Fetch funds for the user
  const funds = await prisma.fund.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Fetch direct investments
  const directInvestments = await prisma.directInvestment.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Calculate portfolio summary
  const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
  const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
  const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
  const totalDistributions = funds.reduce((sum, fund) => sum + (fund.dpi * fund.paidIn), 0)
  
  const portfolioTvpi = totalPaidIn > 0 
    ? (totalNav + totalDistributions) / totalPaidIn 
    : 0

  // Calculate direct investments totals
  const diTotalInvested = directInvestments.reduce((sum, di) => sum + di.investedAmount, 0)
  const diTotalValue = directInvestments.reduce((sum, di) => sum + di.currentValue, 0)

  // Get recent activity (capital calls, distributions)
  const recentCapitalCalls = await prisma.capitalCall.findMany({
    where: {
      fund: {
        userId: session.user.id,
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
      dueDate: 'desc',
    },
    take: 5,
  })

  const recentDistributions = await prisma.distribution.findMany({
    where: {
      fund: {
        userId: session.user.id,
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
      date: 'desc',
    },
    take: 5,
  })

  // Calculate risk metrics
  const unfundedCommitments = funds.reduce(
    (sum, fund) => sum + (fund.commitment - fund.paidIn),
    0
  )

  // Count active investments (all funds and direct investments are considered active for now)
  const activeFunds = funds.length
  const activeDirectInvestments = directInvestments.length

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
      />
    </div>
  )
}

