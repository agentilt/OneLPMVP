'use server'

type Provider = 'openai' | 'fireworks' | 'google'

function getDefaultProvider(): Provider {
  return ((process.env.LLM_PROVIDER as Provider) || 'openai').trim().toLowerCase() as Provider
}

function getDefaultModel(): string {
  return process.env.LLM_MODEL || 'gpt-4o-mini'
}

function getDefaultTemperature(): number {
  return Number(process.env.LLM_TEMPERATURE ?? 0)
}

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
  const provider = getDefaultProvider()
  const model = getDefaultModel()
  const defaultTemp = getDefaultTemperature()

  switch (provider) {
    case 'openai':
      return callOpenAICompatible({
        baseUrl: 'https://api.openai.com/v1',
        apiKey: mustGetEnv('OPENAI_API_KEY', 'OpenAI chat'),
        model: model,
        providerName: 'openai',
      }, input, defaultTemp)
    case 'fireworks':
      return callOpenAICompatible({
        baseUrl: 'https://api.fireworks.ai/inference/v1',
        apiKey: mustGetEnv('FIREWORKS_API_KEY', 'Fireworks chat'),
        model: process.env.FIREWORKS_LLM_MODEL || model,
        providerName: 'fireworks',
      }, input, defaultTemp)
    case 'google': {
      // Prefer explicit Google env; if missing or clearly wrong, fall back to a known-good default.
      const explicit = process.env.GOOGLE_LLM_MODEL?.trim()
      const chosen =
        explicit && explicit.toLowerCase().includes('gemini')
          ? explicit
          : 'gemini-2.5-flash'
      return callGoogleGemini(
        {
          apiKey: mustGetEnv('GOOGLE_API_KEY', 'Google Gemini chat'),
          model: chosen,
          providerName: 'google',
        },
        input,
        defaultTemp
      )
    }
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`)
  }
}

async function callOpenAICompatible(
  config: { baseUrl: string; apiKey: string; model: string; providerName: string },
  input: ChatCompletionInput,
  defaultTemp: number
): Promise<ChatCompletionResult> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: input.temperature ?? defaultTemp,
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

async function callGoogleGemini(
  config: { apiKey: string; model: string; providerName: string },
  input: ChatCompletionInput,
  defaultTemp: number
): Promise<ChatCompletionResult> {
  const modelPath = normalizeModelName(config.model)
  const url = `https://generativelanguage.googleapis.com/v1/models/${modelPath}:generateContent?key=${encodeURIComponent(config.apiKey)}`

  const contents = input.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user', // Gemini expects only 'user' or 'model'
    parts: [{ text: m.content }],
  }))

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: input.temperature ?? defaultTemp,
        maxOutputTokens: input.maxTokens ?? 800,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${config.providerName} chat request failed: ${res.status} ${text}`)
  }

  const json = await res.json()
  const candidate = json?.candidates?.[0]
  if (!candidate) {
    console.error('google missing candidates', json)
    throw new Error(`${config.providerName} chat response missing content (no candidates)`)
  }
  const parts = candidate.content?.parts
  if (Array.isArray(parts) && parts.length > 0) {
    const textParts = parts
      .map((p: any) => {
        if (typeof p === 'string') return p
        if (p?.text) return p.text
        if (p?.inlineData?.data) return p.inlineData.data
        if (p?.functionCall?.name) return p.functionCall.name
        return ''
      })
      .filter((t: string) => t && t.trim().length > 0)

    if (textParts.length > 0) {
      return { content: textParts.join('\n') }
    }
  }
  // If the model returned no parts (often with finishReason=MAX_TOKENS), return a graceful message instead of throwing.
  console.error('google missing content parts', JSON.stringify(json, null, 2))
  return {
    content:
      'The model did not return text (possibly hit max tokens). Please try a shorter or more specific question.',
  }
}

function normalizeModelName(name: string): string {
  const trimmed = name.trim()
  return trimmed.startsWith('models/') ? trimmed.replace(/^models\//, '') : trimmed
}
