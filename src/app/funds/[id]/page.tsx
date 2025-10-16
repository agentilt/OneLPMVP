import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { FundDetailClient } from './FundDetailClient'

export default async function FundDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Check if user has access to this fund
  const fundAccess = await prisma.fundAccess.findFirst({
    where: {
      userId: session.user.id,
      fundId: params.id,
    },
  })

  // Admins can see all funds
  if (!fundAccess && session.user.role !== 'ADMIN') {
    notFound()
  }

  // Fetch fund with all related data
  const fund = await prisma.fund.findUnique({
    where: { id: params.id },
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

  return <FundDetailClient fund={fund} />
}

