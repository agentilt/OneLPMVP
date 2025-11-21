import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ingestCashFlowDataFromParsedData } from '@/lib/cashFlowIngestion'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fundId: string }> }
) {
  try {
    const { fundId } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'DATA_MANAGER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const documents = await prisma.document.findMany({
      where: { fundId },
      orderBy: { uploadDate: 'desc' },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fundId: string }> }
) {
  try {
    const { id: userId, fundId } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'DATA_MANAGER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      type,
      title,
      url,
      dueDate,
      callAmount,
      paymentStatus,
      investmentValue,
    } = body

    // Verify fund belongs to this user
    const fund = await prisma.fund.findUnique({
      where: { id: fundId },
    })

    if (!fund || fund.userId !== userId) {
      return NextResponse.json(
        { error: 'Fund not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Create document
    const document = await prisma.document.create({
      data: {
        fundId,
        type,
        title,
        url,
        uploadDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        callAmount: callAmount ? parseFloat(callAmount) : null,
        paymentStatus: paymentStatus || null,
        investmentValue: investmentValue ? parseFloat(investmentValue) : null,
      },
    })

    if (body.parsedData) {
      await ingestCashFlowDataFromParsedData(fundId, body.parsedData)
    }

    return NextResponse.json({
      success: true,
      document,
    })
  } catch (error) {
    console.error('Document creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fundId: string }> }
) {
  try {
    const { fundId } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'DATA_MANAGER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      )
    }

    // Verify document belongs to this fund
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document || document.fundId !== fundId) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete document
    await prisma.document.delete({
      where: { id: documentId },
    })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    console.error('Document deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
