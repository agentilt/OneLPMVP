import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'DATA_MANAGER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      domicile,
      vintage,
      manager,
      commitment,
      paidIn,
      nav,
      tvpi,
      dpi,
    } = body

    // Validate required fields
    if (!name || !domicile || !vintage || !manager) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create fund for this user
    const fund = await prisma.fund.create({
      data: {
        userId,
        name,
        domicile,
        vintage: parseInt(vintage),
        manager,
        commitment: parseFloat(commitment),
        paidIn: parseFloat(paidIn),
        nav: parseFloat(nav),
        irr: 0, // IRR not reported
        tvpi: parseFloat(tvpi),
        dpi: parseFloat(dpi),
        lastReportDate: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      fund,
    })
  } catch (error) {
    console.error('Fund creation error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating fund' },
      { status: 500 }
    )
  }
}

