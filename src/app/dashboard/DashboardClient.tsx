/* eslint-disable react/no-unescaped-entities */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowUpRight,
  BarChart as BarChartIcon,
  Briefcase,
  Building2,
  Calendar,
  Command,
  Droplet,
  FileText,
  Gauge,
  Loader2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { AIChatDrawer } from '@/components/AIChatDrawer'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { formatCurrency, formatMultiple, formatPercent } from '@/lib/utils'
import { AISuggestion } from '@/lib/ai/suggestions'

interface Fund {
  id: string
  name: string
  domicile: string
  vintage: number
  manager: string
  managerEmail?: string | null
  managerPhone?: string | null
  managerWebsite?: string | null
  commitment: number
  paidIn: number
  nav: number
  tvpi: number
  dpi: number
  lastReportDate: Date
  navHistory: { date: Date; nav: number }[]
  documents: {
    id: string
    title: string
    dueDate: Date | null
    callAmount: number | null
    paymentStatus: string | null
  }[]
}

interface PortfolioSummary {
  combinedCommitment: number
  combinedNav: number
  combinedTvpi: number
  activeCapitalCalls: number
  fundCommitment: number
  fundNav: number
  fundPaidIn: number
  fundTvpi: number
  directInvestmentAmount: number
  directInvestmentValue: number
}

interface DirectInvestment {
  id: string
  name: string
  investmentType: string
  industry?: string | null
  stage?: string | null
  investmentDate?: Date | string | null
  investmentAmount?: number | null

  principalAmount?: number | null
  interestRate?: number | null
  couponRate?: number | null
  maturityDate?: Date | string | null
  creditRating?: string | null
  defaultStatus?: string | null
  currentValue?: number | null
  yield?: number | null

  tickerSymbol?: string | null
  shares?: number | null
  purchasePrice?: number | null
  currentPrice?: number | null
  dividends?: number | null
  marketValue?: number | null

  propertyType?: string | null
  propertyAddress?: string | null
  squareFootage?: number | null
  purchaseDate?: Date | string | null
  purchaseValue?: number | null
  currentAppraisal?: number | null
  rentalIncome?: number | null
  occupancyRate?: number | null
  propertyTax?: number | null
  maintenanceCost?: number | null
  netOperatingIncome?: number | null

  assetType?: string | null
  assetDescription?: string | null
  assetLocation?: string | null
  acquisitionDate?: Date | string | null
  acquisitionValue?: number | null
  assetCurrentValue?: number | null
  assetIncome?: number | null
  holdingCost?: number | null

  accountType?: string | null
  accountName?: string | null
  cashInterestRate?: number | null
  balance?: number | null
  currency?: string | null
  cashMaturityDate?: Date | string | null

  revenue?: number | null
  arr?: number | null
  mrr?: number | null
  cashBalance?: number | null
  lastReportDate?: Date | string | null
  documents: { id: string }[]
}

interface DirectInvestmentsSummary {
  totalInvestmentAmount: number
  totalRevenue: number
  totalARR: number
  count: number
}

interface AllocationDatum {
  name: string
  value: number
  percentage: number
}

interface AllocationData {
  byManager: AllocationDatum[]
  byAssetClass: AllocationDatum[]
  byGeography: AllocationDatum[]
}

interface DashboardClientProps {
  funds: Fund[]
  portfolioSummary: PortfolioSummary
  directInvestments: DirectInvestment[]
  directInvestmentsSummary: DirectInvestmentsSummary
  allocationData: AllocationData
  userRole: string
  userFirstName: string
  aiSuggestions: AISuggestion[]
}

export function DashboardClient({
  funds,
  portfolioSummary,
  directInvestments,
  directInvestmentsSummary,
  allocationData,
  userRole,
  userFirstName,
  aiSuggestions,
}: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inlineInitialPrompt, setInlineInitialPrompt] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>(aiSuggestions || [])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null)
  const shellRail =
    'hidden lg:block fixed left-[17.5rem] top-[4.5rem] h-[calc(100vh-4.5rem)] w-px bg-gradient-to-b from-accent/70 via-accent/15 to-transparent opacity-70 pointer-events-none z-30'
  const COLORS = ['#6bdcff', '#7c5bff', '#22c55e', '#f59e0b', '#38bdf8', '#a855f7', '#ec4899', '#2cf3c7']
  const tooltipStyles = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.75rem',
    color: 'var(--foreground)',
    boxShadow: '0 20px 45px rgba(12,27,51,0.18)',
    padding: '0.75rem 1rem',
  } as const
  const tooltipLabelStyle = { color: 'var(--foreground)', fontWeight: 600 }

  const condenseData = (data: AllocationDatum[], limit = 6) => {
    if (!data.length) return []
    if (data.length <= limit) {
      return data
    }
    const top = data.slice(0, limit)
    const remainderPercentage = data.slice(limit).reduce((sum, item) => sum + item.percentage, 0)
    const remainderValue = data.slice(limit).reduce((sum, item) => sum + item.value, 0)
    if (remainderPercentage > 0) {
      top.push({
        name: 'Other',
        value: remainderValue,
        percentage: remainderPercentage,
      })
    }
    return top
  }

  const managerSeries = useMemo(() => condenseData(allocationData.byManager, 6), [allocationData.byManager])
  const assetClassSeries = useMemo(() => condenseData(allocationData.byAssetClass, 6), [allocationData.byAssetClass])
  const geographySeries = useMemo(() => condenseData(allocationData.byGeography, 6), [allocationData.byGeography])

  const portfolioNavSeries = useMemo(() => {
    const navMap = new Map<string, number>()
    funds.forEach((fund) => {
      fund.navHistory.forEach((navPoint) => {
        const key = new Date(navPoint.date).toISOString().split('T')[0]
        navMap.set(key, (navMap.get(key) || 0) + navPoint.nav)
      })
    })
    return Array.from(navMap.entries())
      .map(([date, nav]) => ({ date, nav }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-12)
  }, [funds])

  const capitalCallStats = useMemo(() => {
    let dueSoon = 0
    let overdue = 0
    let countDueSoon = 0
    let countOverdue = 0

    funds.forEach((fund) => {
      fund.documents.forEach((doc) => {
        if (!doc.dueDate || !doc.callAmount) return
        const diffDays = (new Date(doc.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays < 0) {
          overdue += Math.abs(doc.callAmount)
          countOverdue += 1
        } else if (diffDays <= 30) {
          dueSoon += Math.abs(doc.callAmount)
          countDueSoon += 1
        }
      })
    })

    const navBase = portfolioSummary.combinedNav || 1
    const percentDueSoon = dueSoon > 0 ? (dueSoon / navBase) * 100 : 0
    const percentOverdue = overdue > 0 ? (overdue / navBase) * 100 : 0

    return { dueSoon, overdue, countDueSoon, countOverdue, percentDueSoon, percentOverdue }
  }, [funds, portfolioSummary.combinedNav])

  const dpiProgress = useMemo(() => {
    const paidIn = funds.reduce((sum, f) => sum + f.paidIn, 0)
    const distributions = funds.reduce((sum, f) => sum + f.dpi * f.paidIn, 0)
    const returned = Math.max(distributions, 0)
    const pct = paidIn > 0 ? returned / paidIn : 0
    return { returned, paidIn, pct }
  }, [funds])

  const underperformingFundCount = useMemo(
    () => funds.filter((f) => f.tvpi < 1.5).length,
    [funds]
  )

  const staleValuationCount = useMemo(() => {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - 90)
    return funds.filter((f) => new Date(f.lastReportDate) < threshold).length
  }, [funds])

  const glassCard = 'glass-panel rounded-3xl overflow-hidden'
  const tileCard = 'glass-tile rounded-2xl'

  const copilotInsights = [
    {
      title:
        capitalCallStats.overdue + capitalCallStats.dueSoon > 0
          ? `${capitalCallStats.countOverdue + capitalCallStats.countDueSoon} capital calls need action`
          : 'Capital calls stable',
      detail:
        capitalCallStats.overdue + capitalCallStats.dueSoon > 0
          ? `${formatCurrency(capitalCallStats.overdue + capitalCallStats.dueSoon)} flagged • ${capitalCallStats.countOverdue} overdue`
          : 'Copilot watching for new notices in real time',
      href: '/capital-calls',
    },
    {
      title:
        underperformingFundCount > 0
          ? `${underperformingFundCount} fund${underperformingFundCount === 1 ? '' : 's'} < 1.5x TVPI`
          : 'Funds trending on target',
      detail:
        underperformingFundCount > 0
          ? 'Shift pacing or remediation for lagging managers'
          : 'Maintain pacing; Copilot will flag slippage',
      href: '/funds',
    },
    {
      title:
        staleValuationCount > 0
          ? `${staleValuationCount} stale valuations (90d+)`
          : 'Valuations are current',
      detail:
        staleValuationCount > 0
          ? 'Request refresh to keep risk current'
          : 'Copilot watching for aging NAVs',
      href: '/funds',
    },
  ]

  const promptIdeas = [
    'Pacing vs commitment schedule',
    'Capital calls and cash coverage',
    'Top managers by DPI/TVPI',
    'Signals to brief IC this week',
  ]

  const dryPowder = Math.max(portfolioSummary.combinedCommitment - portfolioSummary.fundPaidIn, 0)
  const pacing = portfolioSummary.combinedCommitment > 0
    ? portfolioSummary.fundPaidIn / portfolioSummary.combinedCommitment
    : 0

  const metricStack = [
    {
      title: 'Total AUM',
      value: formatCurrency(portfolioSummary.combinedNav),
      helper: `Commitment ${formatCurrency(portfolioSummary.combinedCommitment)}`,
      accent: 'from-cyan-400/30 via-blue-500/20 to-violet-500/25',
      Icon: Gauge,
    },
    {
      title: 'Fund TVPI',
      value: formatMultiple(portfolioSummary.fundTvpi),
      helper: `NAV ${formatCurrency(portfolioSummary.fundNav)}`,
      accent: 'from-emerald-400/30 via-emerald-500/15 to-emerald-400/10',
      Icon: TrendingUp,
    },
    {
      title: 'DPI Returned',
      value: formatPercent(dpiProgress.pct * 100, 0),
      helper: `Distributions ${formatCurrency(dpiProgress.returned)}`,
      accent: 'from-indigo-400/30 via-indigo-500/20 to-indigo-400/10',
      Icon: Gauge,
    },
    {
      title: 'Dry Powder',
      value: formatCurrency(dryPowder),
      helper: `Pacing ${formatPercent(pacing * 100, 0)} of commitments`,
      accent: 'from-amber-400/30 via-orange-500/15 to-amber-400/10',
      Icon: Droplet,
    },
    {
      title: 'Capital Pressure',
      value: formatCurrency(capitalCallStats.overdue + capitalCallStats.dueSoon),
      helper: `${capitalCallStats.countOverdue} overdue • ${capitalCallStats.countDueSoon} due soon`,
      accent: 'from-rose-400/30 via-rose-500/15 to-rose-400/10',
      Icon: AlertCircle,
    },
  ]

  const pressureHighlights = [
    {
      label: 'Overdue',
      amount: capitalCallStats.overdue,
      count: capitalCallStats.countOverdue,
      percent: capitalCallStats.percentOverdue,
      gradient: 'from-rose-500 to-amber-500',
    },
    {
      label: 'Next 30 days',
      amount: capitalCallStats.dueSoon,
      count: capitalCallStats.countDueSoon,
      percent: capitalCallStats.percentDueSoon,
      gradient: 'from-amber-400 to-amber-200',
    },
  ]

  const triggerCopilotPrompt = (prompt: string) => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('onelp-copilot-prompt', { detail: { prompt } }))
  }

  useEffect(() => {
    setSuggestions(aiSuggestions || [])
  }, [aiSuggestions])

  const refreshSuggestions = async () => {
    setSuggestionsLoading(true)
    setSuggestionsError(null)
    try {
      const res = await fetch('/api/ai/suggestions', { method: 'GET' })
      if (!res.ok) throw new Error('Unable to refresh AI suggestions')
      const json = await res.json()
      setSuggestions(json.suggestions || [])
    } catch (err) {
      setSuggestionsError(err instanceof Error ? err.message : 'Refresh failed')
    } finally {
      setSuggestionsLoading(false)
    }
  }

  return (
    <div className="min-h-screen glass-page text-foreground">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-10 xl:px-12 space-y-10 w-full pb-14">
          <motion.section
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative mt-6 overflow-hidden rounded-[32px] glass-strong"
          >
            <div className="relative p-6 sm:p-8 lg:p-10 space-y-8">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                <div className="space-y-3 text-foreground">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.22em] font-semibold text-foreground/60">Copilot</p>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground leading-tight">
                      Ask OneLP AI
                    </h1>
                    <p className="text-sm sm:text-base text-foreground/70 max-w-2xl">
                      Quick answers with navigation to the right page. Suggestions update from your holdings, calls, and distributions.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center text-xs text-foreground/70">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-100)] px-3 py-1">Live signals</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-100)] px-3 py-1">Context aware</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-100)] px-3 py-1">Client-side navigation</span>
                  </div>
                </div>
                <div className="shrink-0 glass-panel rounded-3xl px-6 py-5 min-w-[260px]">
                  <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-foreground/70 text-right">AUM</p>
                  <p className="text-4xl font-bold text-foreground text-right leading-tight">{formatCurrency(portfolioSummary.combinedNav)}</p>
                  <p className="text-xs text-foreground/70 text-right mt-1">Commitment {formatCurrency(portfolioSummary.combinedCommitment)}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-foreground/70">
                    <span>TVPI {formatMultiple(portfolioSummary.fundTvpi)}</span>
                    <span>DPI {formatPercent(dpiProgress.pct * 100, 0)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-foreground font-semibold">Suggested for you</p>
                    <p className="text-sm text-foreground/80">AI-ranked actions from your recent signals</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {suggestionsError && <span className="text-xs text-rose-300">{suggestionsError}</span>}
                    <button
                      onClick={refreshSuggestions}
                      disabled={suggestionsLoading}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-[var(--surface-hover)] text-xs font-semibold text-foreground hover:border-accent/60 transition-all disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-white/90"
                    >
                      {suggestionsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {(suggestions.length ? suggestions : Array.from({ length: 4 }, (_, i) => ({ id: `skeleton-${i}`, title: '', detail: '' } as AISuggestion))).map((s, idx) => {
                    const isSkeleton = !s.title
                    const content = (
                      <div className="relative overflow-hidden rounded-2xl glass-tile p-4 h-full">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-accent/10 via-transparent to-accent/5" />
                        <div className="relative space-y-2">
                          <p className="text-sm font-semibold text-foreground line-clamp-2">{isSkeleton ? 'Loading...' : s.title}</p>
                          <p className="text-xs text-foreground/80 line-clamp-3">{isSkeleton ? 'Ranking suggestions...' : s.detail}</p>
                          {s.actionHref && s.actionLabel && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                              {s.actionLabel}
                              <ArrowUpRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    )

                    if (isSkeleton) {
                      return (
                        <div key={s.id} className="group">
                          {content}
                        </div>
                      )
                    }

                    return s.actionHref ? (
                      <Link key={s.id} href={s.actionHref} className="group block">
                        {content}
                      </Link>
                    ) : (
                      <button
                        key={s.id}
                        onClick={() => setInlineInitialPrompt(s.title)}
                        className="group block text-left w-full"
                      >
                        {content}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="w-full flex flex-col items-center">
                <AIChatDrawer
                  isOpen
                  variant="inline"
                  onClose={() => {}}
                  initialQuestion={inlineInitialPrompt || undefined}
                  onClearInitial={() => setInlineInitialPrompt(null)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {metricStack.map((metric) => {
                  const Icon = metric.Icon
                  return (
                    <div
                      key={metric.title}
                        className="relative overflow-hidden rounded-2xl glass-tile p-4"
                    >
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-foreground/70 font-semibold">{metric.title}</p>
                            <p className="text-2xl font-bold text-foreground leading-tight">{metric.value}</p>
                            <p className="text-xs text-foreground/70">{metric.helper}</p>
                        </div>
                          <div className="w-10 h-10 rounded-xl bg-[var(--surface-hover)] flex items-center justify-center border border-border">
                            <Icon className="w-5 h-5 text-foreground" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.45 }}
            className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]"
          >
            <div className={glassCard}>
              <div className="flex items-center justify-between px-6 pt-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/60 font-semibold">Signals</p>
                  <h3 className="text-xl font-semibold text-foreground mt-1">Copilot watchlist</h3>
                </div>
                <Link href="/analytics" className="text-xs text-accent hover:text-accent-hover font-semibold inline-flex items-center gap-1">
                  View detail
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 p-6 pt-4">
                {copilotInsights.map((insight) => (
                  <Link
                    key={insight.title}
                    href={insight.href}
                    className="group relative overflow-hidden rounded-2xl border border-border dark:border-white/10 bg-[var(--surface)] px-4 py-4 transition-all hover:border-accent/60"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-accent/10 via-transparent to-accent/5" />
                    <div className="relative space-y-1">
                      <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                      <p className="text-xs text-foreground/70">{insight.detail}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                        Open
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className={glassCard + ' p-6 space-y-4'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/60 font-semibold">Action lane</p>
                  <h3 className="text-lg font-semibold text-foreground mt-1">AI-first workflow</h3>
                </div>
                <button
                  onClick={() => triggerCopilotPrompt('Run a briefing on current risk and pacing')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white text-xs font-semibold shadow-lg shadow-accent/25 ring-1 ring-white/10"
                >
                  <Command className="w-4 h-4" />
                  Brief me
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {promptIdeas.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => triggerCopilotPrompt(prompt)}
                    className="rounded-xl border border-border dark:border-white/10 bg-[var(--surface-hover)] px-3 py-2 text-xs font-semibold text-foreground hover:border-accent/60 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-border dark:border-white/10 bg-gradient-to-r from-accent/12 via-accent/6 to-transparent p-4 text-sm text-foreground/80">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-foreground">Instant next steps</span>
                </div>
                Copilot drafts briefs, chase-lists, and pacing updates on demand — or schedule a weekly digest.
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5 }}
            className="grid gap-6 xl:grid-cols-[1.5fr,1fr]"
          >
            <div className={glassCard}>
              <div className="glass-header flex items-center justify-between px-6 py-5 rounded-t-[inherit]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-100)] flex items-center justify-center">
                    <LineChartIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">NAV trajectory</h3>
                    <p className="text-xs text-foreground/70">12-month rolling net asset value</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-foreground/70">Current NAV</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(portfolioSummary.combinedNav)}</p>
                </div>
              </div>
              <div className="p-6">
                {portfolioNavSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={portfolioNavSeries}>
                      <defs>
                        <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.42} />
                          <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.35} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'var(--muted)', fontSize: 12, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border-color)' }}
                      />
                      <YAxis
                        tick={{ fill: 'var(--muted)', fontSize: 12, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border-color)' }}
                        tickFormatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label: string) => `Date: ${label}`}
                        contentStyle={{
                          ...tooltipStyles,
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        labelStyle={{ ...tooltipLabelStyle, marginBottom: '8px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="nav"
                        stroke="var(--accent-color)"
                        strokeWidth={3}
                        fill="url(#navGradient)"
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--surface)' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-foreground/70 border border-dashed border-border rounded-xl">
                    No NAV history available yet.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={glassCard + ' p-6'}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-foreground/60 font-semibold">Capital pressure</p>
                    <h3 className="text-lg font-semibold text-foreground">Obligations radar</h3>
                  </div>
                  <Link href="/capital-calls" className="text-xs text-accent hover:text-accent-hover font-semibold">
                    Manage
                  </Link>
                </div>
                <div className="grid gap-3">
                  {pressureHighlights.map((row) => (
                    <div key={row.label} className="p-3 rounded-xl border border-border dark:border-white/10 bg-[var(--surface)]">
                      <div className="flex items-center justify-between text-sm text-foreground">
                        <span className="font-semibold">{row.label}</span>
                        <span className="text-foreground/70">{row.count} notices</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-foreground">
                        <span className="text-lg font-bold">{formatCurrency(row.amount)}</span>
                        <span className="text-xs text-foreground/70">{formatPercent(row.percent, 1)} of NAV</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-[var(--surface-hover)]">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${row.gradient}`}
                          style={{ width: `${Math.min(row.percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-foreground/70 flex items-center justify-between">
                  <span>Coverage</span>
                  <span>{formatPercent(pacing * 100, 0)} pacing • Dry powder {formatCurrency(dryPowder)}</span>
                </div>
              </div>

              <div className={glassCard + ' p-6'}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-foreground/60 font-semibold">Exposure map</p>
                    <h3 className="text-lg font-semibold text-foreground">Top managers & geos</h3>
                  </div>
                  <Link href="/risk" className="text-xs text-accent hover:text-accent-hover font-semibold">
                    Risk
                  </Link>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-foreground/60 font-semibold mb-2">Managers</p>
                    <div className="space-y-2">
                      {(managerSeries.length ? managerSeries : [{ name: 'No data', percentage: 0 }]).slice(0, 4).map((item, index) => (
                        <div key={item.name + index} className="flex items-center justify-between text-sm rounded-xl border border-border dark:border-white/10 bg-[var(--surface)] px-3 py-2 text-foreground">
                          <span className="font-semibold">{item.name}</span>
                          <span className="text-foreground/70">{formatPercent(item.percentage || 0, 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-foreground/60 font-semibold mb-2">Geography</p>
                    <div className="space-y-2">
                      {(geographySeries.length ? geographySeries : [{ name: 'No data', percentage: 0 }]).slice(0, 3).map((item, index) => (
                        <div key={item.name + index} className="flex items-center justify-between text-sm rounded-xl border border-border dark:border-white/10 bg-[var(--surface)] px-3 py-2 text-foreground">
                          <span className="font-semibold">{item.name}</span>
                          <span className="text-foreground/70">{formatPercent(item.percentage || 0, 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            className="grid gap-6 lg:grid-cols-3"
          >
            <div className={glassCard + ' flex flex-col'}>
              <div className="glass-header flex items-center justify-between px-6 py-5 rounded-t-[inherit]">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-100)] flex items-center justify-center">
                    <PieChartIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Allocation snapshot</h3>
                    <p className="text-xs text-foreground/70">By asset class</p>
                  </div>
                </div>
                <Link href="/analytics" className="text-xs text-accent hover:text-accent-hover font-semibold">
                  View
                </Link>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                {assetClassSeries.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-stretch gap-6">
                    <div className="flex-1 flex items-center justify-center min-h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={assetClassSeries}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {assetClassSeries.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={tooltipStyles}
                            labelStyle={{ ...tooltipLabelStyle, fontWeight: 700 }}
                            itemStyle={{ color: 'var(--foreground)', fontWeight: 500 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3">
                      {assetClassSeries.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-sm text-foreground">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium truncate">{item.name}</span>
                          </div>
                          <span className="font-semibold ml-4 flex-shrink-0 text-foreground/80">
                            {formatPercent(item.percentage, 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-foreground/70">
                    No asset class data available
                  </div>
                )}
              </div>
            </div>

            <div className={glassCard + ' flex flex-col'}>
              <div className="glass-header flex items-center justify-between px-6 py-5 rounded-t-[inherit]">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-100)] flex items-center justify-center">
                    <BarChartIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Cash returned (DPI)</h3>
                    <p className="text-xs text-foreground/70">Top funds by realized returns</p>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 flex items-center" style={{ minHeight: 0 }}>
                {funds.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={260} maxHeight={360}>
                    <BarChart
                      data={funds
                        .slice()
                        .sort((a, b) => b.dpi - a.dpi)
                        .slice(0, 5)
                        .map((fund) => ({
                          name: fund.name.length > 12 ? fund.name.substring(0, 12) + '...' : fund.name,
                          DPI: fund.dpi,
                        }))}
                      margin={{ top: 10, right: 10, left: 10, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.35} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 600 }}
                        angle={-30}
                        textAnchor="end"
                        height={50}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fill: 'var(--muted)', fontSize: 11, fontWeight: 600 }}
                        tickFormatter={(value: number) => `${value.toFixed(1)}x`}
                      />
                      <Tooltip
                        formatter={(value: number) => formatMultiple(value)}
                        contentStyle={tooltipStyles}
                        labelStyle={tooltipLabelStyle}
                        itemStyle={{
                          color: 'var(--foreground)',
                          fontWeight: 500,
                        }}
                      />
                      <Bar dataKey="DPI" fill="var(--accent-color)" radius={[8, 8, 0, 0]} maxBarSize={42} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-foreground/70 border border-dashed border-border rounded-xl">
                    No performance data available.
                  </div>
                )}
              </div>
            </div>

            <div className={glassCard + ' flex flex-col'}>
              <div className="glass-header flex items-center justify-between px-6 py-5 rounded-t-[inherit]">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-foreground/60 font-semibold">Directs</p>
                  <h3 className="text-lg font-semibold text-foreground">Top direct investments</h3>
                </div>
                <Link
                  href="/direct-investments"
                  className="text-xs text-accent hover:text-accent-hover font-semibold inline-flex items-center gap-1"
                >
                  View all
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="p-0">
                {directInvestments.length > 0 ? (
                  <div className="overflow-hidden">
                    <div className="glass-header grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 text-xs font-semibold text-foreground/70 uppercase tracking-wider rounded-t-[inherit]">
                      <div className="w-8">#</div>
                      <div>Company</div>
                      <div className="text-right w-20">Stage</div>
                      <div className="text-right w-24">Investment</div>
                      <div className="text-right w-24">Value</div>
                      <div className="text-right w-20">Multiple</div>
                    </div>
                    {directInvestments
                      .slice()
                      .sort((a, b) => {
                        const aValue = a.currentValue || a.investmentAmount || 0
                        const bValue = b.currentValue || b.investmentAmount || 0
                        return bValue - aValue
                      })
                      .slice(0, 8)
                      .map((investment, index) => {
                        const investmentAmount = investment.investmentAmount || 0
                        const currentValue = investment.currentValue || investment.investmentAmount || 0
                        const multiple = investmentAmount > 0 ? currentValue / investmentAmount : 0

                        return (
                          <Link key={investment.id} href={`/direct-investments/${investment.id}`} className="block group">
                            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-[var(--surface-hover)] transition-colors">
                              <div className="w-8 flex items-center">
                                <span
                                  className={`text-sm font-bold ${
                                    index === 0
                                      ? 'text-amber-400'
                                      : index === 1
                                      ? 'text-slate-400'
                                      : index === 2
                                      ? 'text-amber-600'
                                      : 'text-foreground/60'
                                  }`}
                                >
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex items-center min-w-0" title={investment.name}>
                                <p className="font-semibold text-sm text-foreground truncate group-hover:text-accent transition-colors">
                                  {investment.name}
                                </p>
                              </div>
                              <div className="w-20 flex items-center justify-end" title={`Stage: ${investment.stage || 'N/A'}`}>
                                <span className="text-xs text-foreground/70 truncate">{investment.stage || '—'}</span>
                              </div>
                              <div className="w-24 flex items-center justify-end" title={investmentAmount ? formatCurrency(investmentAmount) : 'N/A'}>
                                <span className="text-sm text-foreground/70 font-mono">
                                  {investmentAmount > 0 ? `${(investmentAmount / 1000000).toFixed(1)}M` : '—'}
                                </span>
                              </div>
                              <div className="w-24 flex items-center justify-end" title={currentValue ? formatCurrency(currentValue) : 'N/A'}>
                                <span className="text-sm text-foreground/70 font-mono">
                                  {currentValue > 0 ? `${(currentValue / 1000000).toFixed(1)}M` : '—'}
                                </span>
                              </div>
                              <div className="w-20 flex items-center justify-end" title={multiple > 0 ? formatMultiple(multiple) : 'N/A'}>
                                <span
                                  className={`text-sm font-bold tabular-nums ${
                                    multiple >= 2
                                      ? 'text-emerald-600 dark:text-emerald-300'
                                      : multiple >= 1
                                      ? 'text-foreground'
                                      : 'text-rose-600 dark:text-rose-300'
                                  }`}
                                >
                                  {multiple > 0 ? formatMultiple(multiple) : '—'}
                                </span>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                  </div>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-sm text-foreground/70 border-t border-border">
                    <Building2 className="w-10 h-10 text-foreground/30 mb-3" />
                    <p>No direct investments available</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-foreground/60 font-semibold">Performance table</p>
                <h2 className="text-2xl font-bold text-foreground">Top performing funds</h2>
              </div>
              <Link
                href="/funds"
                className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className={glassCard}>
              <div className="p-0">
                {funds.length > 0 ? (
                  <div className="overflow-hidden">
                    <div className="glass-header grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 text-xs font-semibold text-foreground/70 uppercase tracking-wider rounded-t-[inherit]">
                      <div className="w-8">#</div>
                      <div>Fund</div>
                      <div className="text-right w-16">Vintage</div>
                      <div className="text-right w-24">Commitment</div>
                      <div className="text-right w-20">NAV</div>
                      <div className="text-right w-16">TVPI</div>
                    </div>
                    {funds
                      .slice()
                      .sort((a, b) => b.tvpi - a.tvpi)
                      .slice(0, 8)
                      .map((fund, index) => (
                        <Link key={fund.id} href={`/funds/${fund.id}`} className="block group">
                          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-[var(--surface-hover)] transition-colors">
                            <div className="w-8 flex items-center">
                              <span
                                className={`text-sm font-bold ${
                                  index === 0
                                    ? 'text-amber-400'
                                    : index === 1
                                    ? 'text-slate-400'
                                    : index === 2
                                    ? 'text-amber-600'
                                    : 'text-foreground/60'
                                }`}
                              >
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex items-center min-w-0" title={fund.name}>
                              <p className="font-semibold text-sm text-foreground truncate group-hover:text-accent transition-colors">
                                {fund.name}
                              </p>
                            </div>
                            <div className="w-16 flex items-center justify-end" title={`Vintage: ${fund.vintage}`}>
                              <span className="text-sm text-foreground/70 font-mono">{fund.vintage}</span>
                            </div>
                            <div className="w-24 flex items-center justify-end" title={`Commitment: ${formatCurrency(fund.commitment)}`}>
                              <span className="text-sm text-foreground/70 font-mono">
                                {(fund.commitment / 1000000).toFixed(1)}M
                              </span>
                            </div>
                            <div className="w-20 flex items-center justify-end" title={`NAV: ${formatCurrency(fund.nav)}`}>
                              <span className="text-sm text-foreground/70 font-mono">
                                {(fund.nav / 1000000).toFixed(1)}M
                              </span>
                            </div>
                            <div className="w-16 flex items-center justify-end" title={`TVPI: ${formatMultiple(fund.tvpi)}`}>
                              <span
                                className={`text-sm font-bold tabular-nums ${
                                  fund.tvpi >= 2
                                    ? 'text-emerald-600 dark:text-emerald-300'
                                    : fund.tvpi >= 1.5
                                    ? 'text-foreground'
                                    : 'text-rose-600 dark:text-rose-300'
                                }`}
                              >
                                {formatMultiple(fund.tvpi)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-sm text-foreground/70 border-t border-border">
                    <Briefcase className="w-10 h-10 text-foreground/30 mb-3" />
                    <p>No funds available</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {userRole === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.5 }}
              className="mb-2"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-foreground/60 font-semibold">Actions</p>
                  <h2 className="text-2xl font-bold text-foreground">Admin quick actions</h2>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <Link
                  href="/admin/documents/upload"
                  className="group glass-panel rounded-2xl p-5 hover:border-accent/50 transition-all duration-150 block"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4">
                    <FileText className="w-5 h-5 text-blue-300" />
                  </div>
                  <div className="font-semibold text-base mb-1 group-hover:text-accent transition-colors">
                    Upload document
                  </div>
                  <div className="text-sm text-foreground/70 leading-relaxed">
                    Push capital calls, reports, and structured data to the workspace.
                  </div>
                </Link>
                <Link
                  href="/admin/users"
                  className="group glass-panel rounded-2xl p-5 hover:border-accent/50 transition-all duration-150 block"
                >
                  <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="font-semibold text-base mb-1 group-hover:text-accent transition-colors">
                    Manage users
                  </div>
                  <div className="text-sm text-foreground/70 leading-relaxed">
                    Invite teams, manage permissions, and control fund access.
                  </div>
                </Link>
                <Link
                  href="/admin/funds/new"
                  className="group glass-panel rounded-2xl p-5 hover:border-accent/50 transition-all duration-150 block"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-4">
                    <Plus className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div className="font-semibold text-base mb-1 group-hover:text-accent transition-colors">
                    Create fund
                  </div>
                  <div className="text-sm text-foreground/70 leading-relaxed">
                    Add a new fund, set metadata, and connect reporting.
                  </div>
                </Link>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}
