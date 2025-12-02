import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DirectInvestmentDetailClient } from './DirectInvestmentDetailClient'

export default async function DirectInvestmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Fetch user to get their clientId
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { clientId: true, role: true },
  })

  // Fetch direct investment with all related data
  const directInvestment = await prisma.directInvestment.findUnique({
    where: { id },
    include: {
      documents: {
        orderBy: { uploadDate: 'desc' },
      },
    },
  })

  if (!directInvestment) {
    notFound()
  }

  // Check if user has access to this direct investment (by client relationship or ownership)
  // Admins can see all direct investments
  if (session.user.role !== 'ADMIN') {
    const hasAccess = 
      (user?.clientId && directInvestment.clientId === user.clientId) ||
      directInvestment.userId === session.user.id
    
    if (!hasAccess) {
      notFound()
    }
  }

  const historicalMetrics = (directInvestment.documents || [])
    .filter((doc) => !!doc.uploadDate)
    .map((doc) => ({
      date: doc.uploadDate?.toISOString() || '',
      periodDate: doc.periodDate ? doc.periodDate.toISOString() : null,
      period: doc.period || null,
      documentTitle: doc.title,
      documentId: doc.id,
      metrics: {
        revenue: doc.revenue ?? null,
        arr: doc.arr ?? null,
        mrr: doc.mrr ?? null,
        grossMargin: doc.grossMargin ?? null,
        runRate: doc.runRate ?? null,
        burn: doc.burn ?? null,
        runway: doc.runway ?? null,
        headcount: doc.headcount ?? null,
        cac: doc.cac ?? null,
        ltv: doc.ltv ?? null,
        nrr: doc.nrr ?? null,
        cashBalance: doc.cashBalance ?? null,
      },
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <DirectInvestmentDetailClient
      directInvestment={directInvestment}
      historicalMetrics={historicalMetrics}
    />
  )
}
