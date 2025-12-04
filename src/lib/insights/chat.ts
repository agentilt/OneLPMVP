import { chatCompletion } from '@/lib/llm/chat'
import { buildSystemPrompt, buildUserPrompt, enforceCitations, type InsightContext } from '@/lib/insights/prompts'

export interface ChatAnswer {
  answer: string
}

export async function generateChatAnswer(ctx: InsightContext): Promise<ChatAnswer> {
  const system = buildSystemPrompt()
  const user = buildUserPrompt(ctx)
  const result = await chatCompletion({ messages: [system, user] })

  if (!enforceCitations(result.content)) {
    throw new Error('LLM response missing citations')
  }

  return { answer: result.content }
}
