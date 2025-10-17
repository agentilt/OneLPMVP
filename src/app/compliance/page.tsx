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

  // Fetch compliance documents for the user's funds (now directly owned by user)
  const funds = await prisma.fund.findMany({
    where: { userId: session.user.id },
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

