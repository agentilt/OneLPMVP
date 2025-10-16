import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Grant user access to a fund
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'DATA_MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, fundId } = body

    if (!userId || !fundId) {
      return NextResponse.json(
        { error: 'Missing userId or fundId' },
        { status: 400 }
      )
    }

    // Check if access already exists
    const existingAccess = await prisma.fundAccess.findUnique({
      where: {
        userId_fundId: { userId, fundId },
      },
    })

    if (existingAccess) {
      return NextResponse.json(
        { error: 'User already has access to this fund' },
        { status: 400 }
      )
    }

    // Create fund access
    const fundAccess = await prisma.fundAccess.create({
      data: {
        userId,
        fundId,
      },
      include: {
        fund: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      fundAccess,
    })
  } catch (error) {
    console.error('Failed to grant fund access:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// Revoke user access to a fund
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'DATA_MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const fundId = searchParams.get('fundId')

    if (!userId || !fundId) {
      return NextResponse.json(
        { error: 'Missing userId or fundId' },
        { status: 400 }
      )
    }

    // Delete fund access
    await prisma.fundAccess.delete({
      where: {
        userId_fundId: { userId, fundId },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Fund access revoked',
    })
  } catch (error) {
    console.error('Failed to revoke fund access:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

