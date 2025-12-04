import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchDocumentChunks } from '@/lib/retrieval/search'
import { getTextEmbedding } from '@/lib/llm/embeddings'

const requestSchema = z.object({
  query: z.string().trim().min(1).optional(),
  embedding: z.array(z.number()).min(8).max(8192).optional(),
  fundId: z.string().trim().min(1).optional(),
  strategyId: z.string().trim().min(1).optional(),
  docTypes: z.array(z.string().trim().min(1)).max(20).optional(),
  minUploadedAt: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(50).optional(),
})

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null)
  const parsed = requestSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid request body',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  const { query, embedding, fundId, strategyId, docTypes, minUploadedAt, limit } = parsed.data

  try {
    const resolvedEmbedding = await resolveEmbedding({ query, embedding })
    if (!resolvedEmbedding) {
      return NextResponse.json(
        { error: 'Either embedding or query must be provided' },
        { status: 400 }
      )
    }

    const results = await searchDocumentChunks({
      embedding: resolvedEmbedding,
      fundId,
      strategyId,
      docTypes,
      minUploadedAt,
      limit,
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('retrieval_search_error', error)
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function resolveEmbedding(params: { query?: string; embedding?: number[] }) {
  if (params.embedding?.length) return params.embedding
  if (params.query) {
    return getTextEmbedding(params.query)
  }
  return null
}
