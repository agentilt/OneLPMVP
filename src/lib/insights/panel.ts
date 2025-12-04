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
  const hasDocs = ctx.chunks && ctx.chunks.length > 0
  const hasMetrics = ctx.metrics && Object.keys(ctx.metrics || {}).length > 0
  const hasBenchmarks = Array.isArray(ctx.benchmarks) ? ctx.benchmarks.length > 0 : Object.keys(ctx.benchmarks || {}).length > 0

  // If we have no context at all, return a placeholder card instead of calling the LLM
  if (!hasDocs && !hasMetrics && !hasBenchmarks) {
    return {
      cards: [
        {
          type: 'changes',
          title: 'Insufficient context',
          summary: 'No documents, metrics, or benchmarks available to generate insights.',
        },
      ],
    }
  }

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

  // Require citations when we provided documents; otherwise allow the response but still prefer citations
  if (hasDocs && !enforceCitations(result.content)) {
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
