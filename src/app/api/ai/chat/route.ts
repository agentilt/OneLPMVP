import { NextResponse } from 'next/server'
import { z } from 'zod'
import { chatCompletion } from '@/lib/llm/chat'

const bodySchema = z.object({
  question: z.string().min(1, 'Question is required'),
  fundId: z.string().optional(), // optional future use
})

const SYSTEM_PROMPT = [
  'You are OneLP’s AI assistant for Limited Partners.',
  'You help users understand the OneLP platform, its features, and how to navigate it.',
  'If the user asks about their data and no context is provided, respond generally and suggest where to look (analytics, reports, risk, capital calls, etc.).',
  'If you do not have enough context to answer, say so plainly and suggest next steps.',
].join(' ')

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { question } = parsed.data

  try {
    const result = await chatCompletion({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
      maxTokens: 600,
      temperature: 0.2,
    })

    return NextResponse.json({ answer: result.content })
  } catch (error) {
    console.error('ai_chat_error', error)
    return NextResponse.json(
      { error: 'Chat failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
