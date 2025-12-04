import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getBenchmarkSeries } from '@/lib/retrieval/benchmarks'

const querySchema = z.object({
  codes: z
    .string()
    .transform((v) => v.split(',').map((c) => c.trim()).filter(Boolean))
    .optional(),
  assetClass: z.string().optional(),
  sector: z.string().optional(),
  limitPoints: z.coerce.number().int().min(1).max(365).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const parsed = querySchema.safeParse({
    codes: url.searchParams.get('codes') ?? undefined,
    assetClass: url.searchParams.get('assetClass') ?? undefined,
    sector: url.searchParams.get('sector') ?? undefined,
    limitPoints: url.searchParams.get('limitPoints'),
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const data = await getBenchmarkSeries({
      codes: parsed.data.codes,
      assetClass: parsed.data.assetClass,
      sector: parsed.data.sector,
      limitPoints: parsed.data.limitPoints,
      fromDate: parsed.data.from ?? undefined,
      toDate: parsed.data.to ?? undefined,
    })
    return NextResponse.json({ benchmarks: data })
  } catch (error) {
    console.error('benchmarks_error', error)
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
