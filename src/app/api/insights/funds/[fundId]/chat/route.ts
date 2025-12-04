import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getFundMetrics } from '@/lib/retrieval/fundMetrics'
import { getBenchmarkSeries } from '@/lib/retrieval/benchmarks'
import { searchDocumentChunks } from '@/lib/retrieval/search'
import { generateChatAnswer } from '@/lib/insights/chat'
import { resolveEmbedding } from '@/lib/llm/resolveEmbedding'

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

    const answer = await generateChatAnswer({
      fundName: fundId,
      question,
      metrics,
      benchmarks,
      chunks: chunks.map((c) => ({
        documentId: c.documentId,
        title: c.document.title,
        slideNumber: c.slideNumber,
        text: c.text,
      })),
    })

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
