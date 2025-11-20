import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DirectInvestmentType, DocumentType } from '@prisma/client'

type SearchFilters = {
  entityTypes?: string[]
  minAmount?: number
  maxAmount?: number
  geographies?: string[]
  startDate?: string
  endDate?: string
}

const DEFAULT_ENTITY_TYPES = ['fund', 'direct-investment', 'report', 'document']

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
  if (accessibleIds.length === 0) {
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

async function executeSearch(sessionUserId: string, payload: { query?: string; filters?: SearchFilters; limit?: number }) {
  const query = payload.query?.trim() || ''
  if (query.length < 2) {
    return { results: [] }
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true, role: true, clientId: true },
  })

  if (!user) {
    return { results: [] }
  }

  const filters = payload.filters || {}
  const entityTypes = filters.entityTypes?.length ? filters.entityTypes : DEFAULT_ENTITY_TYPES
  const searchTerm = query.toLowerCase()
  const minAmount = typeof filters.minAmount === 'number' ? filters.minAmount : undefined
  const maxAmount = typeof filters.maxAmount === 'number' ? filters.maxAmount : undefined
  const geographyFilter = filters.geographies?.filter(Boolean)
  const startDate = filters.startDate ? new Date(filters.startDate) : null
  const endDate = filters.endDate ? new Date(filters.endDate) : null

  const fundAccessWhere = await buildFundAccessWhere(user)
  const directInvestmentWhere = await buildDirectInvestmentWhere(user)

  const results: Array<{
    id: string
    type: string
    title: string
    subtitle?: string
    url: string
    metadata?: Record<string, any>
  }> = []

  const amountWhere = (field: string) => {
    if (minAmount == null && maxAmount == null) return undefined
    if (minAmount != null && maxAmount != null) {
      return { [field]: { gte: minAmount, lte: maxAmount } }
    }
    if (minAmount != null) {
      return { [field]: { gte: minAmount } }
    }
    return { [field]: { lte: maxAmount! } }
  }

  if (entityTypes.includes('fund')) {
    const fundWhere: any = {
      AND: [fundAccessWhere, amountWhere('nav')].filter(Boolean),
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { manager: { contains: query, mode: 'insensitive' } },
        { domicile: { contains: query, mode: 'insensitive' } },
      ],
    }

    if (geographyFilter?.length) {
      fundWhere.AND.push({ domicile: { in: geographyFilter } })
    }

    const funds = await prisma.fund.findMany({
      where: fundWhere,
      select: {
        id: true,
        name: true,
        manager: true,
        domicile: true,
        nav: true,
        commitment: true,
      },
      take: 8,
    })

    results.push(
      ...funds.map((fund) => ({
        id: fund.id,
        type: 'fund',
        title: fund.name,
        subtitle: `${fund.manager} • ${fund.domicile}`,
        url: `/funds/${fund.id}`,
        metadata: {
          amount: fund.nav,
          commitment: fund.commitment,
        },
      }))
    )
  }

  if (entityTypes.includes('direct-investment')) {
    const investmentTypeMatches = Object.values(DirectInvestmentType).filter((type) =>
      type.toLowerCase().includes(query.toLowerCase())
    )

    const directInvestmentOR: any[] = [
      { name: { contains: query, mode: 'insensitive' } },
      { industry: { contains: query, mode: 'insensitive' } },
    ]

    if (investmentTypeMatches.length) {
      directInvestmentOR.push({ investmentType: { in: investmentTypeMatches } })
    }

    const diWhere: any = {
      AND: [directInvestmentWhere, amountWhere('currentValue')].filter(Boolean),
      OR: directInvestmentOR,
    }

    if (geographyFilter?.length) {
      diWhere.AND.push({
        OR: [
          { industry: { in: geographyFilter } },
          { investmentType: { in: geographyFilter } },
        ],
      })
    }

    const directInvestments = await prisma.directInvestment.findMany({
      where: diWhere,
      select: {
        id: true,
        name: true,
        industry: true,
        investmentType: true,
        currentValue: true,
        investmentAmount: true,
      },
      take: 8,
    })

    results.push(
      ...directInvestments.map((di) => ({
        id: di.id,
        type: 'direct-investment',
        title: di.name,
        subtitle: di.industry || di.investmentType || 'Direct Investment',
        url: `/direct-investments/${di.id}`,
        metadata: {
          amount: di.currentValue || di.investmentAmount || 0,
        },
      }))
    )
  }

  if (entityTypes.includes('report')) {
    const reports = await prisma.savedReport.findMany({
      where: {
        userId: user.id,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    })

    results.push(
      ...reports.map((report) => ({
        id: report.id,
        type: 'report',
        title: report.name,
        subtitle: report.description || 'Saved Report',
        url: `/reports/${report.id}`,
        metadata: {
          date: report.createdAt.toISOString(),
        },
      }))
    )
  }

  if (entityTypes.includes('document')) {
    const docTypeMatches = Object.values(DocumentType).filter((type) =>
      type.toLowerCase().includes(query.toLowerCase())
    )

    const documentOrFilters: any[] = [
      { title: { contains: query, mode: 'insensitive' } },
    ]

    if (docTypeMatches.length) {
      documentOrFilters.push({ type: { in: docTypeMatches } })
    }

    const documentAndFilters: any[] = [{ fund: fundAccessWhere }]
    if (geographyFilter?.length) {
      documentAndFilters.push({ fund: { domicile: { in: geographyFilter } } })
    }

    const documents = await prisma.document.findMany({
      where: {
        AND: documentAndFilters,
        OR: documentOrFilters,
      },
      select: {
        id: true,
        title: true,
        type: true,
        fundId: true,
        fund: { select: { name: true } },
      },
      take: 5,
    })

    results.push(
      ...documents.map((doc) => ({
        id: doc.id,
        type: 'document',
        title: doc.title,
        subtitle: `${doc.type} • ${doc.fund?.name ?? 'Fund Document'}`,
        url: `/funds/${doc.fundId}?document=${doc.id}`,
      }))
    )
  }

  if (entityTypes.includes('distribution')) {
    const distributionWhere: any = {
      fund: fundAccessWhere,
      OR: [
        { description: { contains: query, mode: 'insensitive' } },
        { distributionType: { contains: query, mode: 'insensitive' } },
      ],
    }

    if (minAmount != null || maxAmount != null) {
      distributionWhere.amount = amountWhere('amount')?.amount
    }

    if (startDate || endDate) {
      distributionWhere.distributionDate = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      }
    }

    const distributions = await prisma.distribution.findMany({
      where: distributionWhere,
      select: {
        id: true,
        description: true,
        distributionDate: true,
        amount: true,
        fundId: true,
        fund: { select: { name: true } },
      },
      take: 5,
    })

    results.push(
      ...distributions.map((dist) => ({
        id: dist.id,
        type: 'distribution',
        title: dist.description || `Distribution - ${dist.fund?.name ?? ''}`,
        subtitle: dist.fund?.name || 'Distribution',
        url: `/cash-flow?highlight=${dist.id}`,
        metadata: {
          amount: dist.amount,
          date: dist.distributionDate?.toISOString(),
        },
      }))
    )
  }

  if (entityTypes.includes('user') && user.role === 'ADMIN') {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      take: 5,
    })

    results.push(
      ...users.map((u) => ({
        id: u.id,
        type: 'user',
        title: u.name || u.email,
        subtitle: u.email,
        url: `/admin/users?highlight=${u.id}`,
        metadata: {
          status: u.role,
        },
      }))
    )
  }

  if (entityTypes.includes('invitation') && user.role === 'ADMIN') {
    const invitations = await prisma.invitation.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { role: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        usedAt: true,
      },
      take: 5,
    })

    results.push(
      ...invitations.map((inv) => ({
        id: inv.id,
        type: 'invitation',
        title: inv.email,
        subtitle: `Invite • ${inv.role}`,
        url: `/admin/invitations?highlight=${inv.id}`,
        metadata: {
          status: inv.usedAt ? 'Used' : 'Pending',
          date: inv.expiresAt?.toISOString(),
        },
      }))
    )
  }

  results.sort((a, b) => {
    const aExact = a.title.toLowerCase().includes(searchTerm) ? 1 : 0
    const bExact = b.title.toLowerCase().includes(searchTerm) ? 1 : 0
    if (aExact !== bExact) return bExact - aExact
    return a.type.localeCompare(b.type)
  })

  const limit = payload.limit ?? 40
  return { results: results.slice(0, limit) }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const query = request.nextUrl.searchParams.get('q') || ''
    const response = await executeSearch(session.user.id, { query })
    return NextResponse.json(response)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const response = await executeSearch(session.user.id, body)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
