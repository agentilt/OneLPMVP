type Provider = 'openai'

const DEFAULT_PROVIDER: Provider = (process.env.LLM_PROVIDER as Provider) || 'openai'
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
      return callOpenAI(input)
    default:
      throw new Error(`Unsupported LLM provider: ${DEFAULT_PROVIDER}`)
  }
}

async function callOpenAI(input: ChatCompletionInput): Promise<ChatCompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: input.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: input.maxTokens ?? 800,
      messages: input.messages,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI chat request failed: ${res.status} ${text}`)
  }

  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI chat response missing content')
  return { content }
}
