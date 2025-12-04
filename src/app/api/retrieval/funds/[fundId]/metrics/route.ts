import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getFundMetrics } from '@/lib/retrieval/fundMetrics'

const querySchema = z.object({
  fundId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(365).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
})

export async function GET(req: Request, context: any) {
  const params = context?.params ?? {}
  const url = new URL(req.url)
  const parsed = querySchema.safeParse({
    fundId: params.fundId,
    limit: url.searchParams.get('limit'),
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
    order: url.searchParams.get('order') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const data = await getFundMetrics({
      fundId: parsed.data.fundId,
      limit: parsed.data.limit,
      fromDate: parsed.data.from ?? undefined,
      toDate: parsed.data.to ?? undefined,
      order: parsed.data.order,
    })
    return NextResponse.json({ metrics: data })
  } catch (error) {
    console.error('fund_metrics_error', error)
    return NextResponse.json(
      { error: 'Failed to fetch fund metrics', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
