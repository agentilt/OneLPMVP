import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') ?? 30) || 30, 120)

    const snapshots = await prisma.riskSnapshot.findMany({
      where: { userId: session.user.id },
      orderBy: { snapshotDate: 'desc' },
      take: limit,
    })

    return NextResponse.json({ snapshots })
  } catch (error) {
    console.error('Risk history error:', error)
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
  }
}
