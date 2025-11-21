import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, description, config } = body

    if (!name || typeof name !== 'string' || !config) {
      return NextResponse.json({ error: 'Name and config are required' }, { status: 400 })
    }

    try {
      const savedForecast = await prisma.savedForecast.create({
        data: {
          userId: session.user.id,
          name: name.trim(),
          description: description?.toString() || null,
          config,
        },
      })

      return NextResponse.json({ savedForecast })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
        return NextResponse.json(
          { error: 'Saved forecasts table not found. Please run the latest migrations.' },
          { status: 503 }
        )
      }
      console.error('Failed to save forecast:', error)
      return NextResponse.json({ error: 'Failed to save forecast scenario' }, { status: 500 })
    }
  } catch (err) {
    console.error('Forecast save error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
