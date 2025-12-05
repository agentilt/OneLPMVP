import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AdminDashboardClient } from './AdminDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Fetch statistics
  const [totalUsers, totalFunds, totalDocuments, pendingInvitations] = await Promise.all([
    prisma.user.count(),
    prisma.fund.count(),
    prisma.document.count(),
    prisma.invitation.count({
      where: {
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    }),
  ])

  // Recent activity
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  const recentDocuments = await prisma.document.findMany({
    orderBy: { uploadDate: 'desc' },
    take: 5,
    include: {
      fund: {
        select: {
          name: true,
        },
      },
    },
  })

  return (
    <AdminDashboardClient
      stats={{
        totalUsers,
        totalFunds,
        totalDocuments,
        pendingInvitations,
      }}
      recentUsers={recentUsers}
      recentDocuments={recentDocuments}
    />
  )
}

