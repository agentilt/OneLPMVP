import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { FundDetailClient } from './FundDetailClient'

export default async function FundDetailPage({
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

  // Fetch fund with all related data
  const fund = await prisma.fund.findUnique({
    where: { id },
    include: {
      navHistory: {
        orderBy: { date: 'asc' },
      },
      documents: {
        orderBy: { uploadDate: 'desc' },
      },
    },
  })

  if (!fund) {
    notFound()
  }

  // Check if user has access to this fund (by client relationship or ownership)
  // Admins can see all funds
  if (session.user.role !== 'ADMIN') {
    const hasAccess = 
      (user?.clientId && fund.clientId === user.clientId) ||
      fund.userId === session.user.id
    
    if (!hasAccess) {
      notFound()
    }
  }

  return <FundDetailClient fund={fund} />
}

