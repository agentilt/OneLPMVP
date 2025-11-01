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

// GET /api/admin/clients/[clientId]/direct-investments/[investmentId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; investmentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId, investmentId } = await params

    const directInvestment = await prisma.directInvestment.findFirst({
      where: {
        id: investmentId,
        clientId: clientId,
      },
      include: {
        documents: {
          orderBy: { uploadDate: 'desc' },
        },
      },
    })

    if (!directInvestment) {
      return NextResponse.json({ error: 'Direct investment not found' }, { status: 404 })
    }

    return NextResponse.json({ data: directInvestment })
  } catch (error) {
    console.error('[error] GET /api/admin/clients/[clientId]/direct-investments/[investmentId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// PUT /api/admin/clients/[clientId]/direct-investments/[investmentId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; investmentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { investmentId } = await params
    const body = await request.json()
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.industry !== undefined) updateData.industry = body.industry
    if (body.stage !== undefined) updateData.stage = body.stage
    if (body.investmentDate !== undefined) updateData.investmentDate = body.investmentDate ? new Date(body.investmentDate) : null
    if (body.investmentAmount !== undefined) updateData.investmentAmount = body.investmentAmount !== null ? parseFloat(String(body.investmentAmount)) : null
    if (body.period !== undefined) updateData.period = body.period
    if (body.periodDate !== undefined) updateData.periodDate = body.periodDate ? new Date(body.periodDate) : null
    if (body.highlights !== undefined) updateData.highlights = body.highlights
    if (body.lowlights !== undefined) updateData.lowlights = body.lowlights
    if (body.milestones !== undefined) updateData.milestones = body.milestones
    if (body.recentRounds !== undefined) updateData.recentRounds = body.recentRounds
    if (body.capTableChanges !== undefined) updateData.capTableChanges = body.capTableChanges
    if (body.revenue !== undefined) updateData.revenue = body.revenue !== null ? parseFloat(String(body.revenue)) : null
    if (body.arr !== undefined) updateData.arr = body.arr !== null ? parseFloat(String(body.arr)) : null
    if (body.mrr !== undefined) updateData.mrr = body.mrr !== null ? parseFloat(String(body.mrr)) : null
    if (body.grossMargin !== undefined) updateData.grossMargin = body.grossMargin !== null ? parseFloat(String(body.grossMargin)) : null
    if (body.runRate !== undefined) updateData.runRate = body.runRate !== null ? parseFloat(String(body.runRate)) : null
    if (body.burn !== undefined) updateData.burn = body.burn !== null ? parseFloat(String(body.burn)) : null
    if (body.runway !== undefined) updateData.runway = body.runway !== null ? parseFloat(String(body.runway)) : null
    if (body.headcount !== undefined) updateData.headcount = body.headcount !== null ? parseInt(String(body.headcount)) : null
    if (body.cac !== undefined) updateData.cac = body.cac !== null ? parseFloat(String(body.cac)) : null
    if (body.ltv !== undefined) updateData.ltv = body.ltv !== null ? parseFloat(String(body.ltv)) : null
    if (body.nrr !== undefined) updateData.nrr = body.nrr !== null ? parseFloat(String(body.nrr)) : null
    if (body.cashBalance !== undefined) updateData.cashBalance = body.cashBalance !== null ? parseFloat(String(body.cashBalance)) : null
    if (body.lastReportDate !== undefined) updateData.lastReportDate = body.lastReportDate ? new Date(body.lastReportDate) : null

    const directInvestment = await prisma.directInvestment.update({
      where: { id: investmentId },
      data: updateData,
    })

    return NextResponse.json({ data: directInvestment })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Direct investment not found' }, { status: 404 })
    }
    console.error('[error] PUT /api/admin/clients/[clientId]/direct-investments/[investmentId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE /api/admin/clients/[clientId]/direct-investments/[investmentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; investmentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { investmentId } = await params

    await prisma.directInvestment.delete({
      where: { id: investmentId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Direct investment not found' }, { status: 404 })
    }
    console.error('[error] DELETE /api/admin/clients/[clientId]/direct-investments/[investmentId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

