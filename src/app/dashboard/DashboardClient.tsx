'use client'

import { useState, useMemo } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { formatCurrency, formatMultiple, formatPercent } from '@/lib/utils'
import Link from 'next/link'
import {
  Plus,
  TrendingUp,
  Briefcase,
  DollarSign,
  AlertCircle,
  FileText,
  Users,
  Building2,
  ArrowUpRight,
  Calendar,
  Droplet,
  Gauge,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Sparkles,
  Command,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from 'recharts'

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
  
  // Private Debt/Credit fields
  principalAmount?: number | null
  interestRate?: number | null
  couponRate?: number | null
  maturityDate?: Date | string | null
  creditRating?: string | null
  defaultStatus?: string | null
  currentValue?: number | null
  yield?: number | null
  
  // Public Equity fields
  tickerSymbol?: string | null
  shares?: number | null
  purchasePrice?: number | null
  currentPrice?: number | null
  dividends?: number | null
  marketValue?: number | null
  
  // Real Estate fields
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
  
  // Real Assets fields
  assetType?: string | null
  assetDescription?: string | null
  assetLocation?: string | null
  acquisitionDate?: Date | string | null
  acquisitionValue?: number | null
  assetCurrentValue?: number | null
  assetIncome?: number | null
  holdingCost?: number | null
  
  // Cash fields
  accountType?: string | null
  accountName?: string | null
  cashInterestRate?: number | null
  balance?: number | null
  currency?: string | null
  cashMaturityDate?: Date | string | null
  
  // Private Equity metrics
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
}

export function DashboardClient({
  funds,
  portfolioSummary,
  directInvestments,
  directInvestmentsSummary,
  allocationData,
  userRole,
  userFirstName,
}: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const shellRail =
    'hidden lg:block fixed left-[17.5rem] top-[4.5rem] h-[calc(100vh-4.5rem)] w-px bg-gradient-to-b from-accent/70 via-accent/15 to-transparent opacity-70 pointer-events-none z-30'
  const COLORS = ['#4b6c9c', '#2d7a5f', '#6d5d8a', '#c77340', '#3b82f6', '#10b981', '#ef4444', '#a85f35']
  const tooltipStyles = {
    backgroundColor: '#0f172a',
    border: 'none',
    borderRadius: '0.75rem',
    color: '#f8fafc',
    boxShadow: '0 20px 45px rgba(15,23,42,0.45)',
    padding: '0.75rem 1rem',
  } as const
  const tooltipLabelStyle = { color: '#e2e8f0', fontWeight: 600 }

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
        const diffDays =
          (new Date(doc.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
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

  const panelBase =
    'rounded-3xl border border-border/80 bg-white/88 dark:bg-white/5 overflow-hidden shadow-[0_20px_70px_rgba(12,26,75,0.12)] backdrop-blur-xl'
  const panelHeader =
    'px-6 py-4 flex items-center gap-2 justify-between bg-gradient-to-r from-white/75 via-white/55 to-white/20 dark:from-white/10 dark:via-white/5 dark:to-white/0 border-b border-border/80'

  const copilotInsights = [
    {
      title:
        capitalCallStats.overdue + capitalCallStats.dueSoon > 0
          ? `${capitalCallStats.countOverdue + capitalCallStats.countDueSoon} capital calls need attention`
          : 'No urgent capital call pressure',
      detail:
        capitalCallStats.overdue + capitalCallStats.dueSoon > 0
          ? `${formatCurrency(capitalCallStats.overdue + capitalCallStats.dueSoon)} flagged • ${capitalCallStats.countOverdue} overdue`
          : 'Copilot will flag new notices instantly',
      href: '/capital-calls',
      tone: capitalCallStats.overdue + capitalCallStats.dueSoon > 0 ? 'amber' : 'emerald',
    },
    {
      title:
        underperformingFundCount > 0
          ? `${underperformingFundCount} fund${underperformingFundCount === 1 ? '' : 's'} below 1.5x TVPI`
          : 'All funds at or above targets',
      detail:
        underperformingFundCount > 0
          ? 'Prioritize remediation or allocations shifts'
          : 'Maintain pacing; monitor for shifts weekly',
      href: '/funds',
      tone: underperformingFundCount > 0 ? 'red' : 'emerald',
    },
    {
      title:
        staleValuationCount > 0
          ? `${staleValuationCount} stale valuations (90d+)`
          : 'Valuations are up to date',
      detail:
        staleValuationCount > 0
          ? 'Request refresh from managers to keep risk current'
          : 'Copilot will alert you on aging NAVs',
      href: '/funds',
      tone: staleValuationCount > 0 ? 'amber' : 'emerald',
    },
  ]

  const promptIdeas = [
    'Top managers by DPI/TVPI',
    'Capital calls impacting cash',
    'Stale NAV updates to chase',
  ]

  const metricCards = [
    {
      title: 'Total AUM',
      value: formatCurrency(portfolioSummary.combinedNav),
      helper: `Commitment ${formatCurrency(portfolioSummary.combinedCommitment)}`,
      Icon: DollarSign,
      gradient: 'from-sky-500/20 to-sky-500/10',
    },
    {
      title: 'Fund TVPI',
      value: formatMultiple(portfolioSummary.fundTvpi),
      helper: `Fund NAV ${formatCurrency(portfolioSummary.fundNav)}`,
      Icon: TrendingUp,
      gradient: 'from-emerald-500/20 to-emerald-500/10',
    },
    {
      title: 'DPI Returned',
      value: formatPercent(dpiProgress.pct * 100, 0),
      helper: `Distributions ${formatCurrency(dpiProgress.returned)}`,
      Icon: Gauge,
      gradient: 'from-indigo-500/20 to-indigo-500/10',
    },
    {
      title: 'Capital Calls',
      value: `${portfolioSummary.activeCapitalCalls}`,
      helper: `${formatCurrency(capitalCallStats.overdue + capitalCallStats.dueSoon)} flagged`,
      Icon: AlertCircle,
      gradient: 'from-amber-500/20 to-amber-500/10',
    },
  ]

  const triggerCopilotPrompt = (prompt: string) => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('onelp-copilot-prompt', { detail: { prompt } }))
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_18%,rgba(124,93,255,0.12),transparent_38%),radial-gradient(circle_at_82%_12%,rgba(83,201,255,0.12),transparent_40%),linear-gradient(135deg,rgba(7,10,22,0.96),rgba(10,16,32,0.96))] text-foreground/90">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={shellRail} aria-hidden />

        <main className="flex-1 p-6 lg:p-10 lg:pl-16 xl:pl-20 lg:ml-72 space-y-10 max-w-[1600px] w-full mx-auto">
          <motion.section
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="grid gap-6 xl:grid-cols-[1.6fr,1fr]"
          >
            <div className="glass-strong rounded-3xl border border-white/60 dark:border-white/10 bg-white/90 dark:bg-surface/95 shadow-[0_30px_90px_rgba(12,26,75,0.16)] p-6 sm:p-8 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
                    <Sparkles className="w-4 h-4 text-accent" />
                    AI Command Desk
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                    Welcome back, {userFirstName}
                  </h1>
                  <p className="text-sm text-foreground/65 max-w-2xl">
                    Your AI-native cockpit for LP decisions — keep commands, signals, and actions in one lane.
                  </p>
                </div>
                <div className="shrink-0 rounded-2xl border border-border/70 bg-white/85 dark:bg-white/5 px-5 py-4 shadow-sm">
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-foreground/60 text-right">Total AUM</p>
                  <p className="text-3xl font-bold text-foreground text-right leading-tight">{formatCurrency(portfolioSummary.combinedNav)}</p>
                  <p className="text-xs text-foreground/60 text-right">Commitment {formatCurrency(portfolioSummary.combinedCommitment)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-white/80 via-white/70 to-white/60 dark:from-white/10 dark:via-white/5 dark:to-white/0 p-4 sm:p-5 shadow-[0_16px_50px_rgba(12,26,75,0.12)]">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-accent/15 flex items-center justify-center ring-1 ring-white/10">
                      <Sparkles className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Ask Copilot</p>
                      <p className="text-xs text-foreground/60">Summarize positions, spot risk, draft next steps.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerCopilotPrompt('Open copilot')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/30 hover:-translate-y-0.5 transition-all ring-1 ring-white/10"
                  >
                    <Command className="w-4 h-4" />
                    Launch Copilot
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {promptIdeas.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => triggerCopilotPrompt(prompt)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-white/5 border border-border text-sm font-medium text-foreground/80 hover:border-accent/50 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span className="leading-tight">{prompt}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid sm:grid-cols-3 gap-2">
                  <Link
                    href="/forecasting"
                    className="group flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-border bg-white/75 dark:bg-white/5 hover:border-accent/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold text-foreground">AI scenario</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-foreground/60 group-hover:text-accent" />
                  </Link>
                  <Link
                    href="/analytics"
                    className="group flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-border bg-white/75 dark:bg-white/5 hover:border-accent/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <BarChartIcon className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold text-foreground">Analytics</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-foreground/60 group-hover:text-accent" />
                  </Link>
                  <Link
                    href="/capital-calls"
                    className="group flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-border bg-white/75 dark:bg-white/5 hover:border-accent/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold text-foreground">Capital calls</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-foreground/60 group-hover:text-accent" />
                  </Link>
                </div>
              </div>
            </div>

            <div className={`${panelBase} p-6 sm:p-7`}>
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">Copilot Watchlist</p>
                <h3 className="text-xl font-bold text-foreground mt-1">Signals</h3>
              </div>

              <div className="space-y-2.5">
                {copilotInsights.map((insight) => (
                  <Link
                    key={insight.title}
                    href={insight.href}
                    className="block rounded-xl border border-border px-4 py-3 bg-white/85 dark:bg-white/5 hover:border-accent/50 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{insight.title}</p>
                        <p className="text-xs text-foreground/65 mt-0.5">{insight.detail}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-foreground/50" />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-border/70">
                <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/60 font-semibold">
                  Suggested prompts
                </p>
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  {promptIdeas.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => triggerCopilotPrompt(prompt)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-white/5 border border-border text-sm font-medium text-foreground/80"
                    >
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span className="leading-tight">{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {metricCards.map((card, idx) => {
                const Icon = card.Icon
                return (
                  <div
                    key={card.title}
                    className="group relative overflow-hidden rounded-2xl border border-border/80 bg-white/85 dark:bg-white/5 p-5 shadow-[0_16px_46px_rgba(12,26,75,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:border-accent/50"
                  >
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-gradient-to-br from-accent/8 via-transparent to-accent/4" />
                    <div className="flex items-start justify-between gap-2 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-accent/15 flex items-center justify-center ring-1 ring-white/10">
                          <Icon className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-foreground/60">{card.title}</p>
                          <p className="text-3xl font-bold text-foreground leading-tight">{card.value}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-foreground/40" />
                    </div>
                    <p className="relative z-10 mt-2 text-xs text-foreground/60">{card.helper}</p>
                  </div>
                )
              })}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="grid gap-6 xl:grid-cols-[1.7fr,1fr]"
          >
            <div data-animate data-tilt className={`${panelBase}`}>
              <div className={panelHeader}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <LineChartIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Portfolio NAV trajectory</h3>
                    <p className="text-xs text-foreground/60">12-month rolling net asset value</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-foreground/60">Current NAV</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(portfolioSummary.combinedNav)}</p>
                </div>
              </div>
              <div className="p-6">
                {portfolioNavSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={portfolioNavSeries}>
                      <defs>
                        <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
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
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        fill="url(#navGradient)"
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                    No NAV history available yet.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <div data-animate data-tilt className={`${panelBase} p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                      <Droplet className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Capital call pressure</h3>
                      <p className="text-xs text-foreground/60">Overdue and near-term obligations</p>
                    </div>
                  </div>
                  <Link href="/capital-calls" className="text-xs text-accent hover:text-accent-hover font-semibold">
                    Manage
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    {
                      label: 'Overdue',
                      amount: capitalCallStats.overdue,
                      count: capitalCallStats.countOverdue,
                      percent: capitalCallStats.percentOverdue,
                      color: 'bg-red-500',
                    },
                    {
                      label: 'Due next 30 days',
                      amount: capitalCallStats.dueSoon,
                      count: capitalCallStats.countDueSoon,
                      percent: capitalCallStats.percentDueSoon,
                      color: 'bg-amber-500',
                    },
                  ].map((row) => (
                    <div key={row.label} className="p-3 rounded-xl border border-border/80 bg-white/60 dark:bg-white/5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${row.color}`}></span>
                          <span className="font-semibold text-foreground">{row.label}</span>
                        </div>
                        <span className="text-foreground/60">{row.count} notices</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-base font-bold">{formatCurrency(row.amount)}</span>
                        <span className="text-xs text-foreground/60">{formatPercent(row.percent, 1)} of NAV</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-surface">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                          style={{ width: `${Math.min(row.percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {userRole === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="flex items-center justify-between px-4 py-3 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/20 to-accent/5 text-foreground shadow-lg shadow-accent/20"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm font-semibold">Admin control tower</p>
                      <p className="text-xs text-foreground/70">Invite users, sync data, push docs</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-foreground/60" />
                </Link>
              )}

              {userRole === 'DATA_MANAGER' && (
                <Link
                  href="/data-manager"
                  className="flex items-center justify-between px-4 py-3 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/20 to-accent/5 text-foreground shadow-lg shadow-accent/20"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm font-semibold">Data manager workspace</p>
                      <p className="text-xs text-foreground/70">Ingest docs, align schemas, monitor sync</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-foreground/60" />
                </Link>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid gap-6 lg:grid-cols-3"
          >
            <div data-animate data-tilt className={`${panelBase} flex flex-col`}>
              <div className={panelHeader}>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                    <PieChartIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Allocation snapshot</h3>
                    <p className="text-xs text-foreground/60">By asset class</p>
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
                            contentStyle={{
                              backgroundColor: '#0b1426',
                              border: '1px solid #1f2937',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                              color: '#f8fafc',
                            }}
                            labelStyle={{
                              fontWeight: 'bold',
                              marginBottom: '8px',
                              color: '#f8fafc',
                            }}
                            itemStyle={{
                              color: '#f8fafc',
                              fontWeight: 500,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3">
                      {assetClassSeries.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium text-foreground truncate">{item.name}</span>
                          </div>
                          <span className="font-semibold text-foreground/80 ml-4 flex-shrink-0">
                            {formatPercent(item.percentage, 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-foreground/60">
                    No asset class data available
                  </div>
                )}
              </div>
            </div>

            <div data-animate data-tilt className={`${panelBase} flex flex-col`}>
              <div className={panelHeader}>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Exposure map</h3>
                    <p className="text-xs text-foreground/60">Managers & geography</p>
                  </div>
                </div>
                <Link href="/risk" className="text-xs text-accent hover:text-accent-hover font-semibold">
                  Risk
                </Link>
              </div>
              <div className="p-6 flex-1 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60 font-semibold mb-2">Top managers</p>
                  <div className="space-y-2">
                    {(managerSeries.length ? managerSeries : [{ name: 'No data', percentage: 0 }]).slice(0, 4).map((item, index) => (
                      <div key={item.name + index} className="flex items-center justify-between text-sm rounded-xl border border-border/70 bg-white/70 dark:bg-white/5 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent/70" />
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        <span className="text-foreground/70">{formatPercent(item.percentage || 0, 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60 font-semibold mb-2">Top geographies</p>
                  <div className="space-y-2">
                    {(geographySeries.length ? geographySeries : [{ name: 'No data', percentage: 0 }]).slice(0, 3).map((item, index) => (
                      <div key={item.name + index} className="flex items-center justify-between text-sm rounded-xl border border-border/70 bg-white/70 dark:bg-white/5 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent/70" />
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        <span className="text-foreground/70">{formatPercent(item.percentage || 0, 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-white/70 dark:bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wide text-foreground/60 font-semibold">Direct investments</p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-lg font-bold">{formatCurrency(directInvestmentsSummary.totalInvestmentAmount)}</p>
                      <p className="text-xs text-foreground/60">{directInvestmentsSummary.count} active positions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-foreground/60">ARR</p>
                      <p className="text-base font-semibold">{formatCurrency(directInvestmentsSummary.totalARR)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div data-animate data-tilt className={`${panelBase} flex flex-col`}>
              <div className={panelHeader}>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                    <BarChartIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Cash returned (DPI)</h3>
                    <p className="text-xs text-foreground/60">Top funds by realized returns</p>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                        angle={-30}
                        textAnchor="end"
                        height={50}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        tickFormatter={(value: number) => `${value.toFixed(1)}x`}
                      />
                      <Tooltip
                        formatter={(value: number) => formatMultiple(value)}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                          color: '#f8fafc',
                        }}
                        labelStyle={{ 
                          fontWeight: 'bold', 
                          marginBottom: '8px',
                          color: '#f8fafc'
                        }}
                        itemStyle={{
                          color: '#f8fafc',
                          fontWeight: 500
                        }}
                      />
                      <Bar dataKey="DPI" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={42} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                    No performance data available.
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-foreground/60 font-semibold">Performance table</p>
                <h2 className="text-2xl font-bold">Top performing funds</h2>
              </div>
              <Link
                href="/funds"
                className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div data-animate data-tilt className={panelBase}>
              <div className="p-0">
                {funds.length > 0 ? (
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 bg-white/70 dark:bg-white/5 border-b border-border text-xs font-semibold text-foreground/70 uppercase tracking-wider">
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
                          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-white/70 dark:hover:bg-white/5 transition-colors">
                            <div className="w-8 flex items-center">
                              <span
                                className={`text-sm font-bold ${
                                  index === 0
                                    ? 'text-amber-500'
                                    : index === 1
                                    ? 'text-slate-400'
                                    : index === 2
                                    ? 'text-amber-700'
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
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : fund.tvpi >= 1.5
                                    ? 'text-foreground'
                                    : 'text-red-600 dark:text-red-400'
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
                  <div className="h-[200px] flex flex-col items-center justify-center text-sm text-foreground/60 border-t border-border">
                    <Briefcase className="w-10 h-10 text-foreground/40 mb-3" />
                    <p>No funds available</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-foreground/60 font-semibold">Performance table</p>
                <h2 className="text-2xl font-bold">Top performing direct investments</h2>
              </div>
              <Link
                href="/direct-investments"
                className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div data-animate data-tilt className={panelBase}>
              <div className="p-0">
                {directInvestments.length > 0 ? (
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 bg-white/70 dark:bg-white/5 border-b border-border text-xs font-semibold text-foreground/70 uppercase tracking-wider">
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
                            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-white/70 dark:hover:bg-white/5 transition-colors">
                              <div className="w-8 flex items-center">
                                <span
                                  className={`text-sm font-bold ${
                                    index === 0
                                      ? 'text-amber-500'
                                      : index === 1
                                      ? 'text-slate-400'
                                      : index === 2
                                      ? 'text-amber-700'
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
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : multiple >= 1
                                      ? 'text-foreground'
                                      : 'text-red-600 dark:text-red-400'
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
                  <div className="h-[200px] flex flex-col items-center justify-center text-sm text-foreground/60 border-t border-border">
                    <Building2 className="w-10 h-10 text-foreground/40 mb-3" />
                    <p>No direct investments available</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {userRole === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mb-2"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-foreground/60 font-semibold">Actions</p>
                  <h2 className="text-2xl font-bold">Admin quick actions</h2>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <Link
                  href="/admin/documents/upload"
                  className="group glass-panel rounded-2xl border border-border/80 p-5 hover:shadow-[0_24px_80px_rgba(14,165,233,0.18)] transition-all duration-150 block"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="font-semibold text-base mb-1 group-hover:text-accent transition-colors">
                    Upload document
                  </div>
                  <div className="text-sm text-foreground/60 leading-relaxed">
                    Push capital calls, reports, and structured data to the workspace.
                  </div>
                </Link>
                <Link
                  href="/admin/users"
                  className="group glass-panel rounded-2xl border border-border/80 p-5 hover:shadow-[0_24px_80px_rgba(14,165,233,0.18)] transition-all duration-150 block"
                >
                  <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="font-semibold text-base mb-1 group-hover:text-accent transition-colors">
                    Manage users
                  </div>
                  <div className="text-sm text-foreground/60 leading-relaxed">
                    Invite teams, manage permissions, and control fund access.
                  </div>
                </Link>
                <Link
                  href="/admin/funds/new"
                  className="group glass-panel rounded-2xl border border-border/80 p-5 hover:shadow-[0_24px_80px_rgba(14,165,233,0.18)] transition-all duration-150 block"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-4">
                    <Plus className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="font-semibold text-base mb-1 group-hover:text-accent transition-colors">
                    Create fund
                  </div>
                  <div className="text-sm text-foreground/60 leading-relaxed">
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
