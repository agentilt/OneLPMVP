import { describe, it, expect, vi, afterEach, type Mock } from 'vitest'

vi.mock('@/lib/llm/embeddings', () => ({
  getTextEmbedding: vi.fn(),
}))

import { resolveEmbedding } from '@/lib/llm/resolveEmbedding'
import { getTextEmbedding } from '@/lib/llm/embeddings'

const mockedGetTextEmbedding = getTextEmbedding as unknown as Mock

describe('resolveEmbedding', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns provided embedding when present', async () => {
    const vec = [0.1, 0.2, 0.3]
    const result = await resolveEmbedding({ embedding: vec })
    expect(result).toEqual(vec)
    expect(mockedGetTextEmbedding).not.toHaveBeenCalled()
  })

  it('calls getTextEmbedding when only query is provided', async () => {
    mockedGetTextEmbedding.mockResolvedValue([0.9, 0.8])
    const result = await resolveEmbedding({ query: 'latest nav' })
    expect(result).toEqual([0.9, 0.8])
    expect(mockedGetTextEmbedding).toHaveBeenCalledWith('latest nav')
  })

  it('returns null when neither embedding nor query provided', async () => {
    const result = await resolveEmbedding({})
    expect(result).toBeNull()
  })
})
