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

    const fund = await prisma.fund.findFirst({
      where: {
        id: id,
        userId: user.id
      },
      include: {
        navHistory: {
          orderBy: { date: 'desc' },
          take: 12 // Last 12 NAV entries
        }
      }
    })

    if (!fund) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Fund not found', 'Fund not found or access denied'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createMobileResponse(true, { fund }, null, 'Fund details retrieved successfully')
    )
  } catch (error) {
    console.error('Mobile get fund details error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred while retrieving fund details'),
      { status: 500 }
    )
  }
}
