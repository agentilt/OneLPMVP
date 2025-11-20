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

  const [funds, directInvestments] = await Promise.all([
    prisma.fund.findMany({
      where: fundsWhereClause,
      orderBy: {
        commitment: 'desc',
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
        investmentAmount: 'desc',
      },
    }),
  ])

  // Calculate risk metrics
  const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
  const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
  const totalDI = directInvestments.reduce((sum, di) => sum + (di.currentValue || 0), 0)
  const totalPortfolio = totalNav + totalDI

  // Calculate concentration by manager (placeholder for asset class)
  const assetClassConcentration = funds.reduce((acc: { [key: string]: number }, fund) => {
    const manager = fund.manager || 'Unknown'
    acc[manager] = (acc[manager] || 0) + fund.nav
    return acc
  }, {})

  // Calculate concentration by geography (using domicile)
  const geographyConcentration = funds.reduce((acc: { [key: string]: number }, fund) => {
    const geography = fund.domicile || 'Unknown'
    acc[geography] = (acc[geography] || 0) + fund.nav
    return acc
  }, {})

  // Calculate unfunded commitments
  const unfundedCommitments = funds.reduce(
    (sum, fund) => sum + (fund.commitment - fund.paidIn),
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

