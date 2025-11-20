import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.toLowerCase()

    // Search funds
    const funds = await prisma.fund.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { manager: { contains: searchTerm, mode: 'insensitive' } },
          { domicile: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 10,
    })

    // Search direct investments
    const directInvestments = await prisma.directInvestment.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { industry: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 10,
    })

    // Search saved reports
    const reports = await prisma.savedReport.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 5,
    })

    // Format results
    const results = [
      ...funds.map((fund) => ({
        id: fund.id,
        type: 'fund' as const,
        title: fund.name,
        subtitle: `${fund.manager} • ${fund.domicile}`,
        url: `/funds/${fund.id}`,
        metadata: {
          amount: fund.nav,
        },
      })),
      ...directInvestments.map((di) => ({
        id: di.id,
        type: 'direct-investment' as const,
        title: di.name,
        subtitle: di.industry || 'Direct Investment',
        url: `/direct-investments/${di.id}`,
        metadata: {
          amount: di.currentValue || di.investmentAmount || 0,
        },
      })),
      ...reports.map((report) => ({
        id: report.id,
        type: 'report' as const,
        title: report.name,
        subtitle: report.description || 'Saved Report',
        url: `/reports/${report.id}`,
        metadata: {
          date: report.createdAt.toISOString(),
        },
      })),
    ]

    // Sort by relevance (simple: prioritize exact matches)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchTerm) ? 1 : 0
      const bExact = b.title.toLowerCase().includes(searchTerm) ? 1 : 0
      return bExact - aExact
    })

    return NextResponse.json({ results: results.slice(0, 20) })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

