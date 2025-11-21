'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BarChart3,
  Shield,
  TrendingUp,
  Target,
  ArrowRight,
  Briefcase,
  Building2,
  Activity,
  DollarSign,
  AlertCircle,
  TrendingDown,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { formatCurrency, formatMultiple } from '@/lib/utils'

interface PortfolioSummary {
  totalCommitment: number
  totalNav: number
  totalPaidIn: number
  totalDistributions: number
  portfolioTvpi: number
  diTotalInvested: number
  diTotalValue: number
  unfundedCommitments: number
  activeFunds: number
  activeDirectInvestments: number
}

interface RecentCapitalCall {
  id: string
  fundId: string
  fundName: string
  amount: number
  dueDate: string | null
  uploadDate: string | null
  assetClass: string
}

interface RecentDistribution {
  id: string
  fundId: string
  fundName: string
  amount: number
  distributionDate: string | null
  assetClass: string
}

interface RecentActivity {
  capitalCalls: RecentCapitalCall[]
  distributions: RecentDistribution[]
}

interface CashFlowSnapshot {
  totalCapitalCalls: number
  totalDistributions: number
  netCashFlow: number
  pendingCallsCount: number
  pendingCallsAmount: number
  monthlySeries: Array<{
    month: string
    capitalCalls: number
    distributions: number
    net: number
  }>
  pendingCalls: Array<{
    id: string
    fundName: string
    dueDate: string
    amount: number
    status: string
    assetClass?: string
  }>
}

interface FundOverview {
  id: string
  name: string
  manager: string
  domicile: string
  commitment: number
  paidIn: number
  nav: number
  dpi: number
  assetClass: string
}

interface DirectInvestmentOverview {
  id: string
  name: string
  investmentAmount: number
  currentValue: number
  assetClass: string
}

interface CapitalCallDocSummary {
  id: string
  fundId: string
  fundName: string
  callAmount: number
  dueDate: string | null
  uploadDate: string | null
  paymentStatus: string | null
  assetClass: string
}

interface DistributionEntrySummary {
  id: string
  fundId: string
  fundName: string
  amount: number
  distributionDate: string | null
  assetClass: string
}

interface PendingCapitalCallSummary {
  id: string
  fundId: string
  fundName: string
  callAmount: number
  dueDate: string | null
  uploadDate: string | null
  paymentStatus: string | null
  assetClass: string
}


interface AnalyticsClientProps {
  portfolioSummary: PortfolioSummary
  recentActivity: RecentActivity
  cashFlowSnapshot: CashFlowSnapshot
  funds: FundOverview[]
  directInvestments: DirectInvestmentOverview[]
  capitalCallDocs: CapitalCallDocSummary[]
  distributionEntries: DistributionEntrySummary[]
  pendingCapitalCallsRaw: PendingCapitalCallSummary[]
  assetClasses: string[]
  cashFlowMonths: { key: string; label: string }[]
  cashFlowWindowStart: string
}

const calculatePortfolioSummary = (
  funds: FundOverview[],
  directInvestments: DirectInvestmentOverview[]
): PortfolioSummary => {
  if (!funds.length && !directInvestments.length) {
    return {
      totalCommitment: 0,
      totalNav: 0,
      totalPaidIn: 0,
      totalDistributions: 0,
      portfolioTvpi: 0,
      diTotalInvested: 0,
      diTotalValue: 0,
      unfundedCommitments: 0,
      activeFunds: 0,
      activeDirectInvestments: 0,
    }
  }

  const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
  const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
  const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
  const totalDistributions = funds.reduce((sum, fund) => sum + fund.dpi * fund.paidIn, 0)
  const diTotalInvested = directInvestments.reduce((sum, di) => sum + di.investmentAmount, 0)
  const diTotalValue = directInvestments.reduce((sum, di) => sum + di.currentValue, 0)
  const unfundedCommitments = funds.reduce((sum, fund) => sum + (fund.commitment - fund.paidIn), 0)
  const portfolioTvpi = totalPaidIn > 0 ? (totalNav + totalDistributions) / totalPaidIn : 0

  return {
    totalCommitment,
    totalNav,
    totalPaidIn,
    totalDistributions,
    portfolioTvpi,
    diTotalInvested,
    diTotalValue,
    unfundedCommitments,
    activeFunds: funds.length,
    activeDirectInvestments: directInvestments.length,
  }
}

const calculateCashFlowSnapshot = (
  capitalCalls: CapitalCallDocSummary[],
  distributions: DistributionEntrySummary[],
  pendingCalls: PendingCapitalCallSummary[],
  months: { key: string; label: string }[],
  windowStart: string
): CashFlowSnapshot => {
  const startDate = new Date(windowStart)
  const monthBuckets: Record<string, { capitalCalls: number; distributions: number }> = {}
  months.forEach((month) => {
    monthBuckets[month.key] = { capitalCalls: 0, distributions: 0 }
  })

  let totalCapitalCalls = 0
  capitalCalls.forEach((call) => {
    const amount = Math.abs(call.callAmount || 0)
    const date = call.dueDate ? new Date(call.dueDate) : call.uploadDate ? new Date(call.uploadDate) : null
    if (date && date >= startDate) {
      const key = `${date.getFullYear()}-${date.getMonth()}`
      if (monthBuckets[key]) {
        monthBuckets[key].capitalCalls += amount
      }
    }
    totalCapitalCalls += amount
  })

  let totalDistributions = 0
  distributions.forEach((dist) => {
    const amount = dist.amount || 0
    const date = dist.distributionDate ? new Date(dist.distributionDate) : null
    if (date && date >= startDate) {
      const key = `${date.getFullYear()}-${date.getMonth()}`
      if (monthBuckets[key]) {
        monthBuckets[key].distributions += amount
      }
    }
    totalDistributions += amount
  })

  const pendingCallsAmount = pendingCalls.reduce((sum, call) => sum + (call.callAmount || 0), 0)
  const pendingCallEntries = pendingCalls.map((call) => ({
    id: call.id,
    fundName: call.fundName,
    dueDate: call.dueDate || call.uploadDate || '',
    amount: call.callAmount || 0,
    status: call.paymentStatus || 'PENDING',
    assetClass: call.assetClass,
  }))

  return {
    totalCapitalCalls,
    totalDistributions,
    netCashFlow: totalDistributions - totalCapitalCalls,
    pendingCallsCount: pendingCalls.length,
    pendingCallsAmount,
    monthlySeries: months.map((month) => ({
      month: month.label,
      capitalCalls: monthBuckets[month.key]?.capitalCalls || 0,
      distributions: monthBuckets[month.key]?.distributions || 0,
      net:
        (monthBuckets[month.key]?.distributions || 0) -
        (monthBuckets[month.key]?.capitalCalls || 0),
    })),
    pendingCalls: pendingCallEntries,
  }
}

export function AnalyticsClient({
  portfolioSummary,
  recentActivity,
  cashFlowSnapshot,
  funds,
  directInvestments,
  capitalCallDocs,
  distributionEntries,
  pendingCapitalCallsRaw,
  assetClasses,
  cashFlowMonths,
  cashFlowWindowStart,
}: AnalyticsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filterMode, setFilterMode] = useState<'portfolio' | 'fund' | 'assetClass'>('portfolio')
  const [selectedFundId, setSelectedFundId] = useState('all')
  const [selectedAssetClass, setSelectedAssetClass] = useState('all')

  useEffect(() => {
    if (filterMode === 'portfolio') {
      setSelectedFundId('all')
      setSelectedAssetClass('all')
    } else if (filterMode === 'fund') {
      setSelectedAssetClass('all')
    } else if (filterMode === 'assetClass') {
      setSelectedFundId('all')
    }
  }, [filterMode])

  const filteredFunds = useMemo(() => {
    if (filterMode === 'fund' && selectedFundId !== 'all') {
      return funds.filter((fund) => fund.id === selectedFundId)
    }
    if (filterMode === 'assetClass' && selectedAssetClass !== 'all') {
      return funds.filter((fund) => fund.assetClass === selectedAssetClass)
    }
    return funds
  }, [funds, filterMode, selectedFundId, selectedAssetClass])

  const filteredDirectInvestments = useMemo(() => {
    if (filterMode === 'fund' && selectedFundId !== 'all') {
      return []
    }
    if (filterMode === 'assetClass' && selectedAssetClass !== 'all') {
      return directInvestments.filter((di) => di.assetClass === selectedAssetClass)
    }
    return directInvestments
  }, [directInvestments, filterMode, selectedAssetClass, selectedFundId])

  const filteredFundIds = useMemo(() => new Set(filteredFunds.map((fund) => fund.id)), [filteredFunds])

  const filteredCapitalCallDocs = useMemo(() => {
    if (filterMode === 'portfolio') return capitalCallDocs
    if (filterMode === 'fund' && selectedFundId !== 'all') {
      return capitalCallDocs.filter((doc) => doc.fundId === selectedFundId)
    }
    if (filterMode === 'assetClass' && selectedAssetClass !== 'all') {
      return capitalCallDocs.filter((doc) => doc.assetClass === selectedAssetClass)
    }
    return capitalCallDocs
  }, [capitalCallDocs, filterMode, selectedFundId, selectedAssetClass])

  const filteredDistributionEntries = useMemo(() => {
    if (filterMode === 'portfolio') return distributionEntries
    if (filterMode === 'fund' && selectedFundId !== 'all') {
      return distributionEntries.filter((entry) => entry.fundId === selectedFundId)
    }
    if (filterMode === 'assetClass' && selectedAssetClass !== 'all') {
      return distributionEntries.filter((entry) => entry.assetClass === selectedAssetClass)
    }
    return distributionEntries
  }, [distributionEntries, filterMode, selectedFundId, selectedAssetClass])

  const filteredPendingCalls = useMemo(() => {
    if (filterMode === 'portfolio') return pendingCapitalCallsRaw
    if (filterMode === 'fund' && selectedFundId !== 'all') {
      return pendingCapitalCallsRaw.filter((call) => call.fundId === selectedFundId)
    }
    if (filterMode === 'assetClass' && selectedAssetClass !== 'all') {
      return pendingCapitalCallsRaw.filter((call) => call.assetClass === selectedAssetClass)
    }
    return pendingCapitalCallsRaw
  }, [pendingCapitalCallsRaw, filterMode, selectedFundId, selectedAssetClass])

  const filteredRecentCapitalCalls = useMemo(() => {
    if (filterMode === 'portfolio') return recentActivity.capitalCalls
    return recentActivity.capitalCalls.filter((call) => filteredFundIds.has(call.fundId))
  }, [recentActivity.capitalCalls, filterMode, filteredFundIds])

  const filteredRecentDistributions = useMemo(() => {
    if (filterMode === 'portfolio') return recentActivity.distributions
    return recentActivity.distributions.filter((dist) => filteredFundIds.has(dist.fundId))
  }, [recentActivity.distributions, filterMode, filteredFundIds])

  const currentPortfolioSummary = useMemo(() => {
    if (filterMode === 'portfolio') return portfolioSummary
    return calculatePortfolioSummary(filteredFunds, filteredDirectInvestments)
  }, [filterMode, portfolioSummary, filteredFunds, filteredDirectInvestments])

  const currentCashFlowSnapshot = useMemo(() => {
    if (filterMode === 'portfolio') return cashFlowSnapshot
    return calculateCashFlowSnapshot(
      filteredCapitalCallDocs,
      filteredDistributionEntries,
      filteredPendingCalls,
      cashFlowMonths,
      cashFlowWindowStart
    )
  }, [
    filterMode,
    cashFlowSnapshot,
    filteredCapitalCallDocs,
    filteredDistributionEntries,
    filteredPendingCalls,
    cashFlowMonths,
    cashFlowWindowStart,
  ])

  const currentRecentActivity = useMemo(() => {
    if (filterMode === 'portfolio') return recentActivity
    return {
      capitalCalls: filteredRecentCapitalCalls,
      distributions: filteredRecentDistributions,
    }
  }, [filterMode, recentActivity, filteredRecentCapitalCalls, filteredRecentDistributions])

  const selectedFundName = useMemo(() => {
    if (selectedFundId === 'all') return 'All Funds'
    return funds.find((fund) => fund.id === selectedFundId)?.name || 'All Funds'
  }, [selectedFundId, funds])

  const quickInsights = [
    {
      label: 'Total NAV',
      value: formatCurrency(currentPortfolioSummary.totalNav + currentPortfolioSummary.diTotalValue),
      icon: DollarSign,
      color: 'blue',
      trend: '+12.3%',
      trendUp: true,
    },
    {
      label: 'Portfolio TVPI',
      value: formatMultiple(currentPortfolioSummary.portfolioTvpi),
      icon: TrendingUp,
      color: 'emerald',
      trend: '+0.15',
      trendUp: true,
    },
    {
      label: 'Unfunded',
      value: formatCurrency(currentPortfolioSummary.unfundedCommitments),
      icon: AlertCircle,
      color: 'orange',
      trend: '-8.5%',
      trendUp: true,
    },
    {
      label: 'Active Investments',
      value: `${currentPortfolioSummary.activeFunds + currentPortfolioSummary.activeDirectInvestments}`,
      icon: Activity,
      color: 'purple',
      trend: '+3',
      trendUp: true,
    },
  ]

  const analyticsFeatures = [
    {
      name: 'Risk Management',
      description: 'Monitor concentration, stress test scenarios, and track policy compliance',
      href: '/risk',
      icon: Shield,
      color: 'from-red-500 to-rose-600',
      iconBg: 'bg-red-500/10 dark:bg-red-500/20',
      borderColor: 'border-red-200/60 dark:border-red-800/60',
      stats: [
        { label: 'Risk Score', value: '7.2/10' },
        { label: 'Violations', value: '2 Active' },
      ],
    },
    {
      name: 'Forecasting',
      description: 'Project cash flows, model scenarios, and plan liquidity needs',
      href: '/forecasting',
      icon: TrendingUp,
      color: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      borderColor: 'border-blue-200/60 dark:border-blue-800/60',
      stats: [
        { label: 'Next 12M Calls', value: formatCurrency(currentPortfolioSummary.unfundedCommitments * 0.3) },
        { label: 'Projected Dist', value: formatCurrency(currentPortfolioSummary.totalNav * 0.15) },
      ],
    },
    {
      name: 'Portfolio Builder',
      description: 'Optimize allocations, rebalance holdings, and model target portfolios',
      href: '/portfolio-builder',
      icon: Target,
      color: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      borderColor: 'border-emerald-200/60 dark:border-emerald-800/60',
      stats: [
        { label: 'Allocation Drift', value: '3.2%' },
        { label: 'Rebalance Needed', value: 'Yes' },
      ],
    },
    {
      name: 'Custom Reports',
      description: 'Build custom reports with drag-and-drop interface and advanced visualizations',
      href: '/reports',
      icon: BarChart3,
      color: 'from-purple-500 to-violet-600',
      iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
      borderColor: 'border-purple-200/60 dark:border-purple-800/60',
      stats: [
        { label: 'Saved Reports', value: '12' },
        { label: 'Templates', value: '8' },
      ],
    },
  ]

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Analytics Hub
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-sm text-foreground/60 mt-0.5"
              >
                Comprehensive insights and advanced analytics for your portfolio
              </motion.p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-foreground/70">View Mode:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Portfolio', value: 'portfolio' },
                  { label: 'Individual Fund', value: 'fund' },
                  { label: 'Asset Class', value: 'assetClass' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilterMode(option.value as typeof filterMode)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      filterMode === option.value
                        ? 'bg-foreground text-background'
                        : 'bg-slate-100 dark:bg-slate-800 text-foreground/70 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {filterMode === 'fund' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Fund</label>
                <select
                  value={selectedFundId}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                  className="w-full md:w-80 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
                >
                  <option value="all">All Funds</option>
                  {funds.map((fund) => (
                    <option key={fund.id} value={fund.id}>
                      {fund.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterMode === 'assetClass' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Asset Class</label>
                <select
                  value={selectedAssetClass}
                  onChange={(e) => setSelectedAssetClass(e.target.value)}
                  className="w-full md:w-80 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
                >
                  <option value="all">All Asset Classes</option>
                  {assetClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <p className="text-xs text-foreground/60">
              Showing{' '}
              {filterMode === 'fund' && selectedFundId !== 'all'
                ? selectedFundName
                : filterMode === 'assetClass' && selectedAssetClass !== 'all'
                ? `${selectedAssetClass} exposure`
                : 'entire portfolio'}
              .
            </p>
          </div>
        </motion.div>

        {/* Quick Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Portfolio Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickInsights.map((insight, index) => {
              const Icon = insight.icon
              return (
                <motion.div
                  key={insight.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  className={`bg-gradient-to-br ${
                    insight.color === 'blue'
                      ? 'from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 border-blue-200/60 dark:border-blue-800/60'
                      : insight.color === 'emerald'
                      ? 'from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 border-emerald-200/60 dark:border-emerald-800/60'
                      : insight.color === 'orange'
                      ? 'from-orange-500/10 to-orange-600/5 dark:from-orange-500/20 dark:to-orange-600/10 border-orange-200/60 dark:border-orange-800/60'
                      : 'from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10 border-purple-200/60 dark:border-purple-800/60'
                  } rounded-xl border p-4`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-5 h-5 text-foreground/70" />
                    <span className={`text-xs font-medium ${
                      insight.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {insight.trend}
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground mb-1">{insight.value}</p>
                    <p className="text-xs text-foreground/60">{insight.label}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Cash Flow Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Cash Flow Snapshot</h2>
              <p className="text-sm text-foreground/60">
                Rolling 12-month view of capital activity across your portfolio
              </p>
            </div>
            <Link
              href="/cash-flow"
              className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              Open cash flow workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-white/80 dark:bg-surface p-4">
              <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">Capital Calls</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {currentCashFlowSnapshot.totalCapitalCalls > 0
                  ? formatCurrency(-currentCashFlowSnapshot.totalCapitalCalls)
                  : formatCurrency(0)}
              </p>
              <p className="text-xs text-foreground/50 mt-1">Rolling 12 months</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/80 dark:bg-surface p-4">
              <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">Distributions</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(currentCashFlowSnapshot.totalDistributions)}
              </p>
              <p className="text-xs text-foreground/50 mt-1">Rolling 12 months</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/80 dark:bg-surface p-4">
              <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">Net Cash Flow</p>
              <p
                className={`text-2xl font-bold ${
                  currentCashFlowSnapshot.netCashFlow >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatCurrency(currentCashFlowSnapshot.netCashFlow)}
              </p>
              <p className="text-xs text-foreground/50 mt-1">
                {currentCashFlowSnapshot.netCashFlow >= 0 ? 'Net inflow' : 'Net outflow'}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/80 dark:bg-surface p-4">
              <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">Pending Calls</p>
              <p className="text-2xl font-bold text-foreground">
                {currentCashFlowSnapshot.pendingCallsCount}
                <span className="text-sm text-foreground/50 ml-1">open</span>
              </p>
              <p className="text-xs text-foreground/50 mt-1">
                {currentCashFlowSnapshot.pendingCallsCount > 0
                  ? formatCurrency(-currentCashFlowSnapshot.pendingCallsAmount)
                  : 'No outstanding obligations'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <div className="xl:col-span-2 rounded-2xl border border-border bg-white dark:bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Monthly net flows</h3>
                <span className="text-xs text-foreground/50">Last 12 months</span>
              </div>
              <div className="grid grid-cols-4 text-xs uppercase tracking-wide text-foreground/50 border-b border-border pb-2">
                <span>Month</span>
                <span className="text-right">Calls</span>
                <span className="text-right">Distributions</span>
                <span className="text-right">Net</span>
              </div>
              <div className="divide-y divide-border">
                {currentCashFlowSnapshot.monthlySeries.slice(-6).map((data) => (
                  <div key={data.month} className="grid grid-cols-4 py-3 text-sm">
                    <span className="font-medium text-foreground">{data.month}</span>
                    <span className="text-right text-rose-500">
                      {data.capitalCalls > 0 ? formatCurrency(-data.capitalCalls) : '—'}
                    </span>
                    <span className="text-right text-emerald-600 dark:text-emerald-400">
                      {data.distributions > 0 ? formatCurrency(data.distributions) : '—'}
                    </span>
                    <span
                      className={`text-right font-semibold ${
                        data.net >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-500 dark:text-rose-400'
                      }`}
                    >
                      {data.net !== 0 ? formatCurrency(data.net) : '—'}
                    </span>
                  </div>
                ))}
                {currentCashFlowSnapshot.monthlySeries.slice(-6).length === 0 && (
                  <p className="text-sm text-foreground/50 text-center py-6">No cash flow activity yet</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white dark:bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Pending capital calls</h3>
                <Link
                  href="/cash-flow"
                  className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                >
                  Manage
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {currentCashFlowSnapshot.pendingCalls.length > 0 ? (
                  currentCashFlowSnapshot.pendingCalls.map((call) => (
                    <div
                      key={call.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40"
                    >
                      <p className="text-sm font-medium text-foreground">{call.fundName}</p>
                      <p className="text-xs text-foreground/60 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        Due {new Date(call.dueDate).toLocaleDateString()}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(-(call.amount || 0))}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            call.status === 'PENDING'
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              : call.status === 'OVERDUE' || call.status === 'LATE'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {call.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-foreground/50 text-center py-8">
                    All capital calls are up to date
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analytics Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Analytics Tools</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analyticsFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                >
                  <Link
                    href={feature.href}
                    className={`group block bg-white dark:bg-surface rounded-2xl border ${feature.borderColor} p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-foreground/70" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-accent group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{feature.name}</h3>
                    <p className="text-sm text-foreground/60 mb-4">{feature.description}</p>
                    <div className="flex gap-4 pt-4 border-t border-border">
                      {feature.stats.map((stat) => (
                        <div key={stat.label}>
                          <p className="text-xs text-foreground/50">{stat.label}</p>
                          <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Recent Capital Calls */}
          <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Recent Capital Calls</h3>
              <Link
                href="/cash-flow"
                className="text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {currentRecentActivity.capitalCalls.slice(0, 3).map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{call.fundName}</p>
                    <p className="text-xs text-foreground/60 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {call.dueDate ? `Due ${new Date(call.dueDate).toLocaleDateString()}` : call.uploadDate ? `Uploaded ${new Date(call.uploadDate).toLocaleDateString()}` : 'No date'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatCurrency(call.amount || 0)}</p>
                  </div>
                </div>
              ))}
              {currentRecentActivity.capitalCalls.length === 0 && (
                <p className="text-sm text-foreground/50 text-center py-8">No recent capital calls</p>
              )}
            </div>
          </div>

          {/* Recent Distributions */}
          <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Recent Distributions</h3>
              <Link
                href="/cash-flow"
                className="text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {currentRecentActivity.distributions.slice(0, 3).map((dist) => (
                <div
                  key={dist.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/60"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{dist.fundName}</p>
                    <p className="text-xs text-foreground/60 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {dist.distributionDate ? new Date(dist.distributionDate).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(dist.amount)}
                    </p>
                  </div>
                </div>
              ))}
              {currentRecentActivity.distributions.length === 0 && (
                <p className="text-sm text-foreground/50 text-center py-8">No recent distributions</p>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
