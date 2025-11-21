import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getUserFromToken, createMobileResponse } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { ingestCashFlowDataFromParsedData } from '@/lib/cashFlowIngestion'

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const fundId = formData.get('fundId') as string
    const type = formData.get('type') as string
    const title = formData.get('title') as string
    const dueDate = formData.get('dueDate') as string
    const callAmount = formData.get('callAmount') as string
    const investmentValue = formData.get('investmentValue') as string
    const parsedDataRaw = formData.get('parsedData') as string | null

    let parsedData: any = null
    if (parsedDataRaw) {
      try {
        parsedData = JSON.parse(parsedDataRaw)
      } catch {
        return NextResponse.json(
          createMobileResponse(false, null, 'Invalid parsedData', 'parsedData must be valid JSON'),
          { status: 400 }
        )
      }
    }

    if (!file || !fundId || !type || !title) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Missing required fields', 'File, fundId, type, and title are required'),
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invalid file type', 'Only PDF, Excel (.xlsx, .xls), and CSV files are allowed'),
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        createMobileResponse(false, null, 'File too large', 'File size too large. Maximum size is 10MB'),
        { status: 400 }
      )
    }

    // Fetch full user record to get clientId
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { clientId: true, role: true },
    })

    // First find the fund
    const fund = await prisma.fund.findUnique({
      where: { id: fundId }
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

    // Validate document type
    const validTypes = ['CAPITAL_CALL', 'QUARTERLY_REPORT', 'ANNUAL_REPORT', 'KYC', 'COMPLIANCE', 'OTHER']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invalid document type', 'Invalid document type'),
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${originalName}`
    
    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Write file
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Create document record
    const document = await prisma.document.create({
      data: {
        fundId,
        type: type as any,
        title,
        uploadDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        callAmount: callAmount ? parseFloat(callAmount) : null,
        paymentStatus: type === 'CAPITAL_CALL' ? 'PENDING' : null,
        url: `/uploads/documents/${filename}`,
        investmentValue: investmentValue ? parseFloat(investmentValue) : null
      },
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
    })

    if (parsedData) {
      await ingestCashFlowDataFromParsedData(fundId, parsedData)
    }

    return NextResponse.json(
      createMobileResponse(true, { document }, null, 'Document uploaded successfully')
    )
  } catch (error) {
    console.error('Mobile file upload error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'Failed to upload file'),
      { status: 500 }
    )
  }
}
