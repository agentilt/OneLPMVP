import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DocumentType } from '@prisma/client'

async function requireAdmin(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  if (apiKey && process.env.ADMIN_API_KEY && apiKey === process.env.ADMIN_API_KEY) {
    return { apiKeyAuth: true }
  }
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

// GET /api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; fundId: string; documentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fundId, documentId } = await params

    // Ensure fund exists (scoped)
    const fund = await prisma.fund.findUnique({ where: { id: fundId }, select: { id: true } })
    if (!fund) {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        fundId,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ data: document })
  } catch (error) {
    console.error('[error] GET /api/admin/clלבדients/[clientId]/funds/[fundId]/documents/[documentId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// PUT /api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; fundId: string; documentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fundId, documentId } = await params
    const body = await request.json()
    const updateData: any = {}

    if (body.type !== undefined) {
      const normalizedType = String(body.type).toUpperCase().replace(/\s+/g, '_')
      const validTypes = new Set(Object.keys(DocumentType))
      updateData.type = validTypes.has(normalizedType) 
        ? (normalizedType as keyof typeof DocumentType)
        : DocumentType.OTHER
    }
    if (body.title !== undefined) updateData.title = body.title
    if (body.url !== undefined) updateData.url = body.url
    if (body.uploadDate !== undefined) updateData.uploadDate = new Date(body.uploadDate)
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.callAmount !== undefined) updateData.callAmount = body.callAmount !== null ? Number(body.callAmount) : null
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus
    if (body.parsedData !== undefined) updateData.parsedData = body.parsedData
    if (body.investmentValue !== undefined) updateData.investmentValue = body.investmentValue !== null ? Number(body.investmentValue) : null

    const document = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
    })

    return NextResponse.json({ data: document })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    console.error('[error] PUT /api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE /api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; fundId: string; documentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await params

    await prisma.document.delete({
      where: { id: documentId },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    console.error('[error] DELETE /api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
