'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { formatCurrency, formatPercent } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface Fund {
  id: string
  name: string
  manager: string
  vintage: number
  commitment: number
  paidIn: number
  nav: number
  dpi: number
  irr: number
}

interface Distribution {
  id: string
  amount: number
  distributionDate: Date
  distributionType: string
  fund: {
    name: string
  }
}

interface CapitalCall {
  id: string
  callAmount: number | null
  dueDate: Date | null
  fund: {
    name: string
    vintage: number
  }
}

interface PortfolioMetrics {
  totalCommitment: number
  totalPaidIn: number
  totalNav: number
  unfundedCommitments: number
  totalDistributions: number
}

interface ForecastingClientProps {
  funds: Fund[]
  distributions: Distribution[]
  capitalCalls: CapitalCall[]
  portfolioMetrics: PortfolioMetrics
}

type ScenarioType = 'base' | 'best' | 'worst'
type TimeHorizon = '1year' | '3years' | '5years'

export function ForecastingClient({
  funds,
  distributions,
  capitalCalls,
  portfolioMetrics,
}: ForecastingClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [scenario, setScenario] = useState<ScenarioType>('base')
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('3years')
  const [activeTab, setActiveTab] = useState<'capital' | 'distributions' | 'net' | 'liquidity'>('capital')

  // Calculate quarterly projection periods based on time horizon
  const quarters = useMemo(() => {
    const numQuarters = timeHorizon === '1year' ? 4 : timeHorizon === '3years' ? 12 : 20
    const result = []
    const now = new Date()
    
    for (let i = 0; i < numQuarters; i++) {
      const quarter = Math.floor((now.getMonth() + i * 3) / 3) % 4 + 1
      const year = now.getFullYear() + Math.floor((now.getMonth() + i * 3) / 12)
      result.push(`Q${quarter} ${year}`)
    }
    return result
  }, [timeHorizon])

  // Project capital calls based on unfunded commitments and pace
  const capitalCallProjections = useMemo(() => {
    const { unfundedCommitments } = portfolioMetrics
    const numQuarters = quarters.length
    
    // Calculate deployment pace based on scenario
    const basePace = 0.15 // 15% per quarter baseline
    const scenarioPace = {
      base: basePace,
      best: basePace * 1.2, // 20% faster deployment
      worst: basePace * 0.7, // 30% slower deployment
    }[scenario]

    let remaining = unfundedCommitments
    const projections = quarters.map((quarter, index) => {
      // Decrease pace over time (J-curve effect)
      const timeFactor = Math.max(0.3, 1 - (index / numQuarters) * 0.7)
      const amount = Math.min(remaining, remaining * scenarioPace * timeFactor)
      remaining -= amount
      
      return {
        period: quarter,
        amount: Math.round(amount),
        cumulative: unfundedCommitments - remaining,
      }
    })

    return projections
  }, [quarters, portfolioMetrics, scenario])

  // Project distributions based on NAV and DPI trends
  const distributionProjections = useMemo(() => {
    const { totalNav } = portfolioMetrics
    const avgDPI = funds.length > 0 ? funds.reduce((sum, f) => sum + f.dpi, 0) / funds.length : 0
    
    // Calculate distribution pace based on scenario and portfolio maturity
    const baseDistRate = 0.08 // 8% of NAV per quarter
    const scenarioRate = {
      base: baseDistRate,
      best: baseDistRate * 1.5, // 50% more distributions
      worst: baseDistRate * 0.5, // 50% fewer distributions
    }[scenario]

    const projections = quarters.map((quarter, index) => {
      // Increase distributions over time as funds mature
      const maturityFactor = 1 + (index / quarters.length) * 0.5
      const amount = totalNav * scenarioRate * maturityFactor
      
      return {
        period: quarter,
        amount: Math.round(amount),
        cumulative: Math.round(amount * (index + 1)),
      }
    })

    return projections
  }, [quarters, portfolioMetrics, funds, scenario])

  // Calculate net cash flow
  const netCashFlow = useMemo(() => {
    return quarters.map((quarter, index) => ({
      period: quarter,
      capitalCalls: -capitalCallProjections[index].amount,
      distributions: distributionProjections[index].amount,
      net: distributionProjections[index].amount - capitalCallProjections[index].amount,
    }))
  }, [quarters, capitalCallProjections, distributionProjections])

  // Calculate liquidity requirements
  const liquidityRequirements = useMemo(() => {
    let cumulativeCash = 0
    let maxDrawdown = 0
    
    const requirements = netCashFlow.map((cf) => {
      cumulativeCash += cf.net
      maxDrawdown = Math.min(maxDrawdown, cumulativeCash)
      
      return {
        period: cf.period,
        cumulativeCash,
        maxDrawdown,
        requiredReserve: Math.abs(maxDrawdown) * 1.15, // 15% buffer
      }
    })

    return requirements
  }, [netCashFlow])

  const tabs = [
    { id: 'capital', label: 'Capital Calls', icon: TrendingDown },
    { id: 'distributions', label: 'Distributions', icon: TrendingUp },
    { id: 'net', label: 'Net Cash Flow', icon: Activity },
    { id: 'liquidity', label: 'Liquidity', icon: DollarSign },
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Cash Flow Forecasting
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-sm text-foreground/60 mt-0.5"
              >
                Project cash flows, model scenarios, and plan liquidity needs
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6 mb-8"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2 block">
                Scenario
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'best', label: 'Best Case', color: 'emerald' },
                  { value: 'base', label: 'Base Case', color: 'blue' },
                  { value: 'worst', label: 'Worst Case', color: 'red' },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setScenario(s.value as ScenarioType)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      scenario === s.value
                        ? s.color === 'emerald'
                          ? 'bg-emerald-500 text-white'
                          : s.color === 'blue'
                          ? 'bg-blue-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-l border-border pl-4 ml-auto">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2 block">
                Time Horizon
              </label>
              <select
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(e.target.value as TimeHorizon)}
                className="px-4 py-2 border border-border rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="1year">1 Year (4 Quarters)</option>
                <option value="3years">3 Years (12 Quarters)</option>
                <option value="5years">5 Years (20 Quarters)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 rounded-xl border border-red-200/60 dark:border-red-800/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-sm font-semibold text-foreground">Total Calls</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(capitalCallProjections.reduce((sum, p) => sum + p.amount, 0))}
            </p>
            <p className="text-xs text-foreground/60">Over {quarters.length} quarters</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Total Distributions</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(distributionProjections.reduce((sum, p) => sum + p.amount, 0))}
            </p>
            <p className="text-xs text-foreground/60">Projected returns</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl border border-blue-200/60 dark:border-blue-800/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-foreground">Net Cash Flow</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(netCashFlow.reduce((sum, cf) => sum + cf.net, 0))}
            </p>
            <p className="text-xs text-foreground/60">
              {netCashFlow.reduce((sum, cf) => sum + cf.net, 0) > 0 ? 'Positive' : 'Negative'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 rounded-xl border border-amber-200/60 dark:border-amber-800/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Reserve Needed</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(Math.max(...liquidityRequirements.map(r => r.requiredReserve)))}
            </p>
            <p className="text-xs text-foreground/60">Peak liquidity requirement</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex gap-2 border-b border-border overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Capital Calls Tab */}
        {activeTab === 'capital' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Projected Capital Calls</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={capitalCallProjections}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="amount" fill="#ef4444" name="Quarterly Call" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="cumulative" stroke="#dc2626" strokeWidth={2} name="Cumulative" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quarterly Breakdown</h3>
              <div className="space-y-2">
                {capitalCallProjections.slice(0, 8).map((projection, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-4">
                      <Calendar className="w-4 h-4 text-foreground/40" />
                      <span className="text-sm font-medium text-foreground">{projection.period}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${(projection.amount / Math.max(...capitalCallProjections.map(p => p.amount))) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground min-w-[100px] text-right">
                        {formatCurrency(projection.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Distributions Tab */}
        {activeTab === 'distributions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Projected Distributions</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={distributionProjections}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Quarterly Distribution" />
                  <Line type="monotone" dataKey="cumulative" stroke="#059669" strokeWidth={2} name="Cumulative" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Distribution Drivers</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-foreground">Portfolio Maturity</span>
                      <span className="text-sm font-semibold text-foreground">
                        {Math.round((funds.reduce((sum, f) => sum + (new Date().getFullYear() - f.vintage), 0) / funds.length))} years avg
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-foreground">Exit Activity</span>
                      <span className="text-sm font-semibold text-foreground">{scenario === 'best' ? 'High' : scenario === 'base' ? 'Moderate' : 'Low'}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: scenario === 'best' ? '80%' : scenario === 'base' ? '50%' : '30%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-foreground">Market Conditions</span>
                      <span className="text-sm font-semibold text-foreground">{scenario === 'best' ? 'Favorable' : scenario === 'base' ? 'Stable' : 'Challenging'}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: scenario === 'best' ? '90%' : scenario === 'base' ? '60%' : '35%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Key Assumptions</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <span className="text-sm text-foreground">Distribution Rate</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {scenario === 'best' ? '12%' : scenario === 'base' ? '8%' : '4%'} / quarter
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-foreground">Avg. Holding Period</span>
                    <span className="text-sm font-semibold text-foreground">5-7 years</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-foreground">Exit Multiples</span>
                    <span className="text-sm font-semibold text-foreground">
                      {scenario === 'best' ? '3.0x' : scenario === 'base' ? '2.5x' : '1.8x'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Net Cash Flow Tab */}
        {activeTab === 'net' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Net Cash Flow Projection</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={netCashFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(Math.abs(value))} />
                  <Legend />
                  <Bar dataKey="capitalCalls" fill="#ef4444" name="Capital Calls" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="distributions" fill="#10b981" name="Distributions" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} name="Net Cash Flow" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { label: 'Positive Quarters', value: netCashFlow.filter(cf => cf.net > 0).length, total: netCashFlow.length, color: 'emerald' },
                { label: 'Negative Quarters', value: netCashFlow.filter(cf => cf.net < 0).length, total: netCashFlow.length, color: 'red' },
                { label: 'Breakeven Point', value: netCashFlow.findIndex(cf => cf.net > 0) + 1, total: netCashFlow.length, color: 'blue' },
              ].map((stat) => (
                <div key={stat.label} className={`bg-gradient-to-br ${
                  stat.color === 'emerald' 
                    ? 'from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 border-emerald-200/60 dark:border-emerald-800/60'
                    : stat.color === 'red'
                    ? 'from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 border-red-200/60 dark:border-red-800/60'
                    : 'from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 border-blue-200/60 dark:border-blue-800/60'
                } rounded-xl border p-6`}>
                  <p className="text-sm text-foreground/60 mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {stat.label === 'Breakeven Point' ? `Quarter ${stat.value}` : `of ${stat.total} quarters`}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Liquidity Tab */}
        {activeTab === 'liquidity' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Cumulative Cash Position</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={liquidityRequirements}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="cumulativeCash" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Cumulative Cash" />
                  <Area type="monotone" dataKey="requiredReserve" stroke="#f59e0b" fill="none" strokeDasharray="5 5" name="Required Reserve" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Liquidity Milestones</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Peak Liquidity Need</p>
                      <p className="text-lg font-bold text-foreground mt-1">
                        {formatCurrency(Math.max(...liquidityRequirements.map(r => r.requiredReserve)))}
                      </p>
                      <p className="text-xs text-foreground/60 mt-1">
                        In {liquidityRequirements.find(r => r.requiredReserve === Math.max(...liquidityRequirements.map(x => x.requiredReserve)))?.period}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Cash Flow Positive</p>
                      <p className="text-lg font-bold text-foreground mt-1">
                        {liquidityRequirements.find(r => r.cumulativeCash > 0)?.period || 'Not in period'}
                      </p>
                      <p className="text-xs text-foreground/60 mt-1">First positive cumulative cash</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Full Deployment</p>
                      <p className="text-lg font-bold text-foreground mt-1">
                        {capitalCallProjections[capitalCallProjections.length - 1]?.period}
                      </p>
                      <p className="text-xs text-foreground/60 mt-1">All capital deployed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Funding Recommendations</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm font-semibold text-foreground">Immediate Reserve</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-2">
                      {formatCurrency(Math.max(...liquidityRequirements.slice(0, 4).map(r => r.requiredReserve)))}
                    </p>
                    <p className="text-xs text-foreground/60">For next 12 months</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-foreground">Credit Line</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(portfolioMetrics.unfundedCommitments * 0.3)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-foreground">Cash Reserve</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(portfolioMetrics.unfundedCommitments * 0.2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-foreground">Total Buffer</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(portfolioMetrics.unfundedCommitments * 0.5)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
