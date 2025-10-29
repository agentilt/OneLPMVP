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

// GET /api/admin/clients/[clientId]
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

    return NextResponse.json({ data: client })
  } catch (error) {
    console.error('[error] GET /api/admin/clients/[clientId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// PUT /api/admin/clients/[clientId]
export async function PUT(
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
    const { name, email, phone, address, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: { name, email, phone, address, notes },
    })

    return NextResponse.json({ data: client })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    console.error('[error] PUT /api/admin/clients/[clientId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE /api/admin/clients/[clientId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    await prisma.client.delete({
      where: { id: clientId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    console.error('[error] DELETE /api/admin/clients/[clientId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
