import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AdminUsersClient } from './AdminUsersClient'

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const [users, allFunds, invitations] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        fundAccess: {
          include: {
            fund: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.fund.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ])

  return <AdminUsersClient users={users} allFunds={allFunds} invitations={invitations} />
}

