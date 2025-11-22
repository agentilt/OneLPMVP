import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const targets = body.targets

    if (!targets || typeof targets !== 'object') {
      return NextResponse.json({ error: 'Targets are required' }, { status: 400 })
    }

    const existing = await prisma.portfolioModel.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    const model = await prisma.portfolioModel.update({
      where: { id },
      data: {
        name: name || undefined,
        targets,
      },
    })

    return NextResponse.json({ model })
  } catch (error) {
    console.error('Portfolio model update error', error)
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.portfolioModel.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    await prisma.portfolioModel.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Portfolio model delete error', error)
    return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 })
  }
}
