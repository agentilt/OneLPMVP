import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/direct-investments (for regular users)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user to get their clientId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clientId: true, role: true },
    })

    // Build query: if user has clientId, fetch by clientId; otherwise fallback to userId (legacy)
    // Admins can see all direct investments
    const whereClause = 
      session.user.role === 'ADMIN'
        ? {}
        : user?.clientId
          ? { clientId: user.clientId }
          : { userId: session.user.id }

    // Fetch user's direct investments
    const directInvestments = await prisma.directInvestment.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        industry: true,
        stage: true,
        investmentDate: true,
        investmentAmount: true,
        period: true,
        periodDate: true,
        revenue: true,
        arr: true,
        mrr: true,
        cashBalance: true,
        lastReportDate: true,
        documents: {
          orderBy: { uploadDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: directInvestments })
  } catch (error) {
    console.error('Error fetching direct investments:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching direct investments' },
      { status: 500 }
    )
  }
}

