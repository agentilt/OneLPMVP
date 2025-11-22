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

    const models = await prisma.portfolioModel.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ models })
  } catch (error) {
    console.error('Portfolio models fetch error', error)
    return NextResponse.json({ error: 'Failed to load models' }, { status: 500 })
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
    const targets = body.targets

    if (!name) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 })
    }
    if (!targets || typeof targets !== 'object') {
      return NextResponse.json({ error: 'Targets are required' }, { status: 400 })
    }

    const model = await prisma.portfolioModel.create({
      data: {
        userId: session.user.id,
        name,
        targets,
      },
    })

    return NextResponse.json({ model })
  } catch (error) {
    console.error('Portfolio model create error', error)
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 })
  }
}
