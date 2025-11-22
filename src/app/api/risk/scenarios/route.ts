import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if riskScenario model exists
    if (!prisma.riskScenario) {
      console.error('riskScenario model not available in Prisma client')
      return NextResponse.json({ error: 'RiskScenario model not available. Please restart the server.' }, { status: 500 })
    }

    const scenarios = await prisma.riskScenario.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ scenarios })
  } catch (error: any) {
    console.error('Error fetching risk scenarios:', error)
    const errorMessage = error?.message || 'Failed to load scenarios'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'Scenario name is required' }, { status: 400 })
    }

    const navShockPercent = Number(body.navShockPercent ?? body.navShock)
    if (Number.isNaN(navShockPercent)) {
      return NextResponse.json({ error: 'Invalid NAV shock' }, { status: 400 })
    }
    const callMultiplier = Number(body.callMultiplier ?? 1)
    const distributionMultiplier = Number(body.distributionMultiplier ?? 1)

    if (callMultiplier <= 0 || distributionMultiplier < 0) {
      return NextResponse.json({ error: 'Multiplier values must be positive' }, { status: 400 })
    }

    const scenario = await prisma.riskScenario.create({
      data: {
        userId: session.user.id,
        name,
        description: typeof body.description === 'string' ? body.description : null,
        navShock: navShockPercent / 100,
        callMultiplier,
        distributionMultiplier,
      },
    })

    return NextResponse.json({ scenario })
  } catch (error) {
    console.error('Error creating risk scenario:', error)
    return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 })
  }
}
