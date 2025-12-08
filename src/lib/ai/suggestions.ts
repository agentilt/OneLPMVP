import { chatCompletion } from '@/lib/llm/chat'
import { nanoid } from 'nanoid'

export type AISuggestion = {
  id: string
  title: string
  detail: string
  actionHref?: string
  actionLabel?: string
}

type FundSignal = {
  name: string
  nav?: number | null
  irr?: number | null
  tvpi?: number | null
  dpi?: number | null
  commitment?: number | null
  paidIn?: number | null
}

type CapitalCallSignal = {
  fundName?: string | null
  dueDate?: Date | string | null
  callAmount?: number | null
  status?: string | null
  title?: string | null
}

type DistributionSignal = {
  fundName?: string | null
  amount?: number | null
  distributionDate?: Date | string | null
  distributionType?: string | null
  description?: string | null
}

type DirectInvestmentSignal = {
  name: string
  investmentType?: string | null
  currentValue?: number | null
  investmentAmount?: number | null
  stage?: string | null
  industry?: string | null
}

export type SuggestionContext = {
  userFirstName?: string | null
  portfolioSummary?: {
    combinedNav?: number
    combinedCommitment?: number
    fundTvpi?: number
    activeCapitalCalls?: number
  }
  funds: FundSignal[]
  capitalCalls: CapitalCallSignal[]
  distributions: DistributionSignal[]
  directInvestments: DirectInvestmentSignal[]
  recentActivity?: string[]
}

const ROUTE_ALLOWLIST = [
  '/dashboard',
  '/funds',
  '/funds/',
  '/direct-investments',
  '/capital-calls',
  '/analytics',
  '/reports',
  '/risk',
  '/cash-flow',
  '/documents',
]

export function sanitizeActionHref(href?: string | null): string | undefined {
  if (!href || typeof href !== 'string') return undefined
  if (href.startsWith('http://') || href.startsWith('https://')) return undefined
  const normalized = href.trim()
  const safePrefix = ROUTE_ALLOWLIST.find((allowed) => normalized === allowed || normalized.startsWith(allowed))
  return safePrefix ? normalized : undefined
}

function extractJsonArray(text: string): any[] | null {
  try {
    const trimmed = text.trim()
    if (trimmed.startsWith('[')) {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed : null
    }
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      const parsed = JSON.parse(match[0])
      return Array.isArray(parsed) ? parsed : null
    }
    return null
  } catch {
    return null
  }
}

function coerceSuggestions(raw: any[] | null, fallbackText: string[]): AISuggestion[] {
  if (!raw || raw.length === 0) {
    return fallbackText.slice(0, 4).map((text) => ({
      id: nanoid(6),
      title: text,
      detail: 'Tap to open the most relevant area.',
      actionHref: '/dashboard',
      actionLabel: 'Go to dashboard',
    }))
  }

  return raw
    .map((item) => {
      const title = typeof item?.title === 'string' ? item.title : typeof item?.headline === 'string' ? item.headline : null
      const detail = typeof item?.detail === 'string' ? item.detail : typeof item?.summary === 'string' ? item.summary : item?.reason || null
      const actionHref = sanitizeActionHref(item?.actionHref || item?.href || item?.link)
      const actionLabel = typeof item?.actionLabel === 'string' ? item.actionLabel : typeof item?.cta === 'string' ? item.cta : undefined

      if (!title || !detail) return null
      return {
        id: typeof item?.id === 'string' ? item.id : nanoid(6),
        title: title.trim(),
        detail: detail.trim(),
        actionHref,
        actionLabel: actionHref ? (actionLabel || 'Open') : undefined,
      }
    })
    .filter(Boolean) as AISuggestion[]
}

function buildContextText(ctx: SuggestionContext, limit = 8) {
  const fundLines = ctx.funds.slice(0, limit).map(
    (f) =>
      `${f.name}: nav=${f.nav ?? 'n/a'}, irr=${f.irr ?? 'n/a'}, tvpi=${f.tvpi ?? 'n/a'}, dpi=${f.dpi ?? 'n/a'}, paidIn=${f.paidIn ?? 'n/a'}, commitment=${f.commitment ?? 'n/a'}`
  )
  const capitalCallLines = ctx.capitalCalls.slice(0, limit).map(
    (c) =>
      `${c.fundName ?? 'Fund'} call=${c.callAmount ?? 'n/a'} due=${c.dueDate ?? 'n/a'} status=${c.status ?? 'n/a'} title=${c.title ?? 'Capital call'}`
  )
  const distributionLines = ctx.distributions.slice(0, limit).map(
    (d) => `${d.fundName ?? 'Fund'} distribution=${d.amount ?? 'n/a'} date=${d.distributionDate ?? 'n/a'} type=${d.distributionType ?? 'n/a'} desc=${d.description ?? ''}`
  )
  const directLines = ctx.directInvestments.slice(0, limit).map(
    (d) =>
      `${d.name}: type=${d.investmentType ?? 'n/a'}, invested=${d.investmentAmount ?? 'n/a'}, current=${d.currentValue ?? 'n/a'}, stage=${d.stage ?? 'n/a'}, industry=${d.industry ?? 'n/a'}`
  )

  const recent = ctx.recentActivity?.length ? `Recent activity: ${ctx.recentActivity.join('; ')}` : ''
  const portfolio =
    ctx.portfolioSummary && (ctx.portfolioSummary.combinedNav || ctx.portfolioSummary.combinedCommitment || ctx.portfolioSummary.fundTvpi)
      ? `Portfolio summary: combinedNav=${ctx.portfolioSummary.combinedNav ?? 'n/a'}, combinedCommitment=${ctx.portfolioSummary.combinedCommitment ?? 'n/a'}, fundTvpi=${ctx.portfolioSummary.fundTvpi ?? 'n/a'}, activeCapitalCalls=${ctx.portfolioSummary.activeCapitalCalls ?? 'n/a'}`
      : ''

  return [
    portfolio,
    fundLines.length ? 'Funds:' : '',
    ...fundLines,
    capitalCallLines.length ? 'Capital calls:' : '',
    ...capitalCallLines,
    distributionLines.length ? 'Distributions:' : '',
    ...distributionLines,
    directLines.length ? 'Direct investments:' : '',
    ...directLines,
    recent,
  ]
    .filter(Boolean)
    .join('\n')
}

export async function generateAISuggestions(ctx: SuggestionContext, limit = 4): Promise<AISuggestion[]> {
  const contextText = buildContextText(ctx)
  const safeLimit = Math.min(Math.max(limit, 3), 5)
  const name = ctx.userFirstName || 'user'

  const result = await chatCompletion({
    messages: [
      {
        role: 'system',
        content: [
          'You are OneLP Copilot. Create short, action-oriented suggestions for a Limited Partner user.',
          'Use the provided context about holdings, capital calls, distributions, and direct investments.',
          'Return ONLY a compact JSON array with each item: { "id": string, "title": string, "detail": string, "actionHref"?: string, "actionLabel"?: string }. Do not include any other text.',
          `Allowed actionHref values: ${ROUTE_ALLOWLIST.join(', ')} (use whichever is most relevant).`,
          'Prefer concise, specific titles and one-line detail. Avoid duplicating the same idea. If data is thin, suggest exploratory actions (e.g., open analytics, review risk) but keep them grounded.',
        ].join(' '),
      },
      {
        role: 'user',
        content: [
          `User: ${name}`,
          `Need ${safeLimit} suggestions tailored to their current portfolio signals.`,
          'Context follows. Use it to select the most relevant pages/actions.',
          contextText || 'No context; provide general but useful navigation suggestions.',
        ].join('\n'),
      },
    ],
    maxTokens: 500,
    temperature: 0.35,
  })

  const rawArray = extractJsonArray(result.content)
  const fallback = ['Open analytics to review performance', 'Check capital calls due soon', 'Review risk and exposure', 'Open documents to review latest notices']
  return coerceSuggestions(rawArray, fallback).slice(0, safeLimit)
}
