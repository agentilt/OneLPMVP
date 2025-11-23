'use client'

import { useState, useMemo } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { FundCard } from '@/components/FundCard'
import { FundSnapshotCard } from '@/components/FundSnapshotCard'
import { formatCurrency, formatMultiple, formatPercent, formatDate } from '@/lib/utils'
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
  Zap,
  Droplet,
  Gauge,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from 'lucide-react'
import { DirectInvestmentCard } from '@/components/DirectInvestmentCard'
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
      .map(([date, value]) => ({ date, value }))
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

  const panelBase =
    'bg-white dark:bg-surface rounded-2xl shadow-sm border border-border dark:border-slate-800 overflow-hidden'
  const panelHeader =
    'bg-gradient-to-r from-accent/10 via-accent/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 justify-between'

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6 lg:p-8">
          {/* Animated Greeting */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
             
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    Welcome back, {userFirstName}
                  </motion.span>
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-sm text-foreground/60 mt-0.5"
                >
                  Here's your portfolio performance summary
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Admin link */}
          {userRole === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-6"
            >
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Building2 className="w-5 h-5" />
                Admin Panel
                <ArrowUpRight className="w-4 h-4 ml-auto" />
              </Link>
            </motion.div>
          )}

          {/* Data Manager link */}
          {userRole === 'DATA_MANAGER' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-6"
            >
              <Link
                href="/data-manager"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Users className="w-5 h-5" />
                Data Manager
                <ArrowUpRight className="w-4 h-4 ml-auto" />
              </Link>
            </motion.div>
          )}

          {/* Portfolio Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-6">Portfolio Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-5 hover:shadow-md hover:border-accent/40 transition-all duration-150"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1">
                  Total Commitments
                </div>
                <div className="text-2xl font-semibold">
                  {formatCurrency(portfolioSummary.combinedCommitment)}
                </div>
                <div className="text-xs text-foreground/50 mt-2">
                  Funds {formatCurrency(portfolioSummary.fundCommitment)} • Direct{' '}
                  {formatCurrency(portfolioSummary.directInvestmentAmount)}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-5 hover:shadow-md hover:border-accent/40 transition-all duration-150"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1">
                  Total NAV
                </div>
                <div className="text-2xl font-semibold">
                  {formatCurrency(portfolioSummary.combinedNav)}
                </div>
                <div className="text-xs text-foreground/50 mt-2">
                  Funds {formatCurrency(portfolioSummary.fundNav)} • Direct{' '}
                  {formatCurrency(portfolioSummary.directInvestmentValue)}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-5 hover:shadow-md hover:border-accent/40 transition-all duration-150"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  
                </div>
                <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1">
                  Portfolio TVPI
                </div>
                <div className="text-2xl font-semibold">
                  {formatMultiple(portfolioSummary.combinedTvpi)}
                </div>
                <div className="text-xs text-foreground/50 mt-2">
                  Funds {formatMultiple(portfolioSummary.fundTvpi)}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.4 }}
                className="bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-5 hover:shadow-md hover:border-accent/40 transition-all duration-150"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  {portfolioSummary.activeCapitalCalls > 0 && (
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  )}
                </div>
                <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1">
                  Active Capital Calls
                </div>
                <div className="text-2xl font-semibold">
                  {portfolioSummary.activeCapitalCalls}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* First-Glance Signals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl font-bold mb-6">Portfolio Signals</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`${panelBase} h-full`}>
                <div className={panelHeader}>
                  <div className="flex items-center gap-2">
                    <LineChartIcon className="w-5 h-5 text-accent" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground leading-none">NAV Trend</h3>
                      <p className="text-xs text-foreground/60">Last 12 periods</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 font-semibold">
                    {portfolioNavSeries.length ? formatCurrency(portfolioNavSeries.at(-1)?.value || 0) : '—'}
                  </span>
                </div>
                <div className="p-6">
                {portfolioNavSeries.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={portfolioNavSeries}>
                      <defs>
                        <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={(value) => value.slice(5)}
                        stroke="#cbd5e1"
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={(v) => (v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : `${Math.round(v/1_000)}K`)}
                        stroke="#cbd5e1"
                      />
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(value: string) => formatDate(new Date(value))}
                        contentStyle={tooltipStyles}
                        labelStyle={tooltipLabelStyle}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#navGradient)"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                    NAV history unavailable
                  </div>
                )}
                </div>
              </div>

              <div className={`${panelBase} h-full`}>
                <div className={panelHeader}>
                  <div className="flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-accent" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground leading-none">Liquidity & Calls</h3>
                      <p className="text-xs text-foreground/60">Next 30 days</p>
                    </div>
                  </div>
                  <Link href="/capital-calls" className="text-xs text-accent hover:text-accent-hover font-semibold">
                    View details
                  </Link>
                </div>
                <div className="p-6 space-y-3 text-sm min-h-[220px]">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/70">Due soon (≤30d)</span>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">{formatCurrency(capitalCallStats.dueSoon)}</div>
                      <div className="text-xs text-foreground/60">{formatPercent(capitalCallStats.percentDueSoon, 1)} of NAV</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/70">Overdue</span>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">{formatCurrency(capitalCallStats.overdue)}</div>
                      <div className="text-xs text-foreground/60">{formatPercent(capitalCallStats.percentOverdue, 1)} of NAV</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                        style={{
                          width: `${Math.min(
                            ((capitalCallStats.dueSoon + capitalCallStats.overdue) /
                              Math.max(portfolioSummary.combinedNav, 1)) *
                              100,
                            100
                          ).toFixed(1)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-foreground/60">as % of NAV</span>
                  </div>
                  <div className="text-xs text-foreground/60">
                    {capitalCallStats.countDueSoon} due soon • {capitalCallStats.countOverdue} overdue
                  </div>
                </div>
              </div>

              <div className={`${panelBase} h-full`}>
                <div className={panelHeader}>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-accent" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground leading-none">DPI Progress</h3>
                      <p className="text-xs text-foreground/60">Cash returned vs paid-in</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 min-h-[220px] flex flex-col gap-3">
                  <div className="text-3xl font-bold text-foreground">
                    {formatPercent(dpiProgress.pct * 100, 0)}
                  </div>
                  <div className="text-sm text-foreground/60">
                    Returned {formatCurrency(dpiProgress.returned)} / Paid-in {formatCurrency(dpiProgress.paidIn)}
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                      style={{ width: `${Math.min(dpiProgress.pct * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-foreground/50">Includes funds only (directs excluded from DPI)</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Allocation Snapshot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl font-bold mb-6">Allocation Snapshot</h2>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className={panelBase}>
                <div className={panelHeader}>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <PieChartIcon className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Manager Mix</h3>
                  </div>
                </div>
                <div className="p-6">
                {managerSeries.length ? (
                  <>
                    <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-6 items-center">
                      <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={managerSeries}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={110}
                              dataKey="percentage"
                              paddingAngle={managerSeries.length > 4 ? 2 : 0}
                              stroke="none"
                            >
                              {managerSeries.map((entry, index) => (
                                <Cell key={`manager-slice-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number, _name: string, entry: any) => [
                                `${formatPercent(value as number, 1)}`,
                                entry?.name,
                              ]}
                              contentStyle={tooltipStyles}
                              labelStyle={tooltipLabelStyle}
                              itemStyle={{ color: '#f8fafc' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-1 gap-3 text-xs">
                        {managerSeries.map((item, index) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/30"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="truncate w-32 font-semibold">{item.name}</span>
                            </div>
                            <span className="font-semibold text-foreground/80">
                              {formatPercent(item.percentage, 1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                    No committed funds yet.
                  </div>
                )}
                </div>
              </div>

              <div className={panelBase}>
                <div className={panelHeader}>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <BarChartIcon className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Asset Class Exposure</h3>
                  </div>
                </div>
                <div className="p-6">
                {assetClassSeries.length ? (
                  <>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart layout="vertical" data={assetClassSeries}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.08} stroke="#cbd5e1" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          tickFormatter={(value) => `${value.toFixed(0)}%`}
                          stroke="#cbd5e1"
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12, fill: '#475569' }}
                          width={120}
                        />
                        <Tooltip
                          formatter={(value: number) => `${formatPercent(value as number, 1)}`}
                          contentStyle={tooltipStyles}
                          labelStyle={tooltipLabelStyle}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                        <Bar dataKey="percentage" radius={[8, 8, 8, 8]}>
                          {assetClassSeries.map((entry, index) => (
                            <Cell key={`asset-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                    Asset class data unavailable.
                  </div>
                )}
                </div>
              </div>

              <div className={panelBase}>
                <div className={panelHeader}>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <BarChartIcon className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Geographic Split</h3>
                  </div>
                </div>
                <div className="p-6">
                {geographySeries.length ? (
                  <>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={geographySeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} stroke="#cbd5e1" />
                        <YAxis
                          stroke="#cbd5e1"
                          tick={{ fill: '#475569' }}
                          tickFormatter={(value) => `${value.toFixed(0)}%`}
                        />
                        <Tooltip
                          formatter={(value: number) =>
                            `${formatPercent(value as number, 1)} (${formatCurrency(
                              (value * portfolioSummary.fundNav) / 100
                            )})`
                          }
                          contentStyle={tooltipStyles}
                          labelStyle={tooltipLabelStyle}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                        <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                          {geographySeries.map((entry, index) => (
                            <Cell key={`geo-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                    No geographic data available.
                  </div>
                )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Funds Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Fund Investments</h2>
              <div className="flex items-center gap-4">
                <Link
                  href="/funds"
                  className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <div className="text-sm text-foreground/60">
                  {funds.length} {funds.length === 1 ? 'Fund' : 'Funds'}
                </div>
              </div>
            </div>

            {funds.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {funds.slice(0, 3).map((fund, index) => (
                  <motion.div
                    key={fund.id}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.2 + index * 0.1, duration: 0.4 }}
                  >
                    <FundCard {...fund} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-12 text-center">
                <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-foreground font-medium mb-1">No Funds Available</p>
                <p className="text-foreground/60 text-sm">
                  You don't have access to any funds yet. Please contact your fund manager.
                </p>
              </div>
            )}
          </motion.div>

          {/* Direct Investments Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Direct Investments</h2>
              <div className="flex items-center gap-4">
                <Link
                  href="/direct-investments"
                  className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <div className="text-sm text-foreground/60">
                  {directInvestments.length} {directInvestments.length === 1 ? 'Investment' : 'Investments'}
                </div>
              </div>
            </div>
            {directInvestments.length > 0 ? (
              <>
                {/* Direct Investments Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {directInvestments.slice(0, 6).map((investment, index) => (
                    <motion.div
                      key={investment.id}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.3 + index * 0.1, duration: 0.4 }}
                    >
                      <DirectInvestmentCard
                        {...investment}
                        documentCount={investment.documents.length}
                      />
                    </motion.div>
                  ))}
                </div>
                
                {directInvestments.length > 6 && (
                  <div className="mt-6 text-center">
                    <Link
                      href="/direct-investments"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
                    >
                      View All {directInvestments.length} Direct Investments
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-12 text-center">
                <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-foreground font-medium mb-1">No Direct Investments Available</p>
                <p className="text-foreground/60 text-sm">
                  You don't have any direct investments yet.
                </p>
              </div>
            )}
          </motion.div>


          {/* Quick Actions - Only show for admins */}
          {userRole === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.8, duration: 0.4 }}
                >
                  <Link
                    href="/admin/documents/upload"
                    className="group bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-5 hover:shadow-md hover:border-accent/40 transition-all duration-150 block"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center mb-4">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="font-semibold text-base mb-1 group-hover:text-accent transition-colors">
                      Upload Document
                    </div>
                    <div className="text-sm text-foreground/60 leading-relaxed">
                      Upload capital calls, reports, and other documents
                    </div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.9, duration: 0.4 }}
                >
                  <Link
                    href="/admin/users"
                    className="group bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-5 hover:shadow-md hover:border-accent/40 transition-all duration-150 block"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center mb-4">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="font-semibold text-base mb-1 group-hover:text-accent transition-colors">
                      Manage Users
                    </div>
                    <div className="text-sm text-foreground/60 leading-relaxed">
                      Invite users and manage fund access
                    </div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.0, duration: 0.4 }}
                >
                  <Link
                    href="/admin/funds/new"
                    className="group bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-5 hover:shadow-md hover:border-accent/40 transition-all duration-150 block"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                      <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="font-semibold text-base mb-1 group-hover:text-accent transition-colors">
                      Create Fund
                    </div>
                    <div className="text-sm text-foreground/60 leading-relaxed">
                      Add a new fund to the platform
                    </div>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}
