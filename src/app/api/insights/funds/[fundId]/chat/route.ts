import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getFundMetrics } from '@/lib/retrieval/fundMetrics'
import { getBenchmarkSeries } from '@/lib/retrieval/benchmarks'
import { searchDocumentChunks } from '@/lib/retrieval/search'
import { generateChatAnswer } from '@/lib/insights/chat'
import { resolveEmbedding } from '@/lib/llm/resolveEmbedding'

const bodySchema = z.object({
  question: z.string().min(1),
  fundId: z.string().min(1),
  benchmarkCodes: z.array(z.string()).optional(),
  embedding: z.array(z.number()).optional(),
})

export async function POST(req: Request, context: any) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { question, fundId, benchmarkCodes, embedding } = parsed.data

  try {
    const [metrics, benchmarks] = await Promise.all([
      getFundMetrics({ fundId, limit: 24 }),
      getBenchmarkSeries({ codes: benchmarkCodes, limitPoints: 24 }),
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
