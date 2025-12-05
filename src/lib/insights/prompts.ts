import type { ChatMessage } from '@/lib/llm/chat'
import { format } from 'date-fns'

export interface InsightContext {
  fundName: string
  question?: string
  metrics: any
  benchmarks: any
  fundDetails?: {
    name: string
    commitment?: number | null
    paidIn?: number | null
    nav?: number | null
    irr?: number | null
    tvpi?: number | null
    dpi?: number | null
    assetClass?: string | null
    strategy?: string | null
    sector?: string | null
    baseCurrency?: string | null
  }
  chunks: Array<{
    documentId: string
    title: string
    slideNumber?: number | null
    text: string
  }>
}

export function buildSystemPrompt(): ChatMessage {
  return {
    role: 'system',
    content: [
      'You are an LP analyst. Answer using only provided context.',
      'Rules:',
      '- Cite sources in every answer with (Title, slide/page # or text snippet) when using documents.',
      '- Cite metric dates when using metrics; use exact numbers from context only.',
      '- If context is insufficient, say so plainly.',
      '- Prefer recent data; provide relative and temporal framing.',
      '- Never invent numbers or benchmarks.',
    ].join('\n'),
  }
}

export function buildUserPrompt(ctx: InsightContext): ChatMessage {
  const metrics = JSON.stringify(ctx.metrics ?? {}, null, 2)
  const benchmarks = JSON.stringify(ctx.benchmarks ?? {}, null, 2)
  const fundDetails = ctx.fundDetails
    ? `Fund details: name=${ctx.fundDetails.name}, nav=${ctx.fundDetails.nav}, paidIn=${ctx.fundDetails.paidIn}, commitment=${ctx.fundDetails.commitment}, irr=${ctx.fundDetails.irr}, tvpi=${ctx.fundDetails.tvpi}, dpi=${ctx.fundDetails.dpi}, assetClass=${ctx.fundDetails.assetClass}, strategy=${ctx.fundDetails.strategy}, sector=${ctx.fundDetails.sector}, baseCurrency=${ctx.fundDetails.baseCurrency}`
    : 'Fund details: none provided'
  const docs = ctx.chunks
    .map(
      (c, i) =>
        `DOC${i + 1}: title="${c.title}", slide=${c.slideNumber ?? 'n/a'}, text="${c.text.trim().slice(0, 800)}"`
    )
    .join('\n')

  const question = ctx.question ?? `Provide performance, risk, liquidity, and notable changes for ${ctx.fundName}.`

  return {
    role: 'user',
    content: [
      `Fund: ${ctx.fundName}`,
      fundDetails,
      `Question: ${question}`,
      'Metrics (JSON):',
      metrics,
      'Benchmarks (JSON):',
      benchmarks,
      'Documents:',
      docs || 'None',
      'Respond with cited takeaways. Cite as (Title, slide X) or (Metric as_of_date).',
    ].join('\n'),
  }
}

export function enforceCitations(text: string): boolean {
  // Simple heuristic: require at least one parenthesis citation token.
  return /\(/.test(text) && /\)/.test(text)
}
