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

    // Only allow updating basic investment info
    // Metrics and executive summary fields should only be updated via documents
    if (body.name !== undefined) updateData.name = body.name
    if (body.industry !== undefined) updateData.industry = body.industry
    if (body.stage !== undefined) updateData.stage = body.stage
    if (body.investmentDate !== undefined) updateData.investmentDate = body.investmentDate ? new Date(body.investmentDate) : null
    if (body.investmentAmount !== undefined) updateData.investmentAmount = body.investmentAmount !== null ? parseFloat(String(body.investmentAmount)) : null
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail || null
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone || null
    if (body.contactWebsite !== undefined) updateData.contactWebsite = body.contactWebsite || null
    
    // Metrics and executive summary are now aggregated from documents
    // These fields should not be directly updated here

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

