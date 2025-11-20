'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { formatCurrency, formatMultiple, formatDate } from '@/lib/utils'
import {
  ArrowDown,
  ArrowUp,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  BarChart3,
  Activity,
  PieChart,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area,
} from 'recharts'

interface CashFlowEvent {
  id: string
  fundId: string
  fundName: string
  type: 'CAPITAL_CALL' | 'DISTRIBUTION' | 'NAV_UPDATE' | 'NEW_HOLDING'
  date: string
  amount: number
  description: string
  status?: string
  cumulativeInvested?: number
  cumulativeDistributed?: number
  netCashFlow?: number
}

interface CashFlowSummary {
  totalInvested: number
  totalDistributed: number
  netCashFlow: number
  currentNAV: number
  totalValue: number
  moic: number
  fundCount: number
  pendingCallsCount: number
  pendingCallsAmount: number
}

interface CashFlowData {
  events: CashFlowEvent[]
  summary: CashFlowSummary
  distributionsByYear: { [year: string]: number }
  pendingCapitalCalls: CashFlowEvent[]
}

export function CashFlowClient() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFund, setSelectedFund] = useState<string>('all')
  const [timeframe, setTimeframe] = useState<'all' | '1y' | '3y' | '5y'>('all')

  useEffect(() => {
    fetchCashFlowData()
  }, [])

  const fetchCashFlowData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cash-flow')
      if (response.ok) {
        const result = await response.json()
        setCashFlowData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch cash flow data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!cashFlowData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="text-center py-12">
              <p className="text-foreground/60">No cash flow data available</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Filter events based on selected fund and timeframe
  const filterEvents = () => {
    let filtered = cashFlowData.events

    if (selectedFund !== 'all') {
      filtered = filtered.filter((e) => e.fundId === selectedFund)
    }

    if (timeframe !== 'all') {
      const years = parseInt(timeframe.replace('y', ''))
      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - years)
      filtered = filtered.filter((e) => new Date(e.date) >= cutoffDate)
    }

    return filtered
  }

  const filteredEvents = filterEvents()

  // Prepare waterfall chart data (quarterly aggregation)
  const waterfallData = (() => {
    const quarterlyData: { [quarter: string]: { calls: number; distributions: number; nav: number } } = {}

    filteredEvents.forEach((event) => {
      const date = new Date(event.date)
      const year = date.getFullYear()
      const quarter = Math.floor(date.getMonth() / 3) + 1
      const key = `${year} Q${quarter}`

      if (!quarterlyData[key]) {
        quarterlyData[key] = { calls: 0, distributions: 0, nav: 0 }
      }

      if (event.type === 'CAPITAL_CALL' || event.type === 'NEW_HOLDING') {
        quarterlyData[key].calls += Math.abs(event.amount)
      } else if (event.type === 'DISTRIBUTION') {
        quarterlyData[key].distributions += event.amount
      }
    })

    return Object.entries(quarterlyData)
      .map(([quarter, data]) => ({
        quarter,
        capitalCalls: -data.calls,
        distributions: data.distributions,
        net: data.distributions - data.calls,
      }))
      .sort((a, b) => {
        const [aYear, aQ] = a.quarter.split(' Q')
        const [bYear, bQ] = b.quarter.split(' Q')
        return parseInt(aYear) - parseInt(bYear) || parseInt(aQ) - parseInt(bQ)
      })
  })()

  // Prepare cumulative cash flow chart data
  const cumulativeData = filteredEvents
    .filter((e) => e.type !== 'NAV_UPDATE')
    .map((event) => ({
      date: formatDate(new Date(event.date)),
      invested: event.cumulativeInvested || 0,
      distributed: event.cumulativeDistributed || 0,
      netCashFlow: event.netCashFlow || 0,
      fundName: event.fundName,
      type: event.type,
    }))

  // Get unique funds for filter
  const uniqueFunds = Array.from(new Set(cashFlowData.events.map((e) => ({ id: e.fundId, name: e.fundName }))))
    .filter((fund, index, self) => self.findIndex((f) => f.id === fund.id) === index)

  // Distributions by year chart data
  const distributionYearData = Object.entries(cashFlowData.distributionsByYear).map(([year, amount]) => ({
    year,
    amount,
  }))

  const { summary } = cashFlowData

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-6 lg:p-8">
          {/* Animated Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    Cash Flow Analysis
                  </motion.span>
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-sm text-foreground/60 mt-0.5"
                >
                  Track capital calls, distributions, and investment flows across your portfolio
                </motion.p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mt-6">
              <select
                value={selectedFund}
                onChange={(e) => setSelectedFund(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              >
                <option value="all">All Funds</option>
                {uniqueFunds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.name}
                  </option>
                ))}
              </select>

              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              >
                <option value="all">All Time</option>
                <option value="1y">Last 12 Months</option>
                <option value="3y">Last 3 Years</option>
                <option value="5y">Last 5 Years</option>
              </select>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 rounded-xl border border-red-200/60 dark:border-red-800/60 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                    Total Invested
                  </div>
                </div>
                <div className="text-xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(summary.totalInvested)}
                </div>
                <div className="text-xs text-foreground/60 mt-1">{summary.fundCount} funds</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                    Total Distributed
                  </div>
                </div>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(summary.totalDistributed)}
                </div>
                <div className="text-xs text-foreground/60 mt-1">
                  {distributionYearData.length} distribution events
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl border border-blue-200/60 dark:border-blue-800/60 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Net Cash Flow</div>
                </div>
                <div
                  className={`text-xl font-bold ${
                    summary.netCashFlow >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {formatCurrency(summary.netCashFlow)}
                </div>
                <div className="text-xs text-foreground/60 mt-1">
                  {summary.totalInvested > 0
                    ? `${((summary.totalDistributed / summary.totalInvested) * 100).toFixed(1)}% returned`
                    : 'Awaiting capital deployment'}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 dark:from-orange-500/20 dark:to-orange-600/10 rounded-xl border border-orange-200/60 dark:border-orange-800/60 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Portfolio MOIC</div>
                </div>
                <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
                  {formatMultiple(summary.moic)}
                </div>
                <div className="text-xs text-foreground/60 mt-1">
                  Total Value: {formatCurrency(summary.totalValue)}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Pending Capital Calls Alert */}
          {cashFlowData.pendingCapitalCalls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-2">Pending Capital Calls</h3>
                  <p className="text-sm text-foreground/70 mb-4">
                    You have {summary.pendingCallsCount} pending capital call
                    {summary.pendingCallsCount !== 1 ? 's' : ''} totaling {formatCurrency(summary.pendingCallsAmount)}
                  </p>
                  <div className="space-y-2">
                    {cashFlowData.pendingCapitalCalls.slice(0, 3).map((call) => (
                      <div
                        key={call.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-sm">{call.fundName}</div>
                          <div className="text-xs text-foreground/60">{call.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{formatCurrency(Math.abs(call.amount))}</div>
                          <div className="text-xs text-foreground/60">{formatDate(new Date(call.date))}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Waterfall Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
              <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  <h2 className="font-bold text-lg">Quarterly Cash Flow</h2>
                </div>
              </div>
              <div className="p-6">
                {waterfallData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={waterfallData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis
                        dataKey="quarter"
                        tick={{ fontSize: 11 }}
                        stroke="currentColor"
                        opacity={0.5}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="currentColor"
                        opacity={0.5}
                        tickFormatter={(value) => {
                          if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                          if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`
                          return `$${value}`
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(Math.abs(value))}
                      />
                      <Legend />
                      <Bar dataKey="capitalCalls" fill="#ef4444" name="Capital Calls" />
                      <Bar dataKey="distributions" fill="#10b981" name="Distributions" />
                      <Bar dataKey="net" fill="#3b82f6" name="Net" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-foreground/60">No data for selected filters</div>
                )}
              </div>
            </div>

            {/* Distributions by Year */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-green-500" />
                  <h2 className="font-bold text-lg">Distributions by Year</h2>
                </div>
              </div>
              <div className="p-6">
                {distributionYearData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={distributionYearData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="currentColor"
                        opacity={0.5}
                        tickFormatter={(value) => {
                          if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                          if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
                          return `$${value}`
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="amount" fill="#10b981" name="Distributions" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-foreground/60">No distribution data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Cumulative Cash Flow Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <h2 className="font-bold text-lg">Cumulative Cash Flow</h2>
              </div>
            </div>
            <div className="p-6">
              {cumulativeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      opacity={0.5}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="currentColor"
                      opacity={0.5}
                      tickFormatter={(value) => {
                        if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                        if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`
                        return `$${value}`
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="invested"
                      fill="#ef4444"
                      stroke="#ef4444"
                      fillOpacity={0.3}
                      name="Cumulative Invested"
                    />
                    <Area
                      type="monotone"
                      dataKey="distributed"
                      fill="#10b981"
                      stroke="#10b981"
                      fillOpacity={0.3}
                      name="Cumulative Distributed"
                    />
                    <Line
                      type="monotone"
                      dataKey="netCashFlow"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 3 }}
                      name="Net Cash Flow"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-foreground/60">No data for selected filters</div>
              )}
            </div>
          </div>

          {/* Recent Cash Flow Events */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
            <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                <h2 className="font-bold text-lg">Recent Cash Flow Events</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      Fund
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                  {filteredEvents
                    .filter((e) => e.type !== 'NAV_UPDATE')
                    .slice(-20)
                    .reverse()
                    .map((event) => (
                      <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">
                          {formatDate(new Date(event.date))}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{event.fundName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              event.type === 'DISTRIBUTION'
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : event.type === 'CAPITAL_CALL'
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            }`}
                          >
                            {event.type === 'DISTRIBUTION' && <ArrowUp className="w-3 h-3" />}
                            {(event.type === 'CAPITAL_CALL' || event.type === 'NEW_HOLDING') && (
                              <ArrowDown className="w-3 h-3" />
                            )}
                            {event.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground/70">{event.description}</td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                            event.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {event.amount >= 0 ? '+' : ''}
                          {formatCurrency(event.amount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

