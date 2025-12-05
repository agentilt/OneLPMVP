'use server'

type EmbeddingProvider = 'openai' | 'groq' | 'together' | 'fireworks' | 'google'

function getDefaultEmbedModel(): string {
  return process.env.EMBEDDING_MODEL ?? process.env.OPENAI_EMBED_MODEL ?? 'text-embedding-3-small'
}

function getDefaultEmbeddingProvider(): EmbeddingProvider {
  return ((process.env.EMBEDDING_PROVIDER ?? 'openai').trim().toLowerCase()) as EmbeddingProvider
}

function getTargetEmbedDim(): number {
  return Number(process.env.EMBEDDING_DIM ?? 768)
}

interface OpenAICompatibleConfig {
  baseUrl: string
  apiKey: string
  model: string
  providerName: string
}

export async function getTextEmbedding(input: string): Promise<number[]> {
  if (!input?.trim()) throw new Error('Input text is required for embedding generation')

  const provider = getDefaultEmbeddingProvider()
  const model = getDefaultEmbedModel()
  const targetDim = getTargetEmbedDim()

  switch (provider) {
    case 'openai':
      return callOpenAICompatible({
        baseUrl: 'https://api.openai.com/v1',
        apiKey: mustGetEnv('OPENAI_API_KEY', 'OpenAI embeddings'),
        model: model,
        providerName: 'openai',
      }, input, targetDim)
    case 'groq':
      return callOpenAICompatible({
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: mustGetEnv('GROQ_API_KEY', 'Groq embeddings'),
        model: model,
        providerName: 'groq',
      }, input, targetDim)
    case 'together':
      return callOpenAICompatible({
        baseUrl: 'https://api.together.xyz/v1',
        apiKey: mustGetEnv('TOGETHER_API_KEY', 'Together embeddings'),
        model: process.env.TOGETHER_EMBED_MODEL ?? model,
        providerName: 'together',
      }, input, targetDim)
    case 'fireworks':
      return callOpenAICompatible({
        baseUrl: 'https://api.fireworks.ai/inference/v1',
        apiKey: mustGetEnv('FIREWORKS_API_KEY', 'Fireworks embeddings'),
        model: process.env.FIREWORKS_EMBED_MODEL ?? model,
        providerName: 'fireworks',
      }, input, targetDim)
    case 'google':
      return callGoogleEmbedding({
        apiKey: mustGetEnv('GOOGLE_API_KEY', 'Google embeddings'),
        model: process.env.GOOGLE_EMBED_MODEL ?? model ?? 'models/gemini-1.5-flash-embedding-001',
        providerName: 'google',
      }, input, targetDim)
    default:
      throw new Error(`Unsupported embedding provider: ${provider}`)
  }
}

async function callOpenAICompatible(config: OpenAICompatibleConfig, input: string, targetDim: number): Promise<number[]> {
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

  return adjustEmbeddingDimensions(vector, targetDim)
}

async function callGoogleEmbedding(
  config: { apiKey: string; model: string; providerName: string },
  input: string,
  targetDim: number
): Promise<number[]> {
  const modelName = normalizeModelName(config.model)
  const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(modelName)}:embedContent?key=${encodeURIComponent(config.apiKey)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: {
        parts: [{ text: input }],
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`${config.providerName} embedding request failed: ${response.status} ${errorBody}`)
  }

  const json = await response.json()
  const vector = json?.embedding?.values as number[] | undefined
  if (!vector || !Array.isArray(vector)) {
    throw new Error(`${config.providerName} embedding response was missing embedding data`)
  }

  return adjustEmbeddingDimensions(vector, targetDim)
}

function normalizeModelName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.startsWith('models/')) return trimmed
  return `models/${trimmed}`
}

function mustGetEnv(key: string, label: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${label} requires ${key} to be set`)
  return value
}

// Simple dimension alignment: slice when too long, zero-pad when too short.
function adjustEmbeddingDimensions(vec: number[], targetDim: number): number[] {
  if (vec.length === targetDim) return vec
  if (vec.length > targetDim) return vec.slice(0, targetDim)
  const padded = vec.slice()
  while (padded.length < targetDim) padded.push(0)
  return padded
}
