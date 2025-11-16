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

// GET /api/admin/clients/[clientId]/direct-investments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const directInvestments = await prisma.directInvestment.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        documents: {
          orderBy: { uploadDate: 'desc' },
          take: 1,
        },
      },
    })

    return NextResponse.json({ data: directInvestments })
  } catch (error) {
    console.error('[error] GET /api/admin/clients/[clientId]/direct-investments error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST /api/admin/clients/[clientId]/direct-investments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params
    const body = await request.json()
    
    const {
      name,
      investmentType,
      industry,
      stage,
      investmentDate,
      investmentAmount,
      // Private Debt/Credit fields
      principalAmount,
      interestRate,
      couponRate,
      maturityDate,
      creditRating,
      defaultStatus,
      currentValue,
      yield: yieldValue,
      // Public Equity fields
      tickerSymbol,
      shares,
      purchasePrice,
      currentPrice,
      dividends,
      marketValue,
      // Real Estate fields
      propertyType,
      propertyAddress,
      squareFootage,
      purchaseDate,
      purchaseValue,
      currentAppraisal,
      rentalIncome,
      occupancyRate,
      propertyTax,
      maintenanceCost,
      netOperatingIncome,
      // Real Assets fields
      assetType,
      assetDescription,
      assetLocation,
      acquisitionDate,
      acquisitionValue,
      assetCurrentValue,
      assetIncome,
      holdingCost,
      // Cash fields
      accountType,
      accountName,
      cashInterestRate,
      balance,
      currency,
      cashMaturityDate,
      // Metrics and executive summary should only be set via documents
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Create direct investment with basic info and type-specific fields
    // Metrics and executive summary will be aggregated from documents
    const directInvestment = await prisma.directInvestment.create({
      data: {
        clientId,
        name,
        investmentType: investmentType || 'PRIVATE_EQUITY',
        industry: industry || null,
        stage: stage || null,
        investmentDate: investmentDate ? new Date(investmentDate) : null,
        investmentAmount: investmentAmount !== undefined ? parseFloat(String(investmentAmount)) : null,
        // Private Debt/Credit fields
        principalAmount: principalAmount !== undefined ? parseFloat(String(principalAmount)) : null,
        interestRate: interestRate !== undefined ? parseFloat(String(interestRate)) : null,
        couponRate: couponRate !== undefined ? parseFloat(String(couponRate)) : null,
        maturityDate: maturityDate ? new Date(maturityDate) : null,
        creditRating: creditRating || null,
        defaultStatus: defaultStatus || null,
        currentValue: currentValue !== undefined ? parseFloat(String(currentValue)) : null,
        yield: yieldValue !== undefined ? parseFloat(String(yieldValue)) : null,
        // Public Equity fields
        tickerSymbol: tickerSymbol || null,
        shares: shares !== undefined ? parseFloat(String(shares)) : null,
        purchasePrice: purchasePrice !== undefined ? parseFloat(String(purchasePrice)) : null,
        currentPrice: currentPrice !== undefined ? parseFloat(String(currentPrice)) : null,
        dividends: dividends !== undefined ? parseFloat(String(dividends)) : null,
        marketValue: marketValue !== undefined ? parseFloat(String(marketValue)) : null,
        // Real Estate fields
        propertyType: propertyType || null,
        propertyAddress: propertyAddress || null,
        squareFootage: squareFootage !== undefined ? parseFloat(String(squareFootage)) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseValue: purchaseValue !== undefined ? parseFloat(String(purchaseValue)) : null,
        currentAppraisal: currentAppraisal !== undefined ? parseFloat(String(currentAppraisal)) : null,
        rentalIncome: rentalIncome !== undefined ? parseFloat(String(rentalIncome)) : null,
        occupancyRate: occupancyRate !== undefined ? parseFloat(String(occupancyRate)) : null,
        propertyTax: propertyTax !== undefined ? parseFloat(String(propertyTax)) : null,
        maintenanceCost: maintenanceCost !== undefined ? parseFloat(String(maintenanceCost)) : null,
        netOperatingIncome: netOperatingIncome !== undefined ? parseFloat(String(netOperatingIncome)) : null,
        // Real Assets fields
        assetType: assetType || null,
        assetDescription: assetDescription || null,
        assetLocation: assetLocation || null,
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
        acquisitionValue: acquisitionValue !== undefined ? parseFloat(String(acquisitionValue)) : null,
        assetCurrentValue: assetCurrentValue !== undefined ? parseFloat(String(assetCurrentValue)) : null,
        assetIncome: assetIncome !== undefined ? parseFloat(String(assetIncome)) : null,
        holdingCost: holdingCost !== undefined ? parseFloat(String(holdingCost)) : null,
        // Cash fields
        accountType: accountType || null,
        accountName: accountName || null,
        cashInterestRate: cashInterestRate !== undefined ? parseFloat(String(cashInterestRate)) : null,
        balance: balance !== undefined ? parseFloat(String(balance)) : null,
        currency: currency || null,
        cashMaturityDate: cashMaturityDate ? new Date(cashMaturityDate) : null,
      },
    })

    return NextResponse.json({ data: directInvestment }, { status: 201 })
  } catch (error: any) {
    console.error('[error] POST /api/admin/clients/[clientId]/direct-investments error:', error)
    return NextResponse.json({ 
      error: process.env.NODE_ENV === 'development' ? error?.message || 'An error occurred' : 'An error occurred',
      details: process.env.NODE_ENV === 'development' ? {
        name: error?.name,
        code: error?.code,
      } : undefined
    }, { status: 500 })
  }
}

