import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DEFAULT_PORTFOLIO_TARGETS } from '@/lib/portfolioTargets'
import { PortfolioBuilderClient } from './PortfolioBuilderClient'
import { Topbar } from '@/components/Topbar'

export const metadata = {
  title: 'Portfolio Builder | OneLPM',
  description: 'Optimize allocations and rebalance your portfolio',
}

export default async function PortfolioBuilderPage() {
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

  const [funds, directInvestments, portfolioModels] = await Promise.all([
    prisma.fund.findMany({
      where: fundsWhereClause,
      orderBy: {
        nav: 'desc',
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
        currentValue: 'desc',
      },
    }),
    prisma.portfolioModel.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  type DimensionKey = 'byManager' | 'byGeography' | 'byVintage'
  type PortfolioModelType = {
    id: string
    name: string
    targets: Record<DimensionKey, { [key: string]: number }>
  }

  let models: PortfolioModelType[] = portfolioModels.map((model) => ({
    id: model.id,
    name: model.name,
    targets: (model.targets as Record<DimensionKey, { [key: string]: number }>) || DEFAULT_PORTFOLIO_TARGETS,
  }))
  if (!models.length) {
    const seeded = await prisma.portfolioModel.create({
      data: {
        userId: session.user.id,
        name: 'Default Targets',
        targets: DEFAULT_PORTFOLIO_TARGETS,
      },
    })
    models = [
      {
        id: seeded.id,
        name: seeded.name,
        targets: (seeded.targets as Record<DimensionKey, { [key: string]: number }>) || DEFAULT_PORTFOLIO_TARGETS,
      },
    ]
  }

  // Calculate current portfolio metrics
  const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
  const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
  const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
  const diTotalValue = directInvestments.reduce((sum, di) => sum + (di.currentValue || 0), 0)
  const totalPortfolioValue = totalNav + diTotalValue
  const unfundedCommitments = totalCommitment - totalPaidIn

  // Calculate allocation by manager (as proxy for asset class)
  const allocationByManager = funds.reduce((acc: { [key: string]: number }, fund) => {
    const manager = fund.manager || 'Unknown'
    acc[manager] = (acc[manager] || 0) + fund.nav
    return acc
  }, {})

  // Calculate allocation by geography (using domicile)
  const allocationByGeography = funds.reduce((acc: { [key: string]: number }, fund) => {
    const geography = fund.domicile || 'Unknown'
    acc[geography] = (acc[geography] || 0) + fund.nav
    return acc
  }, {})

  // Calculate allocation by vintage
  const allocationByVintage = funds.reduce((acc: { [key: string]: number }, fund) => {
    const vintage = fund.vintage.toString()
    acc[vintage] = (acc[vintage] || 0) + fund.nav
    return acc
  }, {})

  const allocationByAssetClass = funds.reduce((acc: { [key: string]: number }, fund) => {
    const assetClass = (fund.assetClass as string) || 'Unspecified'
    acc[assetClass] = (acc[assetClass] || 0) + fund.nav
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar />
      <PortfolioBuilderClient
        funds={funds}
        directInvestments={directInvestments}
        currentAllocations={{
          byManager: allocationByManager,
          byGeography: allocationByGeography,
          byVintage: allocationByVintage,
          byAssetClass: allocationByAssetClass,
        }}
        portfolioMetrics={{
          totalCommitment,
          totalNav,
          totalPaidIn,
          totalPortfolioValue,
          unfundedCommitments,
          diTotalValue,
        }}
        portfolioModels={models}
      />
    </div>
  )
}
