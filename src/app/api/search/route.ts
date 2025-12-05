import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DirectInvestmentType, DocumentType } from '@prisma/client'
import { chatCompletion } from '@/lib/llm/chat'

type SearchFilters = {
  entityTypes?: string[]
  minAmount?: number
  maxAmount?: number
  geographies?: string[]
  startDate?: string
  endDate?: string
}

const DEFAULT_ENTITY_TYPES = ['fund', 'direct-investment', 'report', 'document']

type RankingQuery =
  | { entity: 'fund'; field: 'nav' | 'irr' | 'tvpi' | 'dpi' | 'commitment' | 'paidIn'; order: 'asc' | 'desc'; label: string }
  | { entity: 'direct-investment'; field: 'currentValue' | 'investmentAmount'; order: 'asc' | 'desc'; label: string }

function detectRankingQuery(query: string): RankingQuery | null {
  const q = query.toLowerCase()
  const has = (words: string[]) => words.some((w) => q.includes(w))

  const order: 'asc' | 'desc' | null =
    has(['lowest', 'min', 'smallest', 'least']) ? 'asc' :
    has(['highest', 'max', 'largest', 'top', 'best', 'biggest']) ? 'desc' : null
  if (!order) return null

  // Fund metrics
  if (has(['nav', 'aum', 'assets', 'size', 'largest fund'])) return { entity: 'fund', field: 'nav', order, label: 'NAV' }
  if (has(['irr', 'return', 'performance'])) return { entity: 'fund', field: 'irr', order, label: 'IRR' }
  if (has(['tvpi'])) return { entity: 'fund', field: 'tvpi', order, label: 'TVPI' }
  if (has(['dpi', 'distributions'])) return { entity: 'fund', field: 'dpi', order, label: 'DPI' }
  if (has(['commitment', 'committed capital'])) return { entity: 'fund', field: 'commitment', order, label: 'Commitment' }
  if (has(['paid in', 'paid-in', 'paidin', 'called capital'])) return { entity: 'fund', field: 'paidIn', order, label: 'Paid In' }

  // Direct investments
  if (has(['current value', 'value', 'valuation', 'fair value', 'mark'])) {
    return { entity: 'direct-investment', field: 'currentValue', order, label: 'Current Value' }
  }
  if (has(['investment amount', 'check size', 'invested amount'])) {
    return { entity: 'direct-investment', field: 'investmentAmount', order, label: 'Investment Amount' }
  }

  return null
}

type NLPlan = {
  entity: 'fund' | 'direct-investment'
  orderBy?: string
  order?: 'asc' | 'desc'
  limit?: number
  filters?: Array<{ field: string; op: 'eq' | 'contains'; value: string | number }>
}

const FUND_FIELDS = ['nav', 'irr', 'tvpi', 'dpi', 'commitment', 'paidIn', 'name', 'strategy', 'sector', 'assetClass']
const DI_FIELDS = ['currentValue', 'investmentAmount', 'name', 'industry', 'investmentType']

async function tryNLQuery(query: string, user: { id: string; role: string; clientId: string | null }) {
  const prompt = [
    'You transform a natural language search into a simple JSON plan.',
    'Allowed entities: fund, direct-investment.',
    'Allowed fund orderBy fields: nav, irr, tvpi, dpi, commitment, paidIn.',
    'Allowed direct-investment orderBy fields: currentValue, investmentAmount.',
    'Filters: only eq or contains on allowed fields (name, strategy, sector, assetClass for funds; name, industry, investmentType for directs).',
    'Return JSON: { "entity": "...", "orderBy": "...", "order": "asc|desc", "limit": 5, "filters": [ { "field": "...", "op": "eq|contains", "value": "..." } ] }',
    'If you cannot make a plan, respond with {"entity":null}.',
  ].join(' ')

  const res = await chatCompletion({
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: query },
    ],
    temperature: 0,
    maxTokens: 150,
  })

  let plan: NLPlan | null = null
  try {
    plan = JSON.parse(res.content) as NLPlan
  } catch {
    return []
  }
  if (!plan || !plan.entity) return []

  const order = plan.order === 'asc' ? 'asc' : 'desc'
  const limit = Math.min(Math.max(plan.limit ?? 5, 1), 10)

  if (plan.entity === 'fund') {
    if (plan.orderBy && !FUND_FIELDS.includes(plan.orderBy)) return []
    const where: any = {
      AND: [await buildFundAccessWhere(user)],
    }
    if (plan.filters?.length) {
      for (const f of plan.filters) {
        if (!FUND_FIELDS.includes(f.field)) continue
        if (f.op === 'eq') where.AND.push({ [f.field]: f.value })
        if (f.op === 'contains') where.AND.push({ [f.field]: { contains: String(f.value), mode: 'insensitive' } })
      }
    }
    const funds = await prisma.fund.findMany({
      where,
      select: {
        id: true,
        name: true,
        nav: true,
        irr: true,
        tvpi: true,
        dpi: true,
        commitment: true,
        paidIn: true,
        strategy: true,
        sector: true,
        assetClass: true,
      },
      orderBy: plan.orderBy ? { [plan.orderBy]: order } : undefined,
      take: limit,
    })
    return funds.map((f) => ({
      id: f.id,
      type: 'fund',
      title: f.name,
      subtitle: plan.orderBy ? `${plan.orderBy}: ${String((f as any)[plan.orderBy] ?? '')}` : `${f.strategy || ''} ${f.sector || ''}`,
      url: `/funds/${f.id}`,
      metadata: {
        nav: f.nav,
        irr: f.irr,
        tvpi: f.tvpi,
        dpi: f.dpi,
        commitment: f.commitment,
        paidIn: f.paidIn,
      },
    }))
  }

  if (plan.entity === 'direct-investment') {
    if (plan.orderBy && !DI_FIELDS.includes(plan.orderBy)) return []
    const where: any = {
      AND: [await buildDirectInvestmentWhere(user)],
    }
    if (plan.filters?.length) {
      for (const f of plan.filters) {
        if (!DI_FIELDS.includes(f.field)) continue
        if (f.op === 'eq') where.AND.push({ [f.field]: f.value })
        if (f.op === 'contains') where.AND.push({ [f.field]: { contains: String(f.value), mode: 'insensitive' } })
      }
    }
    const directInvestments = await prisma.directInvestment.findMany({
      where,
      select: {
        id: true,
        name: true,
        industry: true,
        investmentType: true,
        currentValue: true,
        investmentAmount: true,
      },
      orderBy: plan.orderBy ? { [plan.orderBy]: order } : undefined,
      take: limit,
    })
    return directInvestments.map((di) => ({
      id: di.id,
      type: 'direct-investment',
      title: di.name,
      subtitle: plan.orderBy ? `${plan.orderBy}: ${String((di as any)[plan.orderBy] ?? '')}` : di.industry || di.investmentType || 'Direct Investment',
      url: `/direct-investments/${di.id}`,
      metadata: {
        currentValue: di.currentValue,
        investmentAmount: di.investmentAmount,
        industry: di.industry,
        investmentType: di.investmentType,
      },
    }))
  }

  return []
}

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

  // Natural language ranking (e.g., "highest nav", "lowest irr")
  const ranking = detectRankingQuery(query)
  if (ranking) {
    if (ranking.entity === 'fund') {
      const funds = await prisma.fund.findMany({
        where: {
          AND: [fundAccessWhere],
        },
        select: {
          id: true,
          name: true,
          nav: true,
          irr: true,
          tvpi: true,
          dpi: true,
          commitment: true,
          paidIn: true,
        },
        orderBy: { [ranking.field]: ranking.order } as any,
        take: 5,
      })

      const results = funds.map((f) => ({
        id: f.id,
        type: 'fund',
        title: f.name,
        subtitle: `${ranking.label}: ${String(f[ranking.field] ?? '')}`,
        url: `/funds/${f.id}`,
        metadata: {
          nav: f.nav,
          irr: f.irr,
          tvpi: f.tvpi,
          dpi: f.dpi,
          commitment: f.commitment,
          paidIn: f.paidIn,
        },
      }))
      return { results }
    }

    if (ranking.entity === 'direct-investment') {
      const directInvestments = await prisma.directInvestment.findMany({
        where: {
          AND: [directInvestmentWhere],
        },
        select: {
          id: true,
          name: true,
          industry: true,
          investmentType: true,
          currentValue: true,
          investmentAmount: true,
        },
        orderBy: { [ranking.field]: ranking.order } as any,
        take: 5,
      })

      const results = directInvestments.map((di) => ({
        id: di.id,
        type: 'direct-investment',
        title: di.name,
        subtitle: `${ranking.label}: ${String(di[ranking.field] ?? '')}`,
        url: `/direct-investments/${di.id}`,
        metadata: {
          currentValue: di.currentValue,
          investmentAmount: di.investmentAmount,
          industry: di.industry,
          investmentType: di.investmentType,
        },
      }))
      return { results }
    }
  }

  // Try NL→structured plan if no ranking detected
  const planResults = await tryNLQuery(query, user)
  if (planResults.length > 0) {
    return { results: planResults }
  }

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
