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

  const [funds, distributions, capitalCalls] = await Promise.all([
    prisma.fund.findMany({
      where: fundsWhereClause,
      orderBy: {
        vintage: 'desc',
      },
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
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        distributionDate: 'desc',
      },
      take: 50,
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
            id: true,
            name: true,
            vintage: true,
          },
        },
      },
      orderBy: {
        dueDate: 'desc',
      },
      take: 50,
    }),
  ])

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
