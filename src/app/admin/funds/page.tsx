import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AdminFundsClient } from './AdminFundsClient'

export default async function AdminFundsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const funds = await prisma.fund.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          documents: true,
          fundAccess: true,
        },
      },
    },
  })

  return <AdminFundsClient funds={funds} />
}

