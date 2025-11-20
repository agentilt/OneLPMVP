import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
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

  // Fetch funds for portfolio analysis
  const funds = await prisma.fund.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      nav: 'desc',
    },
  })

  // Fetch direct investments
  const directInvestments = await prisma.directInvestment.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      currentValue: 'desc',
    },
  })

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
        }}
        portfolioMetrics={{
          totalCommitment,
          totalNav,
          totalPaidIn,
          totalPortfolioValue,
          unfundedCommitments,
          diTotalValue,
        }}
      />
    </div>
  )
}

