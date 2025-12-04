import { getTextEmbedding } from '@/lib/llm/embeddings'

export interface ResolveEmbeddingInput {
  query?: string
  embedding?: number[]
}

export async function resolveEmbedding({ query, embedding }: ResolveEmbeddingInput): Promise<number[] | null> {
  if (embedding?.length) return embedding
  if (query) return getTextEmbedding(query)
  return null
}
