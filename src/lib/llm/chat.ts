type Provider = 'openai' | 'fireworks'

const DEFAULT_PROVIDER: Provider = ((process.env.LLM_PROVIDER as Provider) || 'openai').trim().toLowerCase() as Provider
const DEFAULT_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini'
const DEFAULT_TEMPERATURE = Number(process.env.LLM_TEMPERATURE ?? 0)

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionInput {
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
}

export interface ChatCompletionResult {
  content: string
}

export async function chatCompletion(input: ChatCompletionInput): Promise<ChatCompletionResult> {
  switch (DEFAULT_PROVIDER) {
    case 'openai':
      return callOpenAICompatible({
        baseUrl: 'https://api.openai.com/v1',
        apiKey: mustGetEnv('OPENAI_API_KEY', 'OpenAI chat'),
        model: DEFAULT_MODEL,
        providerName: 'openai',
      }, input)
    case 'fireworks':
      return callOpenAICompatible({
        baseUrl: 'https://api.fireworks.ai/inference/v1',
        apiKey: mustGetEnv('FIREWORKS_API_KEY', 'Fireworks chat'),
        model: process.env.FIREWORKS_LLM_MODEL || DEFAULT_MODEL,
        providerName: 'fireworks',
      }, input)
    default:
      throw new Error(`Unsupported LLM provider: ${DEFAULT_PROVIDER}`)
  }
}

async function callOpenAICompatible(
  config: { baseUrl: string; apiKey: string; model: string; providerName: string },
  input: ChatCompletionInput
): Promise<ChatCompletionResult> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: input.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: input.maxTokens ?? 800,
      messages: input.messages,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${config.providerName} chat request failed: ${res.status} ${text}`)
  }

  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content
  if (!content) throw new Error(`${config.providerName} chat response missing content`)
  return { content }
}

function mustGetEnv(key: string, label: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${label} requires ${key} to be set`)
  return value
}
