import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReportsClient } from './ReportsClient'
import { prisma } from '@/lib/db'

export const metadata = {
  title: 'Reports - OneLP',
  description: 'Custom reports and analytics',
}

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Fetch user's saved reports
  const savedReports = await prisma.savedReport.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  // Fetch user's accessible funds for report building
  const userFunds = await prisma.userFund.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      fund: {
        select: {
          id: true,
          name: true,
          domicile: true,
          vintage: true,
          manager: true,
          commitment: true,
          paidIn: true,
          nav: true,
          tvpi: true,
          dpi: true,
        },
      },
    },
  })

  const funds = userFunds.map((uf) => uf.fund)

  // Fetch user's direct investments
  const directInvestments = await prisma.directInvestment.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      investmentType: true,
      industry: true,
      stage: true,
      investmentAmount: true,
      currentValue: true,
    },
  })

  return (
    <ReportsClient
      savedReports={savedReports}
      funds={funds}
      directInvestments={directInvestments}
      userRole={session.user.role || 'LIMITED_PARTNER'}
    />
  )
}

