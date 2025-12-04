import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchDocumentChunks } from '@/lib/retrieval/search'
import * as neonModule from '@/lib/neon'

describe('searchDocumentChunks', () => {
  const mockQuery = vi.fn()

  beforeEach(() => {
    mockQuery.mockReset()
    vi.spyOn(neonModule, 'getNeonClient').mockReturnValue(mockQuery as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds query with filters and maps results', async () => {
    mockQuery.mockResolvedValue([
      {
        id: 'chunk-1',
        document_id: 'doc-1',
        fund_id: 'fund-123',
        strategy_id: 'strat-456',
        chunk_index: 0,
        slide_number: 3,
        text: 'sample text',
        title: 'Q4 Update',
        doc_type: 'Q4_DECK',
        as_of_date: '2024-12-31',
        uploaded_at: '2025-01-10T00:00:00.000Z',
        similarity: 0.92,
      },
    ])

    const results = await searchDocumentChunks({
      embedding: [0.1, 0.2],
      fundId: 'fund-123',
      strategyId: 'strat-456',
      docTypes: ['Q4_DECK'],
      minUploadedAt: new Date('2025-01-01'),
      limit: 5,
    })

    expect(mockQuery).toHaveBeenCalledTimes(1)
    const [sql, values] = mockQuery.mock.calls[0]
    expect(sql).toContain('FROM document_chunks')
    expect(sql).toContain('JOIN documents')
    expect(sql).toContain('ORDER BY dc.embedding <=> $1::vector')
    expect(values[0]).toBe('[0.1,0.2]')
    expect(values).toContain('fund-123')
    expect(values).toContain('strat-456')
    expect(Array.isArray(results)).toBe(true)
    expect(results[0]).toMatchObject({
      chunkId: 'chunk-1',
      documentId: 'doc-1',
      fundId: 'fund-123',
      strategyId: 'strat-456',
      chunkIndex: 0,
      slideNumber: 3,
      similarity: 0.92,
      document: {
        id: 'doc-1',
        title: 'Q4 Update',
        docType: 'Q4_DECK',
        asOfDate: '2024-12-31',
        uploadedAt: '2025-01-10T00:00:00.000Z',
      },
    })
  })

  it('throws when embedding is missing', async () => {
    await expect(
      searchDocumentChunks({ embedding: [], limit: 1 })
    ).rejects.toThrow(/Embedding is required/)
  })
})
