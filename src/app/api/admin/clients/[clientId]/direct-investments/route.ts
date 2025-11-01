import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireAdmin(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  if (apiKey && process.env.ADMIN_API_KEY && apiKey === process.env.ADMIN_API_KEY) {
    return { apiKeyAuth: true }
  }
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

// GET /api/admin/clients/[clientId]/direct-investments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const directInvestments = await prisma.directInvestment.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        documents: {
          orderBy: { uploadDate: 'desc' },
          take: 1,
        },
      },
    })

    return NextResponse.json({ data: directInvestments })
  } catch (error) {
    console.error('[error] GET /api/admin/clients/[clientId]/direct-investments error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST /api/admin/clients/[clientId]/direct-investments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params
    const body = await request.json()
    
    const {
      name,
      industry,
      stage,
      investmentDate,
      investmentAmount,
      period,
      periodDate,
      highlights,
      lowlights,
      milestones,
      recentRounds,
      capTableChanges,
      revenue,
      arr,
      mrr,
      grossMargin,
      runRate,
      burn,
      runway,
      headcount,
      cac,
      ltv,
      nrr,
      cashBalance,
      lastReportDate,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const directInvestment = await prisma.directInvestment.create({
      data: {
        clientId,
        name,
        industry: industry || null,
        stage: stage || null,
        investmentDate: investmentDate ? new Date(investmentDate) : null,
        investmentAmount: investmentAmount !== undefined ? parseFloat(String(investmentAmount)) : null,
        period: period || null,
        periodDate: periodDate ? new Date(periodDate) : null,
        highlights: highlights || null,
        lowlights: lowlights || null,
        milestones: milestones || null,
        recentRounds: recentRounds || null,
        capTableChanges: capTableChanges || null,
        revenue: revenue !== undefined ? parseFloat(String(revenue)) : null,
        arr: arr !== undefined ? parseFloat(String(arr)) : null,
        mrr: mrr !== undefined ? parseFloat(String(mrr)) : null,
        grossMargin: grossMargin !== undefined ? parseFloat(String(grossMargin)) : null,
        runRate: runRate !== undefined ? parseFloat(String(runRate)) : null,
        burn: burn !== undefined ? parseFloat(String(burn)) : null,
        runway: runway !== undefined ? parseFloat(String(runway)) : null,
        headcount: headcount !== undefined ? parseInt(String(headcount)) : null,
        cac: cac !== undefined ? parseFloat(String(cac)) : null,
        ltv: ltv !== undefined ? parseFloat(String(ltv)) : null,
        nrr: nrr !== undefined ? parseFloat(String(nrr)) : null,
        cashBalance: cashBalance !== undefined ? parseFloat(String(cashBalance)) : null,
        lastReportDate: lastReportDate ? new Date(lastReportDate) : null,
      },
    })

    return NextResponse.json({ data: directInvestment }, { status: 201 })
  } catch (error: any) {
    console.error('[error] POST /api/admin/clients/[clientId]/direct-investments error:', error)
    return NextResponse.json({ 
      error: process.env.NODE_ENV === 'development' ? error?.message || 'An error occurred' : 'An error occurred',
      details: process.env.NODE_ENV === 'development' ? {
        name: error?.name,
        code: error?.code,
      } : undefined
    }, { status: 500 })
  }
}

