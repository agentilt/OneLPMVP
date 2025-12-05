import { getServerSession } from 'next-auth'
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { RiskClient } from './RiskClient'
import { Topbar } from '@/components/Topbar'
import { inferFundAssetClass, mapInvestmentTypeToAssetClass } from '@/lib/assetClass'

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

  const [fundsRaw, directInvestmentsRaw] = await Promise.all([
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

  const policy = await prisma.riskPolicy.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  })

  const funds = fundsRaw.map((fund) => ({
    ...fund,
    assetClass: fund.assetClass || inferFundAssetClass(fund),
  }))

  const directInvestments = directInvestmentsRaw.map((di) => ({
    ...di,
    assetClass: mapInvestmentTypeToAssetClass(di.investmentType as string | null),
  }))

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar />
      <RiskClient
        funds={funds}
        directInvestments={directInvestments}
        assetClasses={Array.from(new Set(funds.map((fund) => fund.assetClass))).sort()}
        policy={policy}
      />
    </div>
  )
}
