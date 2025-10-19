import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, createMobileResponse } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
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

    const holdings = await prisma.cryptoHolding.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        symbol: true,
        name: true,
        amount: true,
        valueUsd: true,
        updatedAt: true
      }
    })

    return NextResponse.json(
      createMobileResponse(true, { holdings }, null, 'Crypto holdings retrieved successfully')
    )
  } catch (error) {
    console.error('Mobile get crypto holdings error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred while retrieving crypto holdings'),
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const { holdings } = await request.json()

    if (!Array.isArray(holdings)) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invalid holdings data', 'Holdings must be an array'),
        { status: 400 }
      )
    }

    // Validate holdings data
    for (const holding of holdings) {
      if (!holding.symbol || !holding.name || typeof holding.amount !== 'number' || typeof holding.valueUsd !== 'number') {
        return NextResponse.json(
          createMobileResponse(false, null, 'Invalid holding data', 'Each holding must have symbol, name, amount, and valueUsd'),
          { status: 400 }
        )
      }
    }

    // Delete existing holdings for this user
    await prisma.cryptoHolding.deleteMany({
      where: { userId: user.id }
    })

    // Create new holdings
    const newHoldings = await Promise.all(
      holdings.map(holding =>
        prisma.cryptoHolding.create({
          data: {
            userId: user.id,
            symbol: holding.symbol,
            name: holding.name,
            amount: holding.amount,
            valueUsd: holding.valueUsd
          },
          select: {
            id: true,
            symbol: true,
            name: true,
            amount: true,
            valueUsd: true,
            updatedAt: true
          }
        })
      )
    )

    return NextResponse.json(
      createMobileResponse(true, { holdings: newHoldings }, null, 'Crypto holdings updated successfully')
    )
  } catch (error) {
    console.error('Mobile update crypto holdings error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred while updating crypto holdings'),
      { status: 500 }
    )
  }
}
