import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Topbar } from '@/components/Topbar'
import { FundsClient } from './FundsClient'

export default async function FundsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Fetch user's funds (now directly owned by user)
  const funds = await prisma.fund.findMany({
    where: { userId: session.user.id },
    include: {
      navHistory: {
        orderBy: { date: 'asc' },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Topbar />
      <FundsClient funds={funds} />
    </div>
  )
}

