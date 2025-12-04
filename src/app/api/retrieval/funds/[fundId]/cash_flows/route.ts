import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getFundCashFlows } from '@/lib/retrieval/cashFlows'

const querySchema = z.object({
  fundId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(365).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  type: z.enum(['CALL', 'DISTRIBUTION', 'OTHER']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { fundId: string } }) {
  const url = new URL(req.url)
  const parsed = querySchema.safeParse({
    fundId: params.fundId,
    limit: url.searchParams.get('limit'),
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
    type: url.searchParams.get('type') ?? undefined,
    order: url.searchParams.get('order') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const data = await getFundCashFlows({
      fundId: parsed.data.fundId,
      limit: parsed.data.limit,
      fromDate: parsed.data.from ?? undefined,
      toDate: parsed.data.to ?? undefined,
      flowType: parsed.data.type,
      order: parsed.data.order,
    })
    return NextResponse.json({ cashFlows: data })
  } catch (error) {
    console.error('fund_cash_flows_error', error)
    return NextResponse.json(
      { error: 'Failed to fetch fund cash flows', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
