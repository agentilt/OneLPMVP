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

// GET /api/admin/clients/[clientId]/funds
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const funds = await prisma.fund.findMany({
      where: { clientId: params.clientId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: funds })
  } catch (error) {
    console.error('[error] GET /api/admin/clients/[clientId]/funds error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST /api/admin/clients/[clientId]/funds
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      domicile,
      vintage,
      manager,
      managerEmail,
      managerPhone,
      managerWebsite,
      commitment = 0,
      paidIn = 0,
      nav = 0,
      irr = 0,
      tvpi = 0,
      dpi = 0,
      lastReportDate,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const fund = await prisma.fund.create({
      data: {
        clientId: params.clientId,
        name,
        domicile: domicile || '',
        vintage: vintage ? parseInt(vintage) : new Date().getFullYear(),
        manager: manager || '',
        managerEmail: managerEmail || null,
        managerPhone: managerPhone || null,
        managerWebsite: managerWebsite || null,
        commitment: parseFloat(commitment),
        paidIn: parseFloat(paidIn),
        nav: parseFloat(nav),
        irr: parseFloat(irr),
        tvpi: parseFloat(tvpi),
        dpi: parseFloat(dpi),
        lastReportDate: lastReportDate ? new Date(lastReportDate) : new Date(),
      },
    })

    return NextResponse.json({ data: fund }, { status: 201 })
  } catch (error) {
    console.error('[error] POST /api/admin/clients/[clientId]/funds error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
