import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDocuments } from '@/lib/retrieval/documents'

const querySchema = z.object({
  fundId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  docTypes: z
    .string()
    .transform((val) => val.split(',').map((v) => v.trim()).filter(Boolean))
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
})

export async function GET(req: Request, { params }: { params: { fundId: string } }) {
  const url = new URL(req.url)
  const parsed = querySchema.safeParse({
    fundId: params.fundId,
    limit: url.searchParams.get('limit'),
    docTypes: url.searchParams.get('docTypes') ?? undefined,
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
    order: url.searchParams.get('order') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const data = await getDocuments({
      fundId: parsed.data.fundId,
      limit: parsed.data.limit,
      docTypes: parsed.data.docTypes,
      fromDate: parsed.data.from ?? undefined,
      toDate: parsed.data.to ?? undefined,
      order: parsed.data.order,
    })
    return NextResponse.json({ documents: data })
  } catch (error) {
    console.error('fund_documents_error', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
