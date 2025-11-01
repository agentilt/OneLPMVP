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

// GET /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents/[documentId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; investmentId: string; documentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await params

    const document = await prisma.directInvestmentDocument.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ data: document })
  } catch (error) {
    console.error('[error] GET /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents/[documentId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// PUT /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents/[documentId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; investmentId: string; documentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { investmentId, documentId } = await params
    const body = await request.json()
    const updateData: any = {}

    if (body.type !== undefined) {
      const normalizedType = String(body.type).toUpperCase().replace(/\s+/g, '_')
      const validTypes = new Set(Object.keys(DirectInvestmentDocumentType))
      updateData.type = validTypes.has(normalizedType)
        ? DirectInvestmentDocumentType[normalizedType as keyof typeof DirectInvestmentDocumentType]
        : DirectInvestmentDocumentType.OTHER
    }
    if (body.title !== undefined) updateData.title = body.title
    if (body.url !== undefined) updateData.url = body.url
    if (body.uploadDate !== undefined) updateData.uploadDate = new Date(body.uploadDate)
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.parsedData !== undefined) updateData.parsedData = body.parsedData
    
    // Executive Summary Fields
    if (body.period !== undefined) updateData.period = body.period
    if (body.periodDate !== undefined) updateData.periodDate = body.periodDate ? new Date(body.periodDate) : null
    if (body.highlights !== undefined) updateData.highlights = body.highlights
    if (body.lowlights !== undefined) updateData.lowlights = body.lowlights
    if (body.milestones !== undefined) updateData.milestones = body.milestones
    if (body.recentRounds !== undefined) updateData.recentRounds = body.recentRounds
    if (body.capTableChanges !== undefined) updateData.capTableChanges = body.capTableChanges
    
    // Metrics Fields
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

    const document = await prisma.directInvestmentDocument.update({
      where: { id: documentId },
      data: updateData,
    })

    // Trigger aggregation to update the direct investment with latest metrics
    await aggregateDirectInvestmentMetrics(investmentId)

    return NextResponse.json({ data: document })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    console.error('[error] PUT /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents/[documentId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents/[documentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; investmentId: string; documentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { investmentId, documentId } = await params

    await prisma.directInvestmentDocument.delete({
      where: { id: documentId },
    })

    // Trigger aggregation to update the direct investment after document deletion
    await aggregateDirectInvestmentMetrics(investmentId)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    console.error('[error] DELETE /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents/[documentId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

