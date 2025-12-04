import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getFundMetrics } from '@/lib/retrieval/fundMetrics'
import { getBenchmarkSeries } from '@/lib/retrieval/benchmarks'
import { getRecentDocumentChunks, searchDocumentChunks } from '@/lib/retrieval/search'
import { generateInsightsPanel } from '@/lib/insights/panel'

const querySchema = z.object({
  fundId: z.string().min(1),
  benchmarkCodes: z
    .string()
    .transform((v) => v.split(',').map((c) => c.trim()).filter(Boolean))
    .optional(),
})

export async function GET(req: Request, context: any) {
  const params = context?.params ?? {}
  const url = new URL(req.url)
  const parsed = querySchema.safeParse({
    fundId: params.fundId,
    benchmarkCodes: url.searchParams.get('benchmarkCodes') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const fundId = parsed.data.fundId
    const [metrics, benchmarks] = await Promise.all([
      getFundMetrics({ fundId, limit: 24 }),
      safeGetBenchmarks(parsed.data.benchmarkCodes),
    ])

    // Prefer recent document chunks for context; fallback to semantic search with zero embedding if none
    let chunks = await getRecentDocumentChunks(fundId, 6).catch(() => [])
    if (chunks.length === 0) {
      chunks = await searchDocumentChunks({
        embedding: Array(1536).fill(0),
        fundId,
        limit: 6,
      }).catch(() => [])
    }

    const panel = await generateInsightsPanel({
      fundName: fundId,
      metrics,
      benchmarks,
      chunks: chunks.map((c) => ({
        documentId: c.documentId,
        title: c.document.title,
        slideNumber: c.slideNumber,
        text: c.text,
      })),
    })

    return NextResponse.json({ panel, sources: chunks })
  } catch (error) {
    console.error('insights_panel_error', error)
    return NextResponse.json(
      { error: 'Failed to generate panel', message: error instanceof Error ? error.message : 'Unknown error' },
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
