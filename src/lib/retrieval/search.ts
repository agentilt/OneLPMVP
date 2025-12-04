import { getNeonClient } from '@/lib/neon'

export interface SemanticSearchFilters {
  fundId?: string
  strategyId?: string
  docTypes?: string[]
  minUploadedAt?: Date
  limit?: number
}

export interface SemanticSearchParams extends SemanticSearchFilters {
  embedding: number[]
}

export interface SemanticSearchResult {
  chunkId: string
  documentId: string
  fundId: string | null
  strategyId: string | null
  text: string
  chunkIndex: number
  slideNumber: number | null
  similarity: number
  document: {
    id: string
    title: string
    docType: string | null
    asOfDate: string | null
    uploadedAt: string | null
  }
}

interface RawRow {
  id: string
  document_id: string
  fund_id: string | null
  strategy_id: string | null
  chunk_index: number
  slide_number: number | null
  text: string
  title: string
  doc_type: string | null
  as_of_date: string | null
  uploaded_at: string | null
  similarity: number
}

export async function searchDocumentChunks(params: SemanticSearchParams): Promise<SemanticSearchResult[]> {
  const { embedding, fundId, strategyId, docTypes, minUploadedAt } = params
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 50)

  if (!embedding?.length) {
    throw new Error('Embedding is required for semantic search')
  }

  // pgvector expects a vector literal (e.g. '[0.1, 0.2]')
  const embeddingLiteral = `[${embedding.join(',')}]`

  const conditions: string[] = []
  const values: any[] = [embeddingLiteral]
  let paramIndex = 2 // $1 is reserved for the embedding vector

  if (fundId) {
    conditions.push(`dc.fund_id = $${paramIndex}`)
    values.push(fundId)
    paramIndex++
  }

  if (strategyId) {
    conditions.push(`dc.strategy_id = $${paramIndex}`)
    values.push(strategyId)
    paramIndex++
  }

  if (docTypes && docTypes.length > 0) {
    conditions.push(`d.doc_type = ANY($${paramIndex}::text[])`)
    values.push(docTypes)
    paramIndex++
  }

  if (minUploadedAt) {
    conditions.push(`d.uploaded_at >= $${paramIndex}::timestamptz`)
    values.push(minUploadedAt.toISOString())
    paramIndex++
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const limitPosition = paramIndex
  values.push(limit)

  const query = `
    SELECT
      dc.id,
      dc.document_id,
      dc.fund_id,
      dc.strategy_id,
      dc.chunk_index,
      dc.slide_number,
      dc.text,
      d.title,
      d.doc_type,
      d.as_of_date,
      d.uploaded_at,
      1 - (dc.embedding <=> $1::vector) AS similarity
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    ${whereClause}
    ORDER BY dc.embedding <=> $1::vector
    LIMIT $${limitPosition};
  `

  const client = getNeonClient()
  const rows = (await client(query, values)) as unknown as RawRow[]

  return rows.map((row) => ({
    chunkId: row.id,
    documentId: row.document_id,
    fundId: row.fund_id,
    strategyId: row.strategy_id,
    text: row.text,
    chunkIndex: row.chunk_index,
    slideNumber: row.slide_number,
    similarity: row.similarity,
    document: {
      id: row.document_id,
      title: row.title,
      docType: row.doc_type,
      asOfDate: row.as_of_date,
      uploadedAt: row.uploaded_at,
    },
  }))
}

export interface RecentChunk {
  chunkId: string
  documentId: string
  fundId: string | null
  strategyId: string | null
  text: string
  chunkIndex: number
  slideNumber: number | null
  document: {
    id: string
    title: string
    docType: string | null
    asOfDate: string | null
    uploadedAt: string | null
  }
}

export async function getRecentDocumentChunks(fundId: string, limit = 6): Promise<RecentChunk[]> {
  const client = getNeonClient()
  const safeLimit = Math.min(Math.max(limit, 1), 20)

  const sql = `
    SELECT
      dc.id,
      dc.document_id,
      dc.fund_id,
      dc.strategy_id,
      dc.chunk_index,
      dc.slide_number,
      dc.text,
      d.title,
      d.doc_type,
      d.as_of_date,
      d.uploaded_at
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE dc.fund_id = $1
    ORDER BY d.uploaded_at DESC NULLS LAST, dc.created_at DESC NULLS LAST
    LIMIT $2;
  `

  const rows = (await client(sql, [fundId, safeLimit])) as any[]

  return rows.map((row) => ({
    chunkId: row.id,
    documentId: row.document_id,
    fundId: row.fund_id,
    strategyId: row.strategy_id,
    text: row.text,
    chunkIndex: row.chunk_index,
    slideNumber: row.slide_number,
    document: {
      id: row.document_id,
      title: row.title,
      docType: row.doc_type,
      asOfDate: row.as_of_date,
      uploadedAt: row.uploaded_at,
    },
  }))
}
