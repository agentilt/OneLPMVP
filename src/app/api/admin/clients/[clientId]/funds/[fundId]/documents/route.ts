import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ingestCashFlowDataFromParsedData } from '@/lib/cashFlowIngestion'
import { DocumentType } from '@prisma/client'

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

// GET /api/admin/clients/[clientId]/funds/[fundId]/documents (list)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; fundId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fundId } = await params

    // Ensure fund exists
    const fund = await prisma.fund.findUnique({ where: { id: fundId }, select: { id: true } })
    if (!fund) {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
    }

    const documents = await prisma.document.findMany({
      where: { fundId },
      orderBy: { uploadDate: 'desc' },
    })

    return NextResponse.json({ data: documents })
  } catch (error) {
    console.error('[error] GET /api/admin/clients/[clientId]/funds/[fundId]/documents error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST /api/admin/clients/[clientId]/funds/[fundId]/documents
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; fundId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fundId } = await params
    const body = await request.json()

    const {
      type,
      title,
      url,
      uploadDate,
      dueDate,
      callAmount,
      paymentStatus,
      parsedData,
      investmentValue,
    } = body || {}

    if (!type || !title || !url) {
      return NextResponse.json({ error: 'type, title and url are required' }, { status: 400 })
    }

    // Validate/normalize enum
    const normalizedType = String(type).toUpperCase().replace(/\s+/g, '_')
    const validTypes = new Set(Object.keys(DocumentType))
    const finalType = (validTypes.has(normalizedType) ? normalizedType : 'OTHER') as keyof typeof DocumentType

    // Ensure fund exists and belongs to any client (optional check)
    const fund = await prisma.fund.findUnique({ where: { id: fundId }, select: { id: true } })
    if (!fund) {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
    }

    const document = await prisma.document.create({
      data: {
        fundId,
        type: DocumentType[finalType],
        title,
        url,
        uploadDate: uploadDate ? new Date(uploadDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        callAmount: callAmount !== undefined && callAmount !== null ? Number(callAmount) : null,
        paymentStatus: paymentStatus ?? null,
        parsedData: parsedData ?? null,
        investmentValue: investmentValue !== undefined && investmentValue !== null ? Number(investmentValue) : null,
      },
    })

    if (parsedData) {
      await ingestCashFlowDataFromParsedData(fundId, parsedData)
    }

    return NextResponse.json({ data: document }, { status: 201 })
  } catch (error) {
    console.error('[error] POST /api/admin/clients/[clientId]/funds/[fundId]/documents error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

