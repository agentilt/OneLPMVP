import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getFundMetrics } from '@/lib/retrieval/fundMetrics'
import { getBenchmarkSeries } from '@/lib/retrieval/benchmarks'
import { searchDocumentChunks } from '@/lib/retrieval/search'
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
      getBenchmarkSeries({ codes: parsed.data.benchmarkCodes, limitPoints: 24 }),
    ])

    const chunks = await searchDocumentChunks({
      embedding: Array(1536).fill(0), // placeholder embedding to get recent chunks; better: store recents
      fundId,
      limit: 6,
    }).catch(() => [])

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
