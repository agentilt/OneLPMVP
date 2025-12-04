import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ingestDocument } from '@/lib/retrieval/ingest'

const chunkSchema = z.object({
  text: z.string().min(1),
  slideNumber: z.number().int().optional(),
  startOffset: z.number().int().nonnegative().optional(),
  endOffset: z.number().int().nonnegative().optional(),
})

const documentSchema = z.object({
  id: z.string().optional(),
  fundId: z.string().optional(),
  strategyId: z.string().optional(),
  fileId: z.string().optional(),
  title: z.string().min(1),
  docType: z.string().optional(),
  asOfDate: z.string().optional(),
  uploadedAt: z.string().optional(),
  sourceSystem: z.string().optional(),
  pageCount: z.number().int().optional(),
  isRedacted: z.boolean().optional(),
})

const requestSchema = z.object({
  document: documentSchema,
  text: z.string().optional(),
  chunks: z.array(chunkSchema).optional(),
  chunkSize: z.number().int().min(200).max(4000).optional(),
  overlap: z.number().int().min(0).max(500).optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid request body',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  const data = parsed.data

  if (!data.text && (!data.chunks || data.chunks.length === 0)) {
    return NextResponse.json(
      { error: 'Either text or chunks must be provided' },
      { status: 400 }
    )
  }

  try {
    const result = await ingestDocument({
      document: data.document,
      text: data.text,
      chunks: data.chunks,
      chunkSize: data.chunkSize,
      overlap: data.overlap,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('ingest_error', error)
    return NextResponse.json(
      {
        error: 'Ingest failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
