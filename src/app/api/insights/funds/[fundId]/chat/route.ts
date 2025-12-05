import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getFundMetrics } from '@/lib/retrieval/fundMetrics'
import { getBenchmarkSeries } from '@/lib/retrieval/benchmarks'
import { searchDocumentChunks } from '@/lib/retrieval/search'
import { generateChatAnswer } from '@/lib/insights/chat'
import { resolveEmbedding } from '@/lib/llm/resolveEmbedding'
import { prisma } from '@/lib/db'

const bodySchema = z.object({
  question: z.string().min(1),
  benchmarkCodes: z.array(z.string()).optional(),
  embedding: z.array(z.number()).optional(),
})

export async function POST(req: Request, context: any) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const fundId = context?.params?.fundId
  if (!fundId) {
    return NextResponse.json({ error: 'Invalid request', details: { fieldErrors: { fundId: ['Required'] } } }, { status: 400 })
  }

  const { question, benchmarkCodes, embedding } = parsed.data

  try {
    const fund = await prisma.fund.findUnique({
      where: { id: fundId },
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

    const [metrics, benchmarks] = await Promise.all([
      safeGetFundMetrics(fundId),
      safeGetBenchmarks(benchmarkCodes),
    ])

    const queryEmbedding = await resolveEmbedding({ query: question, embedding })
    if (!queryEmbedding) {
      return NextResponse.json({ error: 'Embedding resolution failed' }, { status: 400 })
    }

    const chunks = await searchDocumentChunks({
      embedding: queryEmbedding,
      fundId,
      limit: 8,
    })

    const hasDocs = chunks.length > 0
    const hasMetrics = Array.isArray(metrics) && metrics.length > 0
    const hasBenchmarks = Array.isArray(benchmarks) && benchmarks.length > 0
    const hasFund = !!fund

    if (!hasDocs && !hasMetrics && !hasBenchmarks && !hasFund) {
      return NextResponse.json({
        answer: 'No context available: no documents, metrics, or benchmarks found for this fund. Please ingest documents or metrics before asking questions.',
        sources: [],
      })
    }

    const answer = await generateChatAnswer(
      {
        fundName: fund?.name || fundId,
        question,
        metrics,
        benchmarks,
        fundDetails: fund
          ? {
              name: fund.name,
              commitment: fund.commitment,
              paidIn: fund.paidIn,
              nav: fund.nav,
              irr: fund.irr,
              tvpi: fund.tvpi,
              dpi: fund.dpi,
              assetClass: fund.assetClass,
              strategy: fund.strategy,
              sector: fund.sector,
              baseCurrency: fund.baseCurrency,
            }
          : undefined,
        chunks: chunks.map((c) => ({
          documentId: c.documentId,
          title: c.document.title,
          slideNumber: c.slideNumber,
          text: c.text,
        })),
      },
      hasDocs
    )

    return NextResponse.json({ answer: answer.answer, sources: chunks })
  } catch (error) {
    console.error('insights_chat_error', error)
    return NextResponse.json(
      { error: 'Chat failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function safeGetBenchmarks(codes?: string[]) {
  try {
    return await getBenchmarkSeries({ codes, limitPoints: 24 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('benchmark_series')) {
      console.warn('benchmark_series table missing; returning empty benchmarks')
      return []
    }
    throw err
  }
}

async function safeGetFundMetrics(fundId: string) {
  try {
    return await getFundMetrics({ fundId, limit: 24 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('fund_metrics')) {
      console.warn('fund_metrics table missing; returning empty metrics')
      return []
    }
    throw err
  }
}
