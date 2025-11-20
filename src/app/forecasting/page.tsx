import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ForecastingClient } from './ForecastingClient'
import { Topbar } from '@/components/Topbar'

export const metadata = {
  title: 'Forecasting | OneLPM',
  description: 'Cash flow projections and scenario planning',
}

export default async function ForecastingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Fetch funds for forecasting
  const funds = await prisma.fund.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      vintage: 'desc',
    },
  })

  // Fetch distributions for historical analysis
  const distributions = await prisma.distribution.findMany({
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
      distributionDate: 'desc',
    },
    take: 50,
  })

  // Fetch capital call documents for historical pacing
  const capitalCalls = await prisma.document.findMany({
    where: {
      fund: {
        userId: session.user.id,
      },
      type: 'CAPITAL_CALL',
    },
    include: {
      fund: {
        select: {
          name: true,
          vintage: true,
        },
      },
    },
    orderBy: {
      dueDate: 'desc',
    },
    take: 50,
  })

  // Calculate portfolio metrics
  const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
  const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
  const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
  const unfundedCommitments = totalCommitment - totalPaidIn
  const totalDistributions = distributions.reduce((sum, dist) => sum + dist.amount, 0)

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar />
      <ForecastingClient
        funds={funds}
        distributions={distributions}
        capitalCalls={capitalCalls}
        portfolioMetrics={{
          totalCommitment,
          totalPaidIn,
          totalNav,
          unfundedCommitments,
          totalDistributions,
        }}
      />
    </div>
  )
}

