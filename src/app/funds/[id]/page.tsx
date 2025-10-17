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

  // Check if user owns this fund (Admins can see all funds)
  if (fund.userId !== session.user.id && session.user.role !== 'ADMIN') {
    notFound()
  }

  return <FundDetailClient fund={fund} />
}

