import { chatCompletion } from '@/lib/llm/chat'
import { buildSystemPrompt, buildUserPrompt, enforceCitations, type InsightContext } from '@/lib/insights/prompts'

export interface ChatAnswer {
  answer: string
}

export async function generateChatAnswer(ctx: InsightContext, hasDocuments: boolean): Promise<ChatAnswer> {
  const system = buildSystemPrompt()
  const user = buildUserPrompt(ctx)
  const result = await chatCompletion({ messages: [system, user] })

  // Only enforce citations when we actually supplied documents to cite
  if (hasDocuments && !enforceCitations(result.content)) {
    throw new Error('LLM response missing citations')
  }

  return { answer: result.content }
}
