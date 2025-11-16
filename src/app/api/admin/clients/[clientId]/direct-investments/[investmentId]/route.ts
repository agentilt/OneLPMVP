import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireAdmin(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  if (apiKey && process.env.ADMIN_API_KEY && apiKey === process.env.ADMIN_API_KEY) {
    return { apiKeyAuth: true }
  }
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

// GET /api/admin/clients/[clientId]/direct-investments/[investmentId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; investmentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId, investmentId } = await params

    const directInvestment = await prisma.directInvestment.findFirst({
      where: {
        id: investmentId,
        clientId: clientId,
      },
      include: {
        documents: {
          orderBy: { uploadDate: 'desc' },
        },
      },
    })

    if (!directInvestment) {
      return NextResponse.json({ error: 'Direct investment not found' }, { status: 404 })
    }

    return NextResponse.json({ data: directInvestment })
  } catch (error) {
    console.error('[error] GET /api/admin/clients/[clientId]/direct-investments/[investmentId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// PUT /api/admin/clients/[clientId]/direct-investments/[investmentId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; investmentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { investmentId } = await params
    const body = await request.json()
    const updateData: any = {}

    // Only allow updating basic investment info and type-specific fields
    // Metrics and executive summary fields should only be updated via documents
    if (body.name !== undefined) updateData.name = body.name
    if (body.investmentType !== undefined) updateData.investmentType = body.investmentType
    if (body.industry !== undefined) updateData.industry = body.industry
    if (body.stage !== undefined) updateData.stage = body.stage
    if (body.investmentDate !== undefined) updateData.investmentDate = body.investmentDate ? new Date(body.investmentDate) : null
    if (body.investmentAmount !== undefined) updateData.investmentAmount = body.investmentAmount !== null ? parseFloat(String(body.investmentAmount)) : null
    
    // Private Debt/Credit fields
    if (body.principalAmount !== undefined) updateData.principalAmount = body.principalAmount !== null ? parseFloat(String(body.principalAmount)) : null
    if (body.interestRate !== undefined) updateData.interestRate = body.interestRate !== null ? parseFloat(String(body.interestRate)) : null
    if (body.couponRate !== undefined) updateData.couponRate = body.couponRate !== null ? parseFloat(String(body.couponRate)) : null
    if (body.maturityDate !== undefined) updateData.maturityDate = body.maturityDate ? new Date(body.maturityDate) : null
    if (body.creditRating !== undefined) updateData.creditRating = body.creditRating
    if (body.defaultStatus !== undefined) updateData.defaultStatus = body.defaultStatus
    if (body.currentValue !== undefined) updateData.currentValue = body.currentValue !== null ? parseFloat(String(body.currentValue)) : null
    if (body.yield !== undefined) updateData.yield = body.yield !== null ? parseFloat(String(body.yield)) : null
    
    // Public Equity fields
    if (body.tickerSymbol !== undefined) updateData.tickerSymbol = body.tickerSymbol
    if (body.shares !== undefined) updateData.shares = body.shares !== null ? parseFloat(String(body.shares)) : null
    if (body.purchasePrice !== undefined) updateData.purchasePrice = body.purchasePrice !== null ? parseFloat(String(body.purchasePrice)) : null
    if (body.currentPrice !== undefined) updateData.currentPrice = body.currentPrice !== null ? parseFloat(String(body.currentPrice)) : null
    if (body.dividends !== undefined) updateData.dividends = body.dividends !== null ? parseFloat(String(body.dividends)) : null
    if (body.marketValue !== undefined) updateData.marketValue = body.marketValue !== null ? parseFloat(String(body.marketValue)) : null
    
    // Real Estate fields
    if (body.propertyType !== undefined) updateData.propertyType = body.propertyType
    if (body.propertyAddress !== undefined) updateData.propertyAddress = body.propertyAddress
    if (body.squareFootage !== undefined) updateData.squareFootage = body.squareFootage !== null ? parseFloat(String(body.squareFootage)) : null
    if (body.purchaseDate !== undefined) updateData.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null
    if (body.purchaseValue !== undefined) updateData.purchaseValue = body.purchaseValue !== null ? parseFloat(String(body.purchaseValue)) : null
    if (body.currentAppraisal !== undefined) updateData.currentAppraisal = body.currentAppraisal !== null ? parseFloat(String(body.currentAppraisal)) : null
    if (body.rentalIncome !== undefined) updateData.rentalIncome = body.rentalIncome !== null ? parseFloat(String(body.rentalIncome)) : null
    if (body.occupancyRate !== undefined) updateData.occupancyRate = body.occupancyRate !== null ? parseFloat(String(body.occupancyRate)) : null
    if (body.propertyTax !== undefined) updateData.propertyTax = body.propertyTax !== null ? parseFloat(String(body.propertyTax)) : null
    if (body.maintenanceCost !== undefined) updateData.maintenanceCost = body.maintenanceCost !== null ? parseFloat(String(body.maintenanceCost)) : null
    if (body.netOperatingIncome !== undefined) updateData.netOperatingIncome = body.netOperatingIncome !== null ? parseFloat(String(body.netOperatingIncome)) : null
    
    // Real Assets fields
    if (body.assetType !== undefined) updateData.assetType = body.assetType
    if (body.assetDescription !== undefined) updateData.assetDescription = body.assetDescription
    if (body.assetLocation !== undefined) updateData.assetLocation = body.assetLocation
    if (body.acquisitionDate !== undefined) updateData.acquisitionDate = body.acquisitionDate ? new Date(body.acquisitionDate) : null
    if (body.acquisitionValue !== undefined) updateData.acquisitionValue = body.acquisitionValue !== null ? parseFloat(String(body.acquisitionValue)) : null
    if (body.assetCurrentValue !== undefined) updateData.assetCurrentValue = body.assetCurrentValue !== null ? parseFloat(String(body.assetCurrentValue)) : null
    if (body.assetIncome !== undefined) updateData.assetIncome = body.assetIncome !== null ? parseFloat(String(body.assetIncome)) : null
    if (body.holdingCost !== undefined) updateData.holdingCost = body.holdingCost !== null ? parseFloat(String(body.holdingCost)) : null
    
    // Cash fields
    if (body.accountType !== undefined) updateData.accountType = body.accountType
    if (body.accountName !== undefined) updateData.accountName = body.accountName
    if (body.cashInterestRate !== undefined) updateData.cashInterestRate = body.cashInterestRate !== null ? parseFloat(String(body.cashInterestRate)) : null
    if (body.balance !== undefined) updateData.balance = body.balance !== null ? parseFloat(String(body.balance)) : null
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.cashMaturityDate !== undefined) updateData.cashMaturityDate = body.cashMaturityDate ? new Date(body.cashMaturityDate) : null
    
    // Metrics and executive summary are now aggregated from documents
    // These fields should not be directly updated here

    const directInvestment = await prisma.directInvestment.update({
      where: { id: investmentId },
      data: updateData,
    })

    return NextResponse.json({ data: directInvestment })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Direct investment not found' }, { status: 404 })
    }
    console.error('[error] PUT /api/admin/clients/[clientId]/direct-investments/[investmentId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE /api/admin/clients/[clientId]/direct-investments/[investmentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; investmentId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { investmentId } = await params

    await prisma.directInvestment.delete({
      where: { id: investmentId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Direct investment not found' }, { status: 404 })
    }
    console.error('[error] DELETE /api/admin/clients/[clientId]/direct-investments/[investmentId] error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

