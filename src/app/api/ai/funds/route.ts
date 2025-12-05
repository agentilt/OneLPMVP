import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ funds: [] }, { status: 401 })
  }

  const userId = session.user.id
  const clientId = (session.user as any)?.clientId as string | undefined

  const fundAccess = await prisma.fundAccess.findMany({
    where: { userId },
    select: { fundId: true },
  })

  const funds = await prisma.fund.findMany({
    where: {
      OR: [
        { userId },
        { id: { in: fundAccess.map((f) => f.fundId) } },
        ...(clientId ? [{ clientId }] : []),
      ],
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ funds })
}
