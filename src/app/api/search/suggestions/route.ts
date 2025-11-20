import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function buildFundAccessWhere(user: { id: string; role: string; clientId: string | null }) {
  if (user.role === 'ADMIN') {
    return {}
  }
  if (user.clientId) {
    return { clientId: user.clientId }
  }
  const fundAccess = await prisma.fundAccess.findMany({
    where: { userId: user.id },
    select: { fundId: true },
  })
  const accessibleIds = fundAccess.map((fa) => fa.fundId)
  if (!accessibleIds.length) {
    return { userId: user.id }
  }
  return {
    OR: [{ id: { in: accessibleIds } }, { userId: user.id }],
  }
}

async function buildDirectInvestmentWhere(user: { id: string; role: string; clientId: string | null }) {
  if (user.role === 'ADMIN') {
    return {}
  }
  if (user.clientId) {
    return { clientId: user.clientId }
  }
  return { userId: user.id }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const query = (request.nextUrl.searchParams.get('q') || '').trim()
    if (!query) {
      return NextResponse.json({ suggestions: [] })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, clientId: true },
    })

    if (!user) {
      return NextResponse.json({ suggestions: [] })
    }

    const [fundAccessWhere, directWhere] = await Promise.all([
      buildFundAccessWhere(user),
      buildDirectInvestmentWhere(user),
    ])

    const [funds, managers, investments, industries] = await Promise.all([
      prisma.fund.findMany({
        where: {
          AND: [fundAccessWhere, { name: { startsWith: query, mode: 'insensitive' } }],
        },
        select: { name: true },
        take: 5,
      }),
      prisma.fund.findMany({
        where: {
          AND: [fundAccessWhere, { manager: { startsWith: query, mode: 'insensitive' } }],
        },
        select: { manager: true },
        distinct: ['manager'],
        take: 5,
      }),
      prisma.directInvestment.findMany({
        where: {
          AND: [directWhere, { name: { startsWith: query, mode: 'insensitive' } }],
        },
        select: { name: true },
        take: 5,
      }),
      prisma.directInvestment.findMany({
        where: {
          AND: [directWhere, { industry: { startsWith: query, mode: 'insensitive' } }],
        },
        select: { industry: true },
        distinct: ['industry'],
        take: 5,
      }),
    ])

    const suggestions = Array.from(
      new Set(
        [
          ...funds.map((f) => f.name),
          ...managers.map((m) => m.manager).filter(Boolean) as string[],
          ...investments.map((i) => i.name),
          ...industries.map((i) => i.industry).filter(Boolean) as string[],
        ]
      )
    ).slice(0, 10)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Suggestion error:', error)
    return NextResponse.json({ suggestions: [] }, { status: 500 })
  }
}
