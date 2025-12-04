export interface Chunk {
  text: string
  chunkIndex: number
  startOffset: number
  endOffset: number
  slideNumber?: number | null
}

interface ChunkOptions {
  chunkSize?: number
  overlap?: number
}

/**
 * Splits text into overlapping chunks to fit within embedding limits.
 */
export function chunkText(text: string, options: ChunkOptions = {}): Chunk[] {
  const chunkSize = options.chunkSize ?? 1200
  const overlap = options.overlap ?? 150

  if (!text.trim()) return []

  const chunks: Chunk[] = []
  let idx = 0
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunkText = text.slice(start, end)

    chunks.push({
      text: chunkText,
      chunkIndex: idx,
      startOffset: start,
      endOffset: end,
      slideNumber: null,
    })

    idx += 1
    if (end === text.length) break
    start = end - overlap
  }

  return chunks
}
