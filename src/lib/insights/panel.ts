import { chatCompletion } from '@/lib/llm/chat'
import { buildSystemPrompt, enforceCitations } from '@/lib/insights/prompts'

export interface PanelContext {
  fundName: string
  metrics: any
  benchmarks: any
  chunks: Array<{
    documentId: string
    title: string
    slideNumber?: number | null
    text: string
  }>
}

export interface PanelResult {
  cards: Array<{
    type: 'performance' | 'risk' | 'liquidity' | 'changes'
    title: string
    summary: string
  }>
}

export async function generateInsightsPanel(ctx: PanelContext): Promise<PanelResult> {
  const system = buildSystemPrompt()
  const docs = ctx.chunks
    .map(
      (c, i) =>
        `DOC${i + 1}: title="${c.title}", slide=${c.slideNumber ?? 'n/a'}, text="${c.text.trim().slice(0, 800)}"`
    )
    .join('\n')
  const userContent = [
    `Fund: ${ctx.fundName}`,
    'Create 4 concise cards: performance vs benchmark, risk, liquidity, notable changes.',
    'Use metrics JSON and benchmarks JSON; cite sources (Title, slide/page or Metric date).',
    'Metrics:',
    JSON.stringify(ctx.metrics ?? {}, null, 2),
    'Benchmarks:',
    JSON.stringify(ctx.benchmarks ?? {}, null, 2),
    'Documents:',
    docs || 'None',
    'Respond as JSON with cards[{type,title,summary}] and include citations inline in summary.',
  ].join('\n')

  const result = await chatCompletion({
    messages: [system, { role: 'user', content: userContent }],
    maxTokens: 800,
  })

  if (!enforceCitations(result.content)) {
    throw new Error('LLM panel response missing citations')
  }

  // Try to parse JSON block; if fails, return text as single card
  try {
    const parsed = JSON.parse(result.content)
    if (parsed.cards && Array.isArray(parsed.cards)) {
      return { cards: parsed.cards }
    }
  } catch (err) {
    // fallthrough to text card
  }

  return {
    cards: [
      { type: 'changes', title: 'Insights', summary: result.content },
    ],
  }
}
