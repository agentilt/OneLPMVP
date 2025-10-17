import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fundId: string }> }
) {
  try {
    const { id: userId, fundId } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
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

    // Verify fund belongs to this user
    const existingFund = await prisma.fund.findUnique({
      where: { id: fundId },
    })

    if (!existingFund) {
      return NextResponse.json(
        { error: 'Fund not found' },
        { status: 404 }
      )
    }

    if (existingFund.userId !== userId) {
      return NextResponse.json(
        { error: 'Fund does not belong to this user' },
        { status: 403 }
      )
    }

    // Update fund
    const fund = await prisma.fund.update({
      where: { id: fundId },
      data: {
        name,
        domicile,
        vintage: parseInt(vintage),
        manager,
        commitment: parseFloat(commitment),
        paidIn: parseFloat(paidIn),
        nav: parseFloat(nav),
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
    console.error('Fund update error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating fund' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fundId: string }> }
) {
  try {
    const { id: userId, fundId } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify fund belongs to this user
    const existingFund = await prisma.fund.findUnique({
      where: { id: fundId },
    })

    if (!existingFund) {
      return NextResponse.json(
        { error: 'Fund not found' },
        { status: 404 }
      )
    }

    if (existingFund.userId !== userId) {
      return NextResponse.json(
        { error: 'Fund does not belong to this user' },
        { status: 403 }
      )
    }

    // Delete fund (cascade will delete related records)
    await prisma.fund.delete({
      where: { id: fundId },
    })

    return NextResponse.json({
      success: true,
      message: 'Fund deleted successfully',
    })
  } catch (error) {
    console.error('Fund deletion error:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting fund' },
      { status: 500 }
    )
  }
}

