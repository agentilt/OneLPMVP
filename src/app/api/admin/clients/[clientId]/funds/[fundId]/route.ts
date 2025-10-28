import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

// GET /api/admin/clients/[clientId]/funds/[fundId]
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string; fundId: string } }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fund = await prisma.fund.findFirst({
      where: {
        id: params.fundId,
        clientId: params.clientId,
      },
    })

    if (!fund) {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
    }

    return NextResponse.json({ data: fund })
  } catch (error) {
    console.error('[error] GET /api/admin/clients/[clientId]/funds/[fundId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// PUT /api/admin/clients/[clientId]/funds/[fundId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string; fundId: string } }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updateData: any = {}

    if (body.name) updateData.name = body.name
    if (body.domicile) updateData.domicile = body.domicile
    if (body.vintage) updateData.vintage = parseInt(body.vintage)
    if (body.manager) updateData.manager = body.manager
    if (body.managerEmail !== undefined) updateData.managerEmail = body.managerEmail
    if (body.managerPhone !== undefined) updateData.managerPhone = body.managerPhone
    if (body.managerWebsite !== undefined) updateData.managerWebsite = body.managerWebsite
    if (body.commitment !== undefined) updateData.commitment = parseFloat(body.commitment)
    if (body.paidIn !== undefined) updateData.paidIn = parseFloat(body.paidIn)
    if (body.nav !== undefined) updateData.nav = parseFloat(body.nav)
    if (body.irr !== undefined) updateData.irr = parseFloat(body.irr)
    if (body.tvpi !== undefined) updateData.tvpi = parseFloat(body.tvpi)
    if (body.dpi !== undefined) updateData.dpi = parseFloat(body.dpi)
    if (body.lastReportDate) updateData.lastReportDate = new Date(body.lastReportDate)

    const fund = await prisma.fund.update({
      where: { id: params.fundId },
      data: updateData,
    })

    return NextResponse.json({ data: fund })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
    }
    console.error('[error] PUT /api/admin/clients/[clientId]/funds/[fundId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE /api/admin/clients/[clientId]/funds/[fundId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { clientId: string; fundId: string } }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.fund.delete({
      where: { id: params.fundId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
    }
    console.error('[error] DELETE /api/admin/clients/[clientId]/funds/[fundId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
