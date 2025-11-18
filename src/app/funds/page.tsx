import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Topbar } from '@/components/Topbar'
import { FundsClient } from './FundsClient'

export default async function FundsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Fetch user to get their clientId
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clientId: true, role: true },
  })

  // Build query: if user has clientId, fetch funds by clientId; otherwise fallback to userId (legacy)
  // Admins can see all funds
  const whereClause = 
    session.user.role === 'ADMIN'
      ? {}
      : user?.clientId
        ? { clientId: user.clientId }
        : { userId: session.user.id }

  // Fetch user's funds based on client relationship
  const funds = await prisma.fund.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      domicile: true,
      vintage: true,
      manager: true,
      managerEmail: true,
      managerPhone: true,
      managerWebsite: true,
      commitment: true,
      paidIn: true,
      nav: true,
      tvpi: true,
      dpi: true,
      lastReportDate: true,
      navHistory: {
        orderBy: { date: 'asc' },
        select: {
          date: true,
          nav: true,
        },
      },
      documents: {
        where: {
          type: 'CAPITAL_CALL',
          paymentStatus: {
            in: ['PENDING', 'LATE', 'OVERDUE'],
          },
        },
        select: {
          id: true,
        },
      },
    },
  })

  // Calculate fund summary
  const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
  const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
  const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
  const totalDistributions = funds.reduce((sum, fund) => sum + (fund.dpi * fund.paidIn), 0)
  const portfolioTvpi = totalPaidIn > 0 ? (totalNav + totalDistributions) / totalPaidIn : 0
  const activeCapitalCalls = funds.reduce((sum, fund) => sum + fund.documents.length, 0)

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar />
      <FundsClient 
        funds={funds} 
        fundSummary={{
          totalCommitment,
          totalNav,
          portfolioTvpi,
          activeCapitalCalls,
        }}
      />
    </div>
  )
}

