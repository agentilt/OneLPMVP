import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, config } = await request.json()

    if (!name || !config) {
      return NextResponse.json({ error: 'Name and config are required' }, { status: 400 })
    }

    const savedReport = await prisma.savedReport.create({
      data: {
        userId: session.user.id,
        name,
        description,
        config,
      },
    })

    return NextResponse.json({ success: true, report: savedReport })
  } catch (error) {
    console.error('Save report error:', error)
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
  }
}

