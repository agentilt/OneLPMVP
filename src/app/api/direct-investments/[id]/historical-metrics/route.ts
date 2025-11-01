import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getHistoricalMetrics } from '@/lib/direct-investment-aggregation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch user to check access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clientId: true, role: true },
    })

    // Fetch direct investment to verify access
    const directInvestment = await prisma.directInvestment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        clientId: true,
      },
    })

    if (!directInvestment) {
      return NextResponse.json({ error: 'Direct investment not found' }, { status: 404 })
    }

    // Check access: Admins can see all, users can see their own or client's investments
    if (session.user.role !== 'ADMIN') {
      const hasAccess = 
        (user?.clientId && directInvestment.clientId === user.clientId) ||
        directInvestment.userId === session.user.id
      
      if (!hasAccess) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Get historical metrics
    const historicalMetrics = await getHistoricalMetrics(id)

    return NextResponse.json({ data: historicalMetrics })
  } catch (error) {
    console.error('[error] GET /api/direct-investments/[id]/historical-metrics error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

