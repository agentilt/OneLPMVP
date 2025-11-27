'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BarChart3,
  Shield,
  TrendingUp,
  Target,
  ArrowRight,
  DollarSign,
  AlertCircle,
  Activity,
  ChevronRight,
  PieChart,
  Zap,
  Clock,
  TrendingDown,
  Gauge,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { formatCurrency, formatMultiple, formatPercent } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPie,
  Pie,
} from 'recharts'

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
  forecastedPendingCalls: number
  pendingCallsGap: number
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

interface AnalyticsClientProps {
  portfolioSummary: PortfolioSummary
  recentActivity: RecentActivity
  cashFlowSnapshot: CashFlowSnapshot
  funds: FundOverview[]
  directInvestments: DirectInvestmentOverview[]
  assetClasses: string[]
}

const COLORS = ['#4b6c9c', '#2d7a5f', '#6d5d8a', '#c77340', '#3b82f6', '#10b981', '#ef4444']

const panelBase =
  'bg-white dark:bg-surface rounded-2xl shadow-sm border border-border dark:border-slate-800 overflow-hidden'
const panelHeader =
  'px-6 py-4 border-b border-border dark:border-slate-800 flex items-center justify-between'

export function AnalyticsClient({
  portfolioSummary,
  recentActivity,
  cashFlowSnapshot,
  funds,
  directInvestments,
  assetClasses,
}: AnalyticsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Calculate asset allocation
  const assetAllocation = useMemo(() => {
    const allocation: Record<string, number> = {}
    
    funds.forEach((fund) => {
      const assetClass = fund.assetClass || 'Multi-Strategy'
      allocation[assetClass] = (allocation[assetClass] || 0) + fund.nav
    })
    
    directInvestments.forEach((di) => {
      const assetClass = di.assetClass || 'Direct Investment'
      allocation[assetClass] = (allocation[assetClass] || 0) + di.currentValue
    })
    
    const total = Object.values(allocation).reduce((sum, val) => sum + val, 0)
    
    return Object.entries(allocation)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [funds, directInvestments])

  // Calculate performance metrics
  const totalAUM = portfolioSummary.totalNav + portfolioSummary.diTotalValue
  const totalInvested = portfolioSummary.totalPaidIn + portfolioSummary.diTotalInvested
  const totalUnrealized = totalAUM - totalInvested + portfolioSummary.totalDistributions
  const realizedGains = portfolioSummary.totalDistributions
  const unrealizedGains = totalAUM - totalInvested
  const moic = totalInvested > 0 ? (totalAUM + portfolioSummary.totalDistributions) / totalInvested : 0

  // Liquidity metrics
  const deploymentRate = portfolioSummary.totalCommitment > 0
    ? (portfolioSummary.totalPaidIn / portfolioSummary.totalCommitment) * 100
    : 0
  const liquidityBuffer = portfolioSummary.unfundedCommitments

  // Recent 6 months cash flow for chart
  const recentCashFlow = cashFlowSnapshot.monthlySeries.slice(-6)

  // Key metrics cards
  const keyMetrics = [
    {
      label: 'Total AUM',
      value: formatCurrency(totalAUM),
      change: '+12.3%',
      changePositive: true,
      icon: DollarSign,
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      subtitle: `${formatCurrency(portfolioSummary.totalNav)} in funds + ${formatCurrency(portfolioSummary.diTotalValue)} in directs`,
    },
    {
      label: 'Portfolio TVPI',
      value: formatMultiple(portfolioSummary.portfolioTvpi),
      change: '+0.15 YoY',
      changePositive: true,
      icon: TrendingUp,
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      subtitle: 'Strong performance trajectory',
    },
    {
      label: 'Unrealized Gains',
      value: formatCurrency(unrealizedGains),
      change: '+18.2%',
      changePositive: true,
      icon: Activity,
      iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      subtitle: formatPercent((unrealizedGains / totalInvested) * 100, 1) + ' markup',
    },
    {
      label: 'Liquidity Position',
      value: formatCurrency(liquidityBuffer),
      change: formatPercent(deploymentRate, 1) + ' deployed',
      changePositive: deploymentRate < 90,
      icon: Gauge,
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      subtitle: 'Unfunded commitments',
    },
  ]

  // Advanced analytics tools
  const analyticsTools = [
    {
      name: 'Risk Management',
      description: 'Monitor concentration risk, stress test scenarios, and track compliance with investment policies',
      href: '/risk',
      icon: Shield,
      gradient: 'from-red-500 to-rose-600',
      metrics: [
        { label: 'Risk Score', value: '7.2/10', status: 'warning' as const },
        { label: 'Policy Violations', value: '2', status: 'error' as const },
      ],
    },
    {
      name: 'Cash Flow Forecasting',
      description: 'Project future capital calls and distributions with scenario modeling and liquidity planning',
      href: '/forecasting',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-indigo-600',
      metrics: [
        { label: 'Next 12M Calls', value: formatCurrency(portfolioSummary.unfundedCommitments * 0.3), status: undefined },
        { label: 'Expected Dist.', value: formatCurrency(portfolioSummary.totalNav * 0.15), status: undefined },
      ],
    },
    {
      name: 'Portfolio Optimization',
      description: 'Build target portfolios, rebalance allocations, and model optimal diversification strategies',
      href: '/portfolio-builder',
      icon: Target,
      gradient: 'from-emerald-500 to-teal-600',
      metrics: [
        { label: 'Allocation Drift', value: '3.2%', status: 'warning' as const },
        { label: 'Target Match', value: '92%', status: 'success' as const },
      ],
    },
    {
      name: 'Custom Reporting',
      description: 'Create custom reports with drag-and-drop builder, advanced filters, and export to PDF/Excel',
      href: '/reports',
      icon: BarChart3,
      gradient: 'from-purple-500 to-violet-600',
      metrics: [
        { label: 'Saved Reports', value: '12', status: undefined },
        { label: 'Available Templates', value: '8', status: undefined },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <motion.div
            initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          className="mb-8"
        >
            <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
                <p className="text-sm font-medium text-foreground/60 uppercase tracking-wide">
                  Analytics
                </p>
                <h1 className="text-3xl font-bold text-foreground mt-1">Analytics Hub</h1>
                <p className="text-sm text-foreground/60 mt-1">
                  Enterprise-grade portfolio intelligence and monitoring
                </p>
              </div>
              <Link
                href="/reports"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-semibold text-foreground hover:border-accent/50 hover:text-accent transition-colors"
              >
                Generate Report
                <ArrowRight className="w-4 h-4" />
              </Link>
          </div>
        </motion.div>

          {/* Key Performance Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Portfolio Performance</h2>
              <span className="text-xs uppercase font-semibold text-foreground/50">
                Updated in real time
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {keyMetrics.map((metric, index) => {
                const Icon = metric.icon
              return (
                <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05, duration: 0.4 }}
                    className="bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-2xl p-5 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${metric.iconBg}`}>
                        <Icon className={`w-5 h-5 ${metric.iconColor}`} />
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                          metric.changePositive
                            ? 'bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100/70 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {metric.change}
                    </span>
                  </div>
                    <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground mb-2">{metric.value}</p>
                    <p className="text-xs text-foreground/60">{metric.subtitle}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

          {/* Portfolio Composition & Cash Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10"
        >
            {/* Asset Allocation */}
            <div className={`${panelBase} lg:col-span-1`}>
              <div className={panelHeader}>
            <div>
                  <h3 className="text-lg font-semibold text-foreground">Asset Allocation</h3>
                  <p className="text-xs text-foreground/60 mt-0.5">Current portfolio mix</p>
            </div>
                <PieChart className="w-5 h-5 text-foreground/40" />
          </div>
              <div className="p-6">
                {assetAllocation.length ? (
                  <>
                    <div className="h-64 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={assetAllocation}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {assetAllocation.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="bg-white dark:bg-surface border border-border dark:border-slate-700 rounded-xl px-4 py-3 shadow-xl text-sm">
                                    <p className="font-semibold text-foreground mb-1">{data.name}</p>
                                    <p className="text-foreground/60">
                                      {formatCurrency(data.value)} ({formatPercent(data.percentage, 1)})
              </p>
            </div>
                                )
                              }
                              return null
                            }}
                          />
                        </RechartsPie>
                      </ResponsiveContainer>
            </div>
                    <div className="space-y-3">
                      {assetAllocation.slice(0, 5).map((asset, index) => (
                        <div key={asset.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3.5 h-3.5 rounded-sm"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-foreground/80">{asset.name}</span>
          </div>
                          <span className="font-semibold text-foreground">
                            {formatPercent(asset.percentage, 1)}
                          </span>
              </div>
                      ))}
              </div>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center text-sm text-foreground/50 border border-dashed border-border rounded-xl">
                    No allocation data
                  </div>
                )}
              </div>
            </div>

            {/* Cash Flow Trends */}
            <div className={`${panelBase} lg:col-span-2`}>
              <div className={panelHeader}>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Cash Flow Activity</h3>
                  <p className="text-xs text-foreground/60 mt-0.5">
                    Last 6 months • Net flow {formatCurrency(cashFlowSnapshot.netCashFlow)}
                  </p>
                </div>
                <Link
                  href="/cash-flow"
                  className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1"
                >
                  Details
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentCashFlow}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => `${value >= 0 ? '' : '-'}$${Math.abs(value / 1000000).toFixed(1)}M`}
                      />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white dark:bg-surface border border-border dark:border-slate-700 rounded-xl px-4 py-3 shadow-xl text-sm space-y-2">
                                <p className="font-semibold text-foreground">{data.month}</p>
                                <div className="text-foreground/70 flex items-center justify-between gap-4">
                                  <span>Capital Calls</span>
                                  <span className="font-semibold text-rose-500">
                                    {formatCurrency(-data.capitalCalls)}
                                  </span>
                                </div>
                                <div className="text-foreground/70 flex items-center justify-between gap-4">
                                  <span>Distributions</span>
                                  <span className="font-semibold text-emerald-500">
                                    {formatCurrency(data.distributions)}
                                  </span>
                                </div>
                                <div className="pt-2 border-t border-border flex items-center justify-between">
                                  <span className="text-foreground/70 font-semibold">Net</span>
                        <span
                                    className={`font-bold ${
                                      data.net >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                    }`}
                                  >
                                    {formatCurrency(data.net)}
                        </span>
                      </div>
                    </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="distributions" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="capitalCalls" stackId="a" fill="#ef4444" radius={[0, 0, 6, 6]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            </div>
          </div>
        </motion.div>

          {/* Advanced Analytics Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Advanced Analytics</h2>
                <p className="text-sm text-foreground/60 mt-0.5">
                  Deeper insights and modeling tools
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analyticsTools.map((tool, index) => {
                const Icon = tool.icon
              return (
                <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  >
                    <Link
                      href={tool.href}
                      className="group block bg-white dark:bg-surface rounded-2xl border border-border dark:border-slate-800 p-6 hover:border-accent/50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-foreground" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-foreground/30 group-hover:text-accent group-hover:translate-x-1 transition-all duration-150" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-foreground/60 mb-4 leading-relaxed">
                        {tool.description}
                      </p>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        {tool.metrics.map((metric) => (
                          <div key={metric.label}>
                            <p className="text-xs text-foreground/50 mb-1">{metric.label}</p>
                            <p
                              className={`text-sm font-bold ${
                                metric.status === 'error'
                                  ? 'text-rose-500'
                                  : metric.status === 'warning'
                                  ? 'text-amber-500'
                                  : metric.status === 'success'
                                  ? 'text-emerald-500'
                                  : 'text-foreground'
                              }`}
                            >
                              {metric.value}
                            </p>
                        </div>
                      ))}
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

          {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              {
                title: 'Portfolio Dashboard',
                subtitle: 'Command center',
                href: '/dashboard',
              },
              {
                title: 'Cash Flow Analysis',
                subtitle: `${cashFlowSnapshot.pendingCallsCount} pending calls`,
                href: '/cash-flow',
              },
              {
                title: 'Fund Portfolio',
                subtitle: `${portfolioSummary.activeFunds} active funds`,
                href: '/funds',
              },
            ].map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group bg-white dark:bg-surface rounded-2xl border border-border dark:border-slate-800 px-5 py-4 hover:border-accent/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{action.title}</p>
                    <p className="text-xs text-foreground/60 mt-0.5">{action.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
        </motion.div>
      </main>
      </div>
    </div>
  )
}
