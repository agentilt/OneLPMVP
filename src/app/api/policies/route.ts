import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/policies - Get user's risk policy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch or create default policy for user
    let policy = await prisma.riskPolicy.findUnique({
      where: { userId: session.user.id },
    })

    // If no policy exists, create one with defaults
    if (!policy) {
      policy = await prisma.riskPolicy.create({
        data: {
          userId: session.user.id,
        },
      })
    }

    return NextResponse.json({ policy })
  } catch (error) {
    console.error('Error fetching policy:', error)
    return NextResponse.json({ error: 'Failed to fetch policy' }, { status: 500 })
  }
}

// PUT /api/policies - Update user's risk policy
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input ranges
    const validatePercentage = (value: number, name: string) => {
      if (value < 0 || value > 100) {
        throw new Error(`${name} must be between 0 and 100`)
      }
    }

    // Validate concentration limits
    if (body.maxSingleFundExposure !== undefined) {
      validatePercentage(body.maxSingleFundExposure, 'Max Single Fund Exposure')
    }
    if (body.maxGeographyExposure !== undefined) {
      validatePercentage(body.maxGeographyExposure, 'Max Geography Exposure')
    }
    if (body.maxSectorExposure !== undefined) {
      validatePercentage(body.maxSectorExposure, 'Max Sector Exposure')
    }
    if (body.maxVintageExposure !== undefined) {
      validatePercentage(body.maxVintageExposure, 'Max Vintage Exposure')
    }
    if (body.maxManagerExposure !== undefined) {
      validatePercentage(body.maxManagerExposure, 'Max Manager Exposure')
    }
    if (body.maxUnfundedCommitments !== undefined) {
      validatePercentage(body.maxUnfundedCommitments, 'Max Unfunded Commitments')
    }
    if (body.minLiquidityReserve !== undefined) {
      validatePercentage(body.minLiquidityReserve, 'Min Liquidity Reserve')
    }
    if (body.maxCurrencyExposure !== undefined) {
      validatePercentage(body.maxCurrencyExposure, 'Max Currency Exposure')
    }

    // Validate other limits
    if (body.minNumberOfFunds !== undefined && body.minNumberOfFunds < 1) {
      throw new Error('Minimum number of funds must be at least 1')
    }
    if (body.targetDiversificationScore !== undefined) {
      if (body.targetDiversificationScore < 0 || body.targetDiversificationScore > 1) {
        throw new Error('Target Diversification Score must be between 0 and 1')
      }
    }
    if (body.maxLeverageRatio !== undefined && body.maxLeverageRatio < 0) {
      throw new Error('Max Leverage Ratio must be positive')
    }

    // Update or create policy
    const policy = await prisma.riskPolicy.upsert({
      where: { userId: session.user.id },
      update: {
        ...body,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        ...body,
      },
    })

    return NextResponse.json({ policy, message: 'Policy updated successfully' })
  } catch (error: any) {
    console.error('Error updating policy:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update policy' },
      { status: 400 }
    )
  }
}

// DELETE /api/policies - Reset policy to defaults
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete existing policy (will revert to defaults on next GET)
    await prisma.riskPolicy.delete({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ message: 'Policy reset to defaults' })
  } catch (error) {
    console.error('Error resetting policy:', error)
    return NextResponse.json({ error: 'Failed to reset policy' }, { status: 500 })
  }
}

