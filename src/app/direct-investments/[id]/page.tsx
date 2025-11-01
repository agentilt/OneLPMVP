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

  return <DirectInvestmentDetailClient directInvestment={directInvestment} />
}

