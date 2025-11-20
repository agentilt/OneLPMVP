import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { RiskClient } from './RiskClient'
import { Topbar } from '@/components/Topbar'

export const metadata = {
  title: 'Risk Management | OneLPM',
  description: 'Monitor portfolio risk, concentration, and compliance',
}

export default async function RiskPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Fetch funds for risk analysis
  const funds = await prisma.fund.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      commitment: 'desc',
    },
  })

  // Fetch direct investments
  const directInvestments = await prisma.directInvestment.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      investedAmount: 'desc',
    },
  })

  // Calculate risk metrics
  const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
  const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
  const totalDI = directInvestments.reduce((sum, di) => sum + di.currentValue, 0)
  const totalPortfolio = totalNav + totalDI

  // Calculate concentration by asset class
  const assetClassConcentration = funds.reduce((acc: { [key: string]: number }, fund) => {
    acc[fund.assetClass] = (acc[fund.assetClass] || 0) + fund.nav
    return acc
  }, {})

  // Calculate concentration by geography
  const geographyConcentration = funds.reduce((acc: { [key: string]: number }, fund) => {
    acc[fund.geography] = (acc[fund.geography] || 0) + fund.nav
    return acc
  }, {})

  // Calculate unfunded commitments
  const unfundedCommitments = funds.reduce(
    (sum, fund) => sum + (fund.commitment - fund.contributions),
    0
  )

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar />
      <RiskClient
        funds={funds}
        directInvestments={directInvestments}
        riskMetrics={{
          totalPortfolio,
          totalCommitment,
          unfundedCommitments,
          assetClassConcentration,
          geographyConcentration,
        }}
      />
    </div>
  )
}

