import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, createMobileResponse } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Authorization header required', 'Authorization header with Bearer token is required'),
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invalid token', 'Invalid or expired token'),
        { status: 401 }
      )
    }

    // Fetch full user record to get clientId
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { clientId: true, role: true },
    })

    // First find the fund
    const fund = await prisma.fund.findUnique({
      where: { id: id }
    })

    if (!fund) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Fund not found', 'Fund not found or access denied'),
        { status: 404 }
      )
    }

    // Check if user has access to this fund (by client relationship or ownership)
    // Admins can see all funds
    if (fullUser?.role !== 'ADMIN') {
      const hasAccess = 
        (fullUser?.clientId && fund.clientId === fullUser.clientId) ||
        fund.userId === user.id
      
      if (!hasAccess) {
        return NextResponse.json(
          createMobileResponse(false, null, 'Fund not found', 'Fund not found or access denied'),
          { status: 404 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const whereClause: any = { fundId: id }
    if (type) {
      whereClause.type = type
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        orderBy: { uploadDate: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          uploadDate: true,
          dueDate: true,
          callAmount: true,
          paymentStatus: true,
          url: true,
          investmentValue: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.document.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json(
      createMobileResponse(true, {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }, null, 'Documents retrieved successfully')
    )
  } catch (error) {
    console.error('Mobile get fund documents error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred while retrieving documents'),
      { status: 500 }
    )
  }
}
