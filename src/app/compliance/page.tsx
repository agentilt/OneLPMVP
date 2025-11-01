import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Topbar } from '@/components/Topbar'
import { ComplianceClient } from './ComplianceClient'

export default async function CompliancePage() {
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

  // Fetch compliance documents for the user's funds based on client relationship
  const funds = await prisma.fund.findMany({
    where: whereClause,
    include: {
      documents: {
        where: {
          type: 'COMPLIANCE',
        },
        orderBy: { uploadDate: 'desc' },
      },
    },
  })

  const complianceDocuments = funds.flatMap((fund) =>
    fund.documents.map((doc) => ({
      ...doc,
      fundName: fund.name,
    }))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Topbar />
      <ComplianceClient documents={complianceDocuments} />
    </div>
  )
}

