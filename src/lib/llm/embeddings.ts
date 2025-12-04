type EmbeddingProvider = 'openai' | 'groq' | 'together' | 'fireworks'

const DEFAULT_EMBED_MODEL =
  process.env.EMBEDDING_MODEL ?? process.env.OPENAI_EMBED_MODEL ?? 'text-embedding-3-small'
const DEFAULT_EMBEDDING_PROVIDER = ((process.env.EMBEDDING_PROVIDER ?? 'openai').trim().toLowerCase()) as EmbeddingProvider

interface OpenAICompatibleConfig {
  baseUrl: string
  apiKey: string
  model: string
  providerName: string
}

export async function getTextEmbedding(input: string): Promise<number[]> {
  if (!input?.trim()) throw new Error('Input text is required for embedding generation')

  switch (DEFAULT_EMBEDDING_PROVIDER) {
    case 'openai':
      return callOpenAICompatible({
        baseUrl: 'https://api.openai.com/v1',
        apiKey: mustGetEnv('OPENAI_API_KEY', 'OpenAI embeddings'),
        model: DEFAULT_EMBED_MODEL,
        providerName: 'openai',
      }, input)
    case 'groq':
      return callOpenAICompatible({
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: mustGetEnv('GROQ_API_KEY', 'Groq embeddings'),
        model: DEFAULT_EMBED_MODEL,
        providerName: 'groq',
      }, input)
    case 'together':
      return callOpenAICompatible({
        baseUrl: 'https://api.together.xyz/v1',
        apiKey: mustGetEnv('TOGETHER_API_KEY', 'Together embeddings'),
        model: process.env.TOGETHER_EMBED_MODEL ?? DEFAULT_EMBED_MODEL,
        providerName: 'together',
      }, input)
    case 'fireworks':
      return callOpenAICompatible({
        baseUrl: 'https://api.fireworks.ai/inference/v1',
        apiKey: mustGetEnv('FIREWORKS_API_KEY', 'Fireworks embeddings'),
        model: process.env.FIREWORKS_EMBED_MODEL ?? DEFAULT_EMBED_MODEL,
        providerName: 'fireworks',
      }, input)
    default:
      throw new Error(`Unsupported embedding provider: ${DEFAULT_EMBEDDING_PROVIDER}`)
  }
}

async function callOpenAICompatible(config: OpenAICompatibleConfig, input: string): Promise<number[]> {
  const response = await fetch(`${config.baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      input,
      model: config.model,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`${config.providerName} embedding request failed: ${response.status} ${errorBody}`)
  }

  const json = await response.json()
  const vector = json?.data?.[0]?.embedding as number[] | undefined

  if (!vector || !Array.isArray(vector)) {
    throw new Error(`${config.providerName} embedding response was missing embedding data`)
  }

  return vector
}

function mustGetEnv(key: string, label: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${label} requires ${key} to be set`)
  return value
}
