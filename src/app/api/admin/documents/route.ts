import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      fundId,
      type,
      title,
      uploadDate,
      dueDate,
      callAmount,
      paymentStatus,
      url,
      parsedData,
    } = body

    // Validate required fields
    if (!fundId || !type || !title || !uploadDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create document
    const document = await prisma.document.create({
      data: {
        fundId,
        type,
        title,
        uploadDate: new Date(uploadDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        callAmount: callAmount ? parseFloat(callAmount) : null,
        paymentStatus: paymentStatus || null,
        url: url || `/assets/documents/${Date.now()}.pdf`,
        parsedData: parsedData || null,
      },
    })

    return NextResponse.json({
      success: true,
      document,
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'An error occurred while uploading document' },
      { status: 500 }
    )
  }
}

