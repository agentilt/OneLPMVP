import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { chatCompletion } from '@/lib/llm/chat'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sanitizeActionHref } from '@/lib/ai/suggestions'

const bodySchema = z.object({
  question: z.string().min(1, 'Question is required'),
})

const SYSTEM_PROMPT = [
  'You are OneLP’s AI assistant for Limited Partners.',
  'Use provided context on funds, directs, capital calls, and distributions.',
  'If context is thin, still answer with helpful guidance and where in the platform (Analytics, Reports, Risk, Capital Calls, Direct Investments) to find details.',
  'Do not invent numbers; describe how to find missing values.',
  'Return a short JSON object: { "text": string, "actionHref"?: string, "actionLabel"?: string }. The text must be plain (no markdown). actionHref must be one of the allowed in-app routes if relevant.',
].join(' ')

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, clientId: true },
  })
  const clientId = userRecord?.clientId ?? (session.user as any)?.clientId
  const isAdmin = userRecord?.role === 'ADMIN'

  // Build access filter similar to analytics page (user or fundAccess)
  const accessibleFundIds = await prisma.fundAccess.findMany({
    where: { userId },
    select: { fundId: true },
  })

  const funds = await prisma.fund.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { userId },
            { id: { in: accessibleFundIds.map((f) => f.fundId) } },
            ...(clientId ? [{ clientId }] : []),
          ],
        },
    select: {
      id: true,
      name: true,
      commitment: true,
      paidIn: true,
      nav: true,
      irr: true,
      tvpi: true,
      dpi: true,
      assetClass: true,
      strategy: true,
      sector: true,
      baseCurrency: true,
    },
  })

  const directs = await prisma.directInvestment.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { userId },
            ...(clientId ? [{ clientId }] : []),
          ],
        },
    select: {
      id: true,
      name: true,
      investmentType: true,
      industry: true,
      stage: true,
      investmentAmount: true,
      currentValue: true,
    },
  })

  const now = new Date()
  const soon = new Date()
  soon.setDate(soon.getDate() + 60)
  const upcomingCapitalCalls = await prisma.document.findMany({
    where: {
      type: 'CAPITAL_CALL',
      fund: isAdmin
        ? {}
        : {
            OR: [
              { userId },
              { id: { in: accessibleFundIds.map((f) => f.fundId) } },
              ...(clientId ? [{ clientId }] : []),
            ],
          },
      OR: [
        { dueDate: { gte: now, lte: soon } },
        { paymentStatus: { in: ['PENDING', 'LATE', 'OVERDUE'] } },
      ],
    },
    select: {
      id: true,
      title: true,
      fundId: true,
      fund: { select: { name: true } },
      dueDate: true,
      callAmount: true,
      paymentStatus: true,
    },
    orderBy: { dueDate: 'asc' },
    take: 10,
  })

  const upcomingDistributions = await prisma.distribution.findMany({
    where: {
      fund: isAdmin
        ? {}
        : {
            OR: [
              { userId },
              { id: { in: accessibleFundIds.map((f) => f.fundId) } },
              ...(clientId ? [{ clientId }] : []),
            ],
          },
      distributionDate: { gte: now, lte: soon },
    },
    select: {
      id: true,
      fundId: true,
      fund: { select: { name: true } },
      distributionDate: true,
      amount: true,
      distributionType: true,
      description: true,
    },
    orderBy: { distributionDate: 'asc' },
    take: 10,
  })

  const contextParts: string[] = []
  if (funds.length > 0) {
    contextParts.push(
      'Funds:',
      ...funds.map(
        (f) =>
          `- ${f.name} (assetClass=${f.assetClass}, strategy=${f.strategy || 'n/a'}, nav=${f.nav}, paidIn=${f.paidIn}, commitment=${f.commitment}, irr=${f.irr}, tvpi=${f.tvpi}, dpi=${f.dpi})`
      )
    )
  }
  if (directs.length > 0) {
    contextParts.push(
      'Direct Investments:',
      ...directs.map(
        (d) =>
          `- ${d.name} (type=${d.investmentType}, industry=${d.industry || 'n/a'}, stage=${d.stage || 'n/a'}, invested=${d.investmentAmount || 'n/a'}, currentValue=${d.currentValue || 'n/a'})`
      )
    )
  }
  if (upcomingCapitalCalls.length > 0) {
    contextParts.push(
      'Upcoming Capital Calls:',
      ...upcomingCapitalCalls.map(
        (c) =>
          `- ${c.fund?.name ?? 'Fund'}: callAmount=${c.callAmount ?? 'n/a'}, dueDate=${c.dueDate?.toISOString() ?? 'n/a'}, status=${c.paymentStatus ?? 'n/a'}, title=${c.title || 'Capital Call'}`
      )
    )
  }
  if (upcomingDistributions.length > 0) {
    contextParts.push(
      'Upcoming Distributions:',
      ...upcomingDistributions.map(
        (d) =>
          `- ${d.fund?.name ?? 'Fund'}: amount=${d.amount ?? 'n/a'}, date=${d.distributionDate?.toISOString() ?? 'n/a'}, type=${d.distributionType || 'n/a'}, desc=${d.description || ''}`
      )
    )
  }

  const context =
    contextParts.join('\n') ||
    'No fund or direct investment context available. Still answer with general guidance and how to find details in Analytics, Reports, Risk, Capital Calls, and Direct Investments.'

  try {
    const result = await chatCompletion({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            `Allowed in-app routes: /dashboard, /funds, /direct-investments, /capital-calls, /analytics, /reports, /risk, /cash-flow, /documents.`,
            `Context:\n${context}`,
            `Question: ${parsed.data.question}`,
            'Respond ONLY with JSON: {"text": "...", "actionHref": "/funds" | "/analytics" | "/capital-calls" | "/risk" | "/reports" | "/cash-flow" | "/dashboard" | "/direct-investments" | "/documents", "actionLabel": "Open analytics"}',
            'If no navigation is relevant, omit actionHref/actionLabel.',
          ].join('\n'),
        },
      ],
      maxTokens: 500,
      temperature: 0.2,
    })

    let message = {
      text: result.content,
      actionHref: undefined as string | undefined,
      actionLabel: undefined as string | undefined,
    }

    try {
      const parsedJson = JSON.parse(result.content)
      if (parsedJson && typeof parsedJson.text === 'string') {
        message.text = parsedJson.text
        const safeHref = sanitizeActionHref(parsedJson.actionHref)
        message.actionHref = safeHref
        message.actionLabel = parsedJson.actionLabel || (safeHref ? 'Open' : undefined)
      }
    } catch {
      // fall back to raw text
    }

    return NextResponse.json({
      message,
      context: {
        funds,
        directInvestments: directs,
        capitalCalls: upcomingCapitalCalls,
        distributions: upcomingDistributions,
      },
    })
  } catch (error) {
    console.error('ai_chat_error', error)
    return NextResponse.json(
      { error: 'Chat failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
