import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DirectInvestmentDocumentType } from '@prisma/client'
import { aggregateDirectInvestmentMetrics } from '@/lib/direct-investment-aggregation'

// Admin auth via x-api-key or NextAuth ADMIN session
async function requireAdmin(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  if (apiKey && process.env.ADMIN_API_KEY && apiKey === process.env.ADMIN_API_KEY) {
    return { apiKeyAuth: true }
  }
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

// GET /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents (list)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; investmentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { investmentId } = await params

    // Ensure direct investment exists
    const directInvestment = await prisma.directInvestment.findUnique({ 
      where: { id: investmentId }, 
      select: { id: true } 
    })
    if (!directInvestment) {
      return NextResponse.json({ error: 'Direct investment not found' }, { status: 404 })
    }

    const documents = await prisma.directInvestmentDocument.findMany({
      where: { directInvestmentId: investmentId },
      orderBy: { uploadDate: 'desc' },
    })

    return NextResponse.json({ data: documents })
  } catch (error) {
    console.error('[error] GET /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents
export async function POST(
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

    const {
      type,
      title,
      url,
      uploadDate,
      dueDate,
      parsedData,
      // Executive Summary Fields
      period,
      periodDate,
      highlights,
      lowlights,
      milestones,
      recentRounds,
      capTableChanges,
      // Metrics Fields
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
    } = body || {}

    if (!type || !title || !url) {
      return NextResponse.json({ error: 'type, title and url are required' }, { status: 400 })
    }

    // Validate/normalize enum
    const normalizedType = String(type).toUpperCase().replace(/\s+/g, '_')
    const validTypes = new Set(Object.keys(DirectInvestmentDocumentType))
    const finalType = (validTypes.has(normalizedType) ? normalizedType : 'OTHER') as keyof typeof DirectInvestmentDocumentType

    // Ensure direct investment exists
    const directInvestment = await prisma.directInvestment.findUnique({ 
      where: { id: investmentId }, 
      select: { id: true } 
    })
    if (!directInvestment) {
      return NextResponse.json({ error: 'Direct investment not found' }, { status: 404 })
    }

    const document = await prisma.directInvestmentDocument.create({
      data: {
        directInvestmentId: investmentId,
        type: DirectInvestmentDocumentType[finalType],
        title,
        url,
        uploadDate: uploadDate ? new Date(uploadDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        parsedData: parsedData ?? null,
        // Executive Summary Fields
        period: period || null,
        periodDate: periodDate ? new Date(periodDate) : null,
        highlights: highlights || null,
        lowlights: lowlights || null,
        milestones: milestones || null,
        recentRounds: recentRounds || null,
        capTableChanges: capTableChanges || null,
        // Metrics Fields
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
      },
    })

    // Trigger aggregation to update the direct investment with latest metrics
    await aggregateDirectInvestmentMetrics(investmentId)

    return NextResponse.json({ data: document }, { status: 201 })
  } catch (error) {
    console.error('[error] POST /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

