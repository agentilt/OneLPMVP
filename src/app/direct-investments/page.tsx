import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Topbar } from '@/components/Topbar'
import { DirectInvestmentsClient } from './DirectInvestmentsClient'

export default async function DirectInvestmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Fetch user to get their clientId
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clientId: true, role: true },
  })

  // Build query: if user has clientId, fetch direct investments by clientId; otherwise fallback to userId (legacy)
  // Admins can see all direct investments
  const whereClause = 
    session.user.role === 'ADMIN'
      ? {}
      : user?.clientId
        ? { clientId: user.clientId }
        : { userId: session.user.id }

  // Fetch user's direct investments
  const directInvestments = await prisma.directInvestment.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      industry: true,
      stage: true,
      investmentDate: true,
      investmentAmount: true,
      contactEmail: true,
      contactPhone: true,
      contactWebsite: true,
      period: true,
      periodDate: true,
      revenue: true,
      arr: true,
      mrr: true,
      cashBalance: true,
      lastReportDate: true,
      documents: {
        orderBy: { uploadDate: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Topbar />
      <DirectInvestmentsClient directInvestments={directInvestments} />
    </div>
  )
}

