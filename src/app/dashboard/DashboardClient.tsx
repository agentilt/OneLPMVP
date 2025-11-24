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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-500/10 border border-blue-200/50 dark:border-blue-500/30 rounded-2xl p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-bold px-2 py-1 bg-blue-500/10 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    +8.2%
                  </div>
                </div>
                <div className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2">
                  Total AUM
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {formatCurrency(portfolioSummary.combinedNav)}
                </div>
                <div className="text-xs text-foreground/60">
                  of {formatCurrency(portfolioSummary.combinedCommitment)} committed
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/30 rounded-2xl p-6 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-1 bg-emerald-500/10 rounded-full">
                    <ArrowUpRight className="w-3 h-3" />
                    Top Quartile
                  </div>
                </div>
                <div className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2">
                  Portfolio TVPI
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {formatMultiple(portfolioSummary.combinedTvpi)}
                </div>
                <div className="text-xs text-foreground/60">
                  Fund TVPI {formatMultiple(portfolioSummary.fundTvpi)}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-500/20 dark:via-purple-500/10 border border-purple-200/50 dark:border-purple-500/30 rounded-2xl p-6 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Gauge className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2">
                  DPI Progress
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {formatPercent(dpiProgress.pct * 100, 0)}
                </div>
                <div className="text-xs text-foreground/60">
                  {formatCurrency(dpiProgress.returned)} returned
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.4 }}
                className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent dark:from-orange-500/20 dark:via-orange-500/10 border border-orange-200/50 dark:border-orange-500/30 rounded-2xl p-6 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  {portfolioSummary.activeCapitalCalls > 0 && (
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-lg shadow-orange-500/50"></div>
                  )}
                </div>
                <div className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2">
                  Capital Calls
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {portfolioSummary.activeCapitalCalls}
                </div>
                <div className="text-xs text-foreground/60">
                  {formatCurrency(capitalCallStats.dueSoon + capitalCallStats.overdue)} due
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
              {/* Top Performers */}
              <div className={panelBase}>
                <div className={panelHeader}>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Top Performing Funds</h3>
                      <p className="text-xs text-foreground/60 mt-0.5">Ranked by TVPI multiple</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {funds.length > 0 ? (
                    <div className="space-y-2">
                      {funds
                        .slice()
                        .sort((a, b) => b.tvpi - a.tvpi)
                        .slice(0, 5)
                        .map((fund, index) => (
                          <Link
                            key={fund.id}
                            href={`/funds/${fund.id}`}
                            className="block group"
                          >
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-accent/20">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent/80 text-white font-bold text-xs shadow-md shadow-accent/20">
                                #{index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate group-hover:text-accent transition-colors">
                                  {fund.name}
                                </p>
                                <p className="text-xs text-foreground/60">
                                  {fund.vintage} • {formatCurrency(fund.nav)}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatMultiple(fund.tvpi)}
                                </p>
                                <p className="text-xs text-foreground/60">TVPI</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                      No funds to display.
                    </div>
                  )}
                </div>
              </div>

              {/* Fund Performance Metrics Comparison */}
              <div className={panelBase}>
                <div className={panelHeader}>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <BarChartIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Performance Metrics</h3>
                      <p className="text-xs text-foreground/60 mt-0.5">Top funds by TVPI & DPI</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {funds.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={funds
                          .slice()
                          .sort((a, b) => b.tvpi - a.tvpi)
                          .slice(0, 5)
                          .map((fund) => ({
                            name: fund.name.length > 12 ? fund.name.substring(0, 12) + '...' : fund.name,
                            TVPI: fund.tvpi,
                            DPI: fund.dpi,
                          }))}
                        margin={{ top: 10, right: 10, left: 10, bottom: 55 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          interval={0}
                        />
                        <YAxis
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                          tickFormatter={(value) => `${value.toFixed(1)}x`}
                        />
                        <Tooltip
                          formatter={(value: number) => formatMultiple(value)}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                          labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }}
                          iconType="circle"
                          iconSize={8}
                        />
                        <Bar dataKey="TVPI" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={35} />
                        <Bar dataKey="DPI" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={35} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                      No performance data available.
                    </div>
                  )}
                </div>
              </div>

              {/* Liquidity Monitor */}
              <div className={panelBase}>
                <div className={panelHeader}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Droplet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
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
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20">
                    <div>
                      <p className="text-xs text-foreground/60 mb-1">Due Within 30 Days</p>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(capitalCallStats.dueSoon)}</p>
                      <p className="text-xs text-foreground/60 mt-1">{capitalCallStats.countDueSoon} calls</p>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {formatPercent(capitalCallStats.percentDueSoon, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {capitalCallStats.overdue > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20">
                      <div>
                        <p className="text-xs text-foreground/60 mb-1">Overdue</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(capitalCallStats.overdue)}</p>
                        <p className="text-xs text-foreground/60 mt-1">{capitalCallStats.countOverdue} calls</p>
                      </div>
                      <div className="text-right">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Holdings Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Holdings Overview</h2>
            </div>

            {/* Fund Investments */}
            <div className={panelBase}>
              <div className={panelHeader}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Fund Investments</h3>
                      <p className="text-xs text-foreground/60 mt-0.5">{funds.length} active funds</p>
                    </div>
                  </div>
                  <Link
                    href="/funds"
                    className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
                  >
                    View All
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
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
              </div>
            </div>
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
