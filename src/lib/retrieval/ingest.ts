import { randomUUID } from 'crypto'
import { getNeonClient } from '@/lib/neon'
import { getTextEmbedding } from '@/lib/llm/embeddings'
import { chunkText, type Chunk } from '@/lib/retrieval/chunk'

export interface IngestDocumentInput {
  document: {
    id?: string
    fundId?: string | null
    strategyId?: string | null
    fileId?: string | null
    title: string
    docType?: string | null
    asOfDate?: string | null
    uploadedAt?: string | null
    sourceSystem?: string | null
    pageCount?: number | null
    isRedacted?: boolean | null
  }
  text?: string
  chunks?: Array<{
    text: string
    slideNumber?: number | null
    startOffset?: number | null
    endOffset?: number | null
  }>
  chunkSize?: number
  overlap?: number
}

export interface IngestResult {
  documentId: string
  chunksInserted: number
}

export async function ingestDocument(input: IngestDocumentInput): Promise<IngestResult> {
  if (!input.text && (!input.chunks || input.chunks.length === 0)) {
    throw new Error('Either text or chunks must be provided')
  }

  const documentId = input.document.id ?? randomUUID()
  const client = getNeonClient()

  const preparedChunks: Chunk[] = input.chunks?.length
    ? input.chunks.map((c, idx) => ({
        text: c.text,
        chunkIndex: idx,
        startOffset: c.startOffset ?? 0,
        endOffset: c.endOffset ?? c.text.length,
        slideNumber: c.slideNumber ?? null,
      }))
    : chunkText(input.text ?? '', { chunkSize: input.chunkSize, overlap: input.overlap })

  if (preparedChunks.length === 0) {
    throw new Error('No chunks to ingest')
  }

  await client('BEGIN')
  try {
    await client(
      `
      INSERT INTO documents (
        id, fund_id, strategy_id, file_id, title, doc_type, as_of_date, uploaded_at, source_system, page_count, is_redacted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, NOW()), $9, $10, COALESCE($11, false))
      ON CONFLICT (id) DO UPDATE SET
        fund_id = EXCLUDED.fund_id,
        strategy_id = EXCLUDED.strategy_id,
        file_id = EXCLUDED.file_id,
        title = EXCLUDED.title,
        doc_type = EXCLUDED.doc_type,
        as_of_date = EXCLUDED.as_of_date,
        uploaded_at = EXCLUDED.uploaded_at,
        source_system = EXCLUDED.source_system,
        page_count = EXCLUDED.page_count,
        is_redacted = EXCLUDED.is_redacted
      `,
      [
        documentId,
        input.document.fundId ?? null,
        input.document.strategyId ?? null,
        input.document.fileId ?? null,
        input.document.title,
        input.document.docType ?? null,
        input.document.asOfDate ?? null,
        input.document.uploadedAt ?? null,
        input.document.sourceSystem ?? null,
        input.document.pageCount ?? null,
        input.document.isRedacted ?? null,
      ]
    )

    let inserted = 0
    for (const chunk of preparedChunks) {
      const embedding = await getTextEmbedding(chunk.text)
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Embedding generation failed')
      }

      const embeddingLiteral = `[${embedding.join(',')}]`

      await client(
        `
        INSERT INTO document_chunks (
          id, document_id, fund_id, strategy_id, chunk_index, slide_number, start_offset, end_offset, text, embedding
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector)
        ON CONFLICT (id) DO UPDATE SET
          fund_id = EXCLUDED.fund_id,
          strategy_id = EXCLUDED.strategy_id,
          chunk_index = EXCLUDED.chunk_index,
          slide_number = EXCLUDED.slide_number,
          start_offset = EXCLUDED.start_offset,
          end_offset = EXCLUDED.end_offset,
          text = EXCLUDED.text,
          embedding = EXCLUDED.embedding
        `,
        [
          randomUUID(),
          documentId,
          input.document.fundId ?? null,
          input.document.strategyId ?? null,
          chunk.chunkIndex,
          chunk.slideNumber ?? null,
          chunk.startOffset,
          chunk.endOffset,
          chunk.text,
          embeddingLiteral,
        ]
      )

      inserted += 1
    }

    await client('COMMIT')

    return {
      documentId,
      chunksInserted: inserted,
    }
  } catch (error) {
    await client('ROLLBACK')
    throw error
  }
}
