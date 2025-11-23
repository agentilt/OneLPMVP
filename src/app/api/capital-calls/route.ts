import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type CapitalCallStatus = 'PAID' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING'

const getStatus = (paymentStatus: string | null, dueDate: Date | null): CapitalCallStatus => {
  if (paymentStatus === 'PAID') return 'PAID'
  if (!dueDate) return 'UPCOMING'

  const today = new Date()
  const due = new Date(dueDate)
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'OVERDUE'
  if (diffDays <= 14) return 'DUE_SOON'
  return 'UPCOMING'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, clientId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let fundsWhere: any = {}
    if (user.role === 'ADMIN') {
      fundsWhere = {}
    } else if (user.clientId) {
      fundsWhere = { clientId: user.clientId }
    } else {
      const access = await prisma.fundAccess.findMany({
        where: { userId: session.user.id },
        select: { fundId: true },
      })
      const accessible = access.map((a) => a.fundId)
      fundsWhere =
        accessible.length > 0
          ? { OR: [{ id: { in: accessible } }, { userId: session.user.id }] }
          : { userId: session.user.id }
    }

    const funds = await prisma.fund.findMany({
      where: fundsWhere,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        documents: {
          where: { type: 'CAPITAL_CALL' },
          orderBy: { dueDate: 'asc' },
          select: {
            id: true,
            title: true,
            dueDate: true,
            uploadDate: true,
            callAmount: true,
            paymentStatus: true,
          },
        },
      },
    })

    const capitalCalls = funds.flatMap((fund) =>
      fund.documents.map((doc) => {
        const status = getStatus(doc.paymentStatus, doc.dueDate)
        const dueDate = doc.dueDate || doc.uploadDate
        return {
          id: doc.id,
          fundId: fund.id,
          fundName: fund.name,
          title: doc.title,
          dueDate,
          uploadDate: doc.uploadDate,
          callAmount: doc.callAmount || 0,
          paymentStatus: doc.paymentStatus || 'PENDING',
          status,
        }
      })
    )

    const outstanding = capitalCalls.filter((c) => c.status !== 'PAID')
    const dueSoon = capitalCalls.filter((c) => c.status === 'DUE_SOON')
    const overdue = capitalCalls.filter((c) => c.status === 'OVERDUE')

    return NextResponse.json({
      success: true,
      data: {
        capitalCalls,
        summary: {
          totalCalls: capitalCalls.length,
          outstandingCount: outstanding.length,
          outstandingAmount: outstanding.reduce((sum, c) => sum + Math.abs(c.callAmount), 0),
          dueSoonCount: dueSoon.length,
          dueSoonAmount: dueSoon.reduce((sum, c) => sum + Math.abs(c.callAmount), 0),
          overdueCount: overdue.length,
          overdueAmount: overdue.reduce((sum, c) => sum + Math.abs(c.callAmount), 0),
        },
      },
    })
  } catch (error) {
    console.error('Capital calls API error:', error)
    return NextResponse.json({ error: 'Failed to fetch capital calls' }, { status: 500 })
  }
}
