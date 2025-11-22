'use client'

import { useState, useMemo } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { FundCard } from '@/components/FundCard'
import { FundSnapshotCard } from '@/components/FundSnapshotCard'
import { formatCurrency, formatMultiple, formatPercent } from '@/lib/utils'
import Link from 'next/link'
import { Plus, TrendingUp, Briefcase, DollarSign, AlertCircle, FileText, Users, Building2, ArrowUpRight, Zap } from 'lucide-react'
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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

          {/* Allocation Snapshot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl font-bold mb-6">Allocation Snapshot</h2>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-surface rounded-2xl shadow-sm border border-border dark:border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Manager Mix</h3>
                {managerSeries.length ? (
                  <>
                    <ResponsiveContainer width="100%" height={360}>
                      <PieChart>
                        <Pie
                          data={managerSeries}
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          dataKey="value"
                          paddingAngle={managerSeries.length > 4 ? 2 : 0}
                        >
                          {managerSeries.map((entry, index) => (
                            <Cell key={`manager-slice-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, _name: string, entry: any) => [
                            `${formatPercent(entry?.payload?.percentage ?? 0, 1)} (${formatCurrency(value as number)})`,
                            entry?.name,
                          ]}
                          contentStyle={tooltipStyles}
                          labelStyle={tooltipLabelStyle}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {managerSeries.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-xl px-3 py-2 border border-border/60"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="truncate w-28 font-semibold">{item.name}</span>
                          </div>
                          <span className="font-semibold text-foreground/80">
                            {formatPercent(item.percentage, 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                    No committed funds yet.
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-surface rounded-2xl shadow-sm border border-border dark:border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Asset Class Exposure</h3>
                {assetClassSeries.length ? (
                  <>
                    <ResponsiveContainer width="100%" height={420}>
                      <RadarChart data={assetClassSeries}>
                        <PolarGrid stroke="#CBD5F5" />
                        <PolarAngleAxis
                          dataKey="name"
                          tick={{ fill: '#f8fafc', fontSize: 15, fontWeight: 600 }}
                          tickMargin={18}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          stroke="#94a3b8"
                          tick={{ fill: '#f8fafc', fontSize: 12, fontWeight: 500 }}
                          tickFormatter={(value) => `${value.toFixed(0)}%`}
                        />
                        <Radar
                          name="Exposure"
                          dataKey="percentage"
                          stroke="#4b6c9c"
                          fill="#4b6c9c"
                          fillOpacity={0.3}
                        />
                        <Tooltip
                          formatter={(value: number) => formatPercent(value as number, 1)}
                          contentStyle={tooltipStyles}
                          labelStyle={tooltipLabelStyle}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-white">
                      {assetClassSeries.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-xl px-3 py-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        >
                          <span className="font-semibold">{item.name}</span>
                          <span>{formatPercent(item.percentage, 1)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                    Asset class data unavailable.
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-surface rounded-2xl shadow-sm border border-border dark:border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Geographic Split</h3>
                {geographySeries.length ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={geographySeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} stroke="#6b7280" />
                        <YAxis
                          stroke="#6b7280"
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
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/70">
                      {geographySeries.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/40"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            {item.name}
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatPercent(item.percentage, 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                    No geographic data available.
                  </div>
                )}
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
