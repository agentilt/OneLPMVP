const DEFAULT_OPENAI_EMBED_MODEL = process.env.OPENAI_EMBED_MODEL ?? 'text-embedding-3-small'
const DEFAULT_EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER ?? 'openai'

export async function getTextEmbedding(input: string): Promise<number[]> {
  if (!input?.trim()) throw new Error('Input text is required for embedding generation')

  switch (DEFAULT_EMBEDDING_PROVIDER) {
    case 'openai':
      return getOpenAIEmbedding(input)
    default:
      throw new Error(`Unsupported embedding provider: ${DEFAULT_EMBEDDING_PROVIDER}`)
  }
}

async function getOpenAIEmbedding(input: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input,
      model: DEFAULT_OPENAI_EMBED_MODEL,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenAI embedding request failed: ${response.status} ${errorBody}`)
  }

  const json = await response.json()
  const vector = json?.data?.[0]?.embedding as number[] | undefined

  if (!vector || !Array.isArray(vector)) {
    throw new Error('OpenAI embedding response was missing embedding data')
  }

  return vector
}
