import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { chatCompletion } from '@/lib/llm/chat'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const bodySchema = z.object({
  question: z.string().min(1, 'Question is required'),
})

const SYSTEM_PROMPT = [
  'You are OneLP’s AI assistant for Limited Partners.',
  'Use only the provided context about the user’s funds and direct investments.',
  'If context is thin, answer generally and suggest where to find details in the platform (Analytics, Reports, Risk, Capital Calls, Direct Investments).',
  'Do not invent numbers not present in the context.',
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
  const clientId = (session.user as any)?.clientId as string | undefined

  // Build access filter similar to analytics page (user or fundAccess)
  const accessibleFundIds = await prisma.fundAccess.findMany({
    where: { userId },
    select: { fundId: true },
  })

  const funds = await prisma.fund.findMany({
    where: {
      OR: [
        { userId },
        { id: { in: accessibleFundIds.map((f) => f.fundId) } },
        // include client-based funds if user has clientId
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
    where: {
      OR: [
        { userId },
        ...(session.user.clientId ? [{ clientId: session.user.clientId }] : []),
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

  const context = contextParts.join('\n') || 'No fund or direct investment context available.'

  try {
    const result = await chatCompletion({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${parsed.data.question}` },
      ],
      maxTokens: 800,
      temperature: 0.2,
    })

    return NextResponse.json({ answer: result.content })
  } catch (error) {
    console.error('ai_chat_error', error)
    return NextResponse.json(
      { error: 'Chat failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
