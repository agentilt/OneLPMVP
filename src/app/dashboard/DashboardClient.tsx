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
  Clock,
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
  Legend,
  Line,
  LineChart,
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

          {/* Key Performance Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mb-10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-lg p-5 hover:border-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-foreground/70" />
                  </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                        Total AUM
                  </div>
                      <div className="text-2xl font-bold text-foreground mt-1">
                        {formatCurrency(portfolioSummary.combinedNav)}
                </div>
                </div>
                </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/60">Commitment</span>
                  <span className="font-semibold text-foreground/80">{formatCurrency(portfolioSummary.combinedCommitment)}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-lg p-5 hover:border-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-foreground/70" />
                  </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                        Fund Portfolio TVPI
                      </div>
                      <div className="text-2xl font-bold text-foreground mt-1">
                        {formatMultiple(portfolioSummary.combinedTvpi)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/60">Scope</span>
                  <span className="font-semibold text-foreground/80">Funds only (excludes directs)</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-lg p-5 hover:border-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Gauge className="w-5 h-5 text-foreground/70" />
                  </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                        DPI Progress
                </div>
                      <div className="text-2xl font-bold text-foreground mt-1">
                        {formatPercent(dpiProgress.pct * 100, 0)}
                </div>
                </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/60">Returned</span>
                  <span className="font-semibold text-foreground/80">{formatCurrency(dpiProgress.returned)}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.4 }}
                className="bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-lg p-5 hover:border-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-foreground/70" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                        Capital Calls
                      </div>
                      <div className="text-2xl font-bold text-foreground mt-1">
                        {portfolioSummary.activeCapitalCalls}
                      </div>
                    </div>
                  </div>
                  {portfolioSummary.activeCapitalCalls > 0 && (
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1"></div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/60">Amount Due</span>
                  <span className="font-semibold text-foreground/80">{formatCurrency(capitalCallStats.dueSoon + capitalCallStats.overdue)}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Portfolio Analytics - Full Width Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Portfolio Analytics</h2>
              <Link
                href="/analytics"
                className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
              >
                View Detailed Analytics
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* NAV Trajectory - Full Width */}
            <div className={`${panelBase} mb-6`}>
              <div className={panelHeader}>
                <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <LineChartIcon className="w-5 h-5 text-accent" />
                          </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Portfolio NAV Trajectory</h3>
                      <p className="text-xs text-foreground/60 mt-0.5">12-month rolling net asset value</p>
                        </div>
                    </div>
                  <div className="text-right">
                    <p className="text-xs text-foreground/60">Current NAV</p>
                    <p className="text-xl font-bold text-accent">{formatCurrency(portfolioSummary.combinedNav)}</p>
                  </div>
              </div>
              </div>
              <div className="p-6">
                {portfolioNavSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={portfolioNavSeries}>
                      <defs>
                        <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
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
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
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
                        stroke="#6366f1"
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

            {/* Performance & Signals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Portfolio Concentration & Insights */}
              <div className={`${panelBase} flex flex-col h-full`}>
                <div className={panelHeader}>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <PieChartIcon className="w-5 h-5 text-foreground/70" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Portfolio Concentration</h3>
                      <p className="text-xs text-foreground/60 mt-0.5">Asset class exposure & alerts</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  {assetClassSeries.length > 0 ? (
                    <div className="mb-6 flex flex-col lg:flex-row items-stretch gap-6">
                      <div className="flex-1 flex items-center justify-center" style={{ minHeight: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                              data={assetClassSeries}
                          cx="50%"
                          cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={2}
                          dataKey="value"
                        >
                              {assetClassSeries.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
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
                    <div className="h-48 flex items-center justify-center text-sm text-foreground/60">
                      No asset class data available
                  </div>
                )}

                  <div className="border-t border-border my-4" />

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Requires Attention
                    </h4>

                    {underperformingFundCount > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-5 h-5 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-red-600 dark:text-red-400 font-bold">!</span>
              </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            {underperformingFundCount} fund{underperformingFundCount !== 1 ? 's' : ''} below 1.5x TVPI
                          </p>
                          <Link href="/funds" className="text-foreground/60 hover:text-accent transition-colors">
                            View underperformers →
                          </Link>
                        </div>
                      </div>
                    )}

                    {staleValuationCount > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-5 h-5 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            {staleValuationCount} fund{staleValuationCount !== 1 ? 's' : ''} without NAV update (90d+)
                          </p>
                          <Link href="/funds" className="text-foreground/60 hover:text-accent transition-colors">
                            Review stale valuations →
                          </Link>
                    </div>
                  </div>
                )}

                    {dpiProgress.returned > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <DollarSign className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">
                            {formatCurrency(dpiProgress.returned)} total distributions
                          </p>
                          <p className="text-foreground/60">
                            {formatPercent(dpiProgress.pct * 100, 0)} of paid-in capital returned
                          </p>
                        </div>
                      </div>
                    )}

                    {underperformingFundCount === 0 && staleValuationCount === 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">Portfolio performing well</p>
                          <p className="text-foreground/60">All funds meeting targets</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fund Performance Metrics Comparison */}
              <div className={`${panelBase} flex flex-col h-full`}>
                <div className={panelHeader}>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <BarChartIcon className="w-5 h-5 text-foreground/70" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Cash Returned (DPI)</h3>
                      <p className="text-xs text-foreground/60 mt-0.5">Top funds by realized returns</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1 flex items-center" style={{ minHeight: 0 }}>
                  {funds.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minHeight={250} maxHeight={400}>
                      <BarChart
                        data={funds
                          .slice()
                          .sort((a, b) => b.dpi - a.dpi)
                          .slice(0, 4)
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
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          interval={0}
                        />
                        <YAxis
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                          tickFormatter={(value) => `${value.toFixed(1)}x`}
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
                        <Bar dataKey="DPI" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                      No performance data available.
                    </div>
                  )}
                </div>
              </div>

              {/* Liquidity Monitor */}
              <div className={`${panelBase} flex flex-col h-full`}>
                <div className={panelHeader}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Droplet className="w-5 h-5 text-foreground/70" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Liquidity Monitor</h3>
                        <p className="text-xs text-foreground/60 mt-0.5">Capital call obligations</p>
                      </div>
                    </div>
                    <Link href="/capital-calls" className="text-xs text-accent hover:text-accent-hover font-semibold">
                      View All
                    </Link>
                  </div>
                </div>
                <div className="p-0 flex-1 flex flex-col">
                  <div className="overflow-hidden flex-1 flex flex-col">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-border text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                      <div>Status</div>
                      <div className="text-right w-20">Count</div>
                      <div className="text-right w-24">Amount</div>
                      <div className="text-right w-16">% NAV</div>
                    </div>
                    
                    {/* Data Rows */}
                    <div className="flex-1">
                      {/* Overdue Row */}
                      {capitalCallStats.overdue > 0 && (
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-sm font-medium text-foreground">Overdue</span>
                          </div>
                          <div className="w-20 flex items-center justify-end">
                            <span className="text-sm text-foreground/70 font-mono">{capitalCallStats.countOverdue}</span>
                          </div>
                          <div className="w-24 flex items-center justify-end" title={formatCurrency(capitalCallStats.overdue)}>
                            <span className="text-sm text-foreground/70 font-mono">
                              {(capitalCallStats.overdue / 1000000).toFixed(1)}M
                          </span>
                          </div>
                          <div className="w-16 flex items-center justify-end">
                            <span className="text-sm font-semibold text-foreground tabular-nums">
                              {formatPercent(capitalCallStats.percentOverdue, 1)}
                          </span>
                        </div>
                  </div>
                )}

                      {/* Due 0-14 Days */}
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="text-sm font-medium text-foreground">Due 0-14 Days</span>
                        </div>
                        <div className="w-20 flex items-center justify-end">
                          <span className="text-sm text-foreground/70 font-mono">—</span>
                        </div>
                        <div className="w-24 flex items-center justify-end">
                          <span className="text-sm text-foreground/70 font-mono">—</span>
                        </div>
                        <div className="w-16 flex items-center justify-end">
                          <span className="text-sm text-foreground/60 tabular-nums">—</span>
                        </div>
                      </div>

                      {/* Due 15-30 Days */}
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          <span className="text-sm font-medium text-foreground">Due 15-30 Days</span>
                        </div>
                        <div className="w-20 flex items-center justify-end">
                          <span className="text-sm text-foreground/70 font-mono">{capitalCallStats.countDueSoon}</span>
                        </div>
                        <div className="w-24 flex items-center justify-end" title={formatCurrency(capitalCallStats.dueSoon)}>
                          <span className="text-sm text-foreground/70 font-mono">
                            {(capitalCallStats.dueSoon / 1000000).toFixed(1)}M
                          </span>
                        </div>
                        <div className="w-16 flex items-center justify-end">
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            {formatPercent(capitalCallStats.percentDueSoon, 1)}
                          </span>
                        </div>
                      </div>

                      {/* Due 31-60 Days */}
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium text-foreground">Due 31-60 Days</span>
                        </div>
                        <div className="w-20 flex items-center justify-end">
                          <span className="text-sm text-foreground/70 font-mono">—</span>
                        </div>
                        <div className="w-24 flex items-center justify-end">
                          <span className="text-sm text-foreground/70 font-mono">—</span>
                        </div>
                        <div className="w-16 flex items-center justify-end">
                          <span className="text-sm text-foreground/60 tabular-nums">—</span>
                        </div>
                      </div>

                      {/* Due 60+ Days */}
                      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                          <span className="text-sm font-medium text-foreground">Due 60+ Days</span>
                        </div>
                        <div className="w-20 flex items-center justify-end">
                          <span className="text-sm text-foreground/70 font-mono">—</span>
                        </div>
                        <div className="w-24 flex items-center justify-end">
                          <span className="text-sm text-foreground/70 font-mono">—</span>
                        </div>
                        <div className="w-16 flex items-center justify-end">
                          <span className="text-sm text-foreground/60 tabular-nums">—</span>
                        </div>
                      </div>
                    </div>

                    {/* Summary Row */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 mt-auto">
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-foreground">Total</span>
                      </div>
                      <div className="w-20 flex items-center justify-end">
                        <span className="text-sm font-bold text-foreground">
                          {capitalCallStats.countDueSoon + capitalCallStats.countOverdue}
                        </span>
                      </div>
                      <div className="w-24 flex items-center justify-end" title={formatCurrency(capitalCallStats.dueSoon + capitalCallStats.overdue)}>
                        <span className="text-sm font-bold text-foreground font-mono">
                          {((capitalCallStats.dueSoon + capitalCallStats.overdue) / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <div className="w-16 flex items-center justify-end">
                        <span className="text-sm font-bold text-foreground tabular-nums">
                          {formatPercent(capitalCallStats.percentDueSoon + capitalCallStats.percentOverdue, 1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Top Performing Funds */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Top Performing Funds</h2>
              <Link
                href="/funds"
                className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
              >
                View All Funds
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className={panelBase}>
              <div className={panelHeader}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-foreground/70" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Ranked by TVPI</h3>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        Top {Math.min(8, funds.length)} fund{Math.min(8, funds.length) !== 1 ? 's' : ''} by total value multiple
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-0">
            {funds.length > 0 ? (
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-border text-xs font-semibold text-foreground/70 uppercase tracking-wider">
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
                          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
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
          </motion.div>

          {/* Top Performing Direct Investments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Top Performing Direct Investments</h2>
              <Link
                href="/direct-investments"
                className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
              >
                View All Investments
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className={panelBase}>
              <div className={panelHeader}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-foreground/70" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Ranked by Value Growth</h3>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        Top {Math.min(8, directInvestments.length)} investment{Math.min(8, directInvestments.length) !== 1 ? 's' : ''} by current value
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-0">
            {directInvestments.length > 0 ? (
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-border text-xs font-semibold text-foreground/70 uppercase tracking-wider">
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
                            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
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
          </motion.div>

          {/* Legacy Card Section - Hidden */}
          <div className="hidden">
            {directInvestments.length > 0 && (
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
              </>
            )}
          </div>


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
