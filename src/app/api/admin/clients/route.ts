import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Helper function to require admin auth
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }
  
  return session
}

// GET /api/admin/clients - List all clients
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100)

    const skip = (page - 1) * pageSize

    // Build search conditions
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ])

    return NextResponse.json({
      data,
      page,
      pageSize,
      total,
    })
  } catch (error) {
    console.error('[error] GET /api/admin/clients error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST /api/admin/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, phone, address, notes } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(
      { data: client },
      { status: 201 }
    )
  } catch (error) {
    console.error('[error] POST /api/admin/clients error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
