import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserFundsClient } from './UserFundsClient'

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Fetch user with their funds
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      funds: {
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!user) {
    notFound()
  }

  return <UserFundsClient user={user} />
}

