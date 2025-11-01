import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, createMobileResponse } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
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

    // Build query: if user has clientId, fetch funds by clientId; otherwise fallback to userId (legacy)
    // Admins can see all funds
    const whereClause = 
      fullUser?.role === 'ADMIN'
        ? {}
        : fullUser?.clientId
          ? { clientId: fullUser.clientId }
          : { userId: user.id }

    const funds = await prisma.fund.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        domicile: true,
        vintage: true,
        manager: true,
        commitment: true,
        paidIn: true,
        nav: true,
        irr: true,
        tvpi: true,
        dpi: true,
        lastReportDate: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(
      createMobileResponse(true, { funds }, null, 'Funds retrieved successfully')
    )
  } catch (error) {
    console.error('Mobile get user funds error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred while retrieving funds'),
      { status: 500 }
    )
  }
}
