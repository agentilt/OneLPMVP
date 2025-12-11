'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { ExportButton } from '@/components/ExportButton'
import { formatCurrency, formatMultiple, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
  Download,
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
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  formatCurrencyForExport,
  formatDateForExport,
} from '@/lib/exportUtils'
import {
  SCENARIO_PRESETS,
  generateScenarioForecast,
  type ScenarioConfig,
  type CashFlowForecast,
} from '@/lib/forecasting'

interface CashFlowEvent {
  id: string
  fundId: string
  fundName: string
  type: 'CAPITAL_CALL' | 'DISTRIBUTION' | 'NAV_UPDATE' | 'NEW_HOLDING' | 'DIRECT_INVESTMENT' | 'CASH'
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
  cashAvailable?: number
}

interface CashFlowData {
  events: CashFlowEvent[]
  summary: CashFlowSummary
  distributionsByYear: { [year: string]: number }
  pendingCapitalCalls: CashFlowEvent[]
  fundSnapshots: { id: string; name: string; nav: number; commitment: number; paidIn: number }[]
  forecast?: CashFlowForecast
  cashAvailable?: number
}

export function CashFlowClient() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFund, setSelectedFund] = useState<string>('all')
  const [timeframe, setTimeframe] = useState<'all' | '1y' | '3y' | '5y'>('all')
  const [scenarioConfig, setScenarioConfig] = useState<ScenarioConfig>(SCENARIO_PRESETS.base)
  const [error, setError] = useState<string | null>(null)
  const [isQuickExporting, setIsQuickExporting] = useState(false)

  const panelBase =
    'glass-panel rounded-2xl shadow-2xl shadow-black/10 border border-border overflow-hidden'
  const panelHeader =
    'glass-header px-6 py-4 border-b border-border flex items-center gap-2'

  const shortcutLabel = useMemo(() => {
    if (typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')) {
      return '⌘⇧E'
    }
    return 'Ctrl+Shift+E'
  }, [])

  useEffect(() => {
    fetchCashFlowData()
  }, [])

  const fetchCashFlowData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/cash-flow')
      if (response.ok) {
        const result = await response.json()
        setCashFlowData(result.data)
      } else {
        setError('Unable to load cash flow data')
      }
    } catch (error) {
      console.error('Failed to fetch cash flow data:', error)
      setError('Unable to load cash flow data')
    } finally {
      setLoading(false)
    }
  }
  const filteredEvents = useMemo(() => {
    if (!cashFlowData) return []
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
  }, [cashFlowData, selectedFund, timeframe])

  const pendingCalls = useMemo(() => {
    return filteredEvents.filter(
      (event) =>
        event.type === 'CAPITAL_CALL' &&
        event.status &&
        ['PENDING', 'LATE', 'OVERDUE'].includes(event.status)
    )
  }, [filteredEvents])

  const filteredFundSnapshots = useMemo(() => {
    if (!cashFlowData) return []
    if (selectedFund === 'all') {
      const fundIdsInFilter = new Set(filteredEvents.map((e) => e.fundId))
      return cashFlowData.fundSnapshots.filter((fund) =>
        fundIdsInFilter.size ? fundIdsInFilter.has(fund.id) : true
      )
    }
    return cashFlowData.fundSnapshots.filter((fund) => fund.id === selectedFund)
  }, [cashFlowData, filteredEvents, selectedFund])

  const scenarioForecast = useMemo(() => {
    if (!cashFlowData) return null
    return generateScenarioForecast(
      filteredEvents,
      filteredFundSnapshots,
      scenarioConfig,
      cashFlowData.cashAvailable || 0
    )
  }, [cashFlowData, filteredEvents, filteredFundSnapshots, scenarioConfig])

  const upcomingForecastDrawdowns = useMemo(() => {
    if (!scenarioForecast?.upcomingDrawdowns) return []
    return scenarioForecast.upcomingDrawdowns
  }, [scenarioForecast])

  const forecastDrawdownTotal = useMemo(() => {
    if (!upcomingForecastDrawdowns.length) return 0
    return upcomingForecastDrawdowns.reduce((sum, entry) => sum + entry.amount, 0)
  }, [upcomingForecastDrawdowns])

  const summary = useMemo(() => {
    if (!cashFlowData) {
      return {
        totalInvested: 0,
        totalDistributed: 0,
        netCashFlow: 0,
        currentNAV: 0,
        totalValue: 0,
        moic: 0,
        fundCount: 0,
        pendingCallsCount: pendingCalls.length,
        pendingCallsAmount: pendingCalls.reduce((sum, call) => sum + Math.abs(call.amount), 0),
      }
    }

    let totalInvested = 0
    let totalDistributed = 0

    filteredEvents.forEach((event) => {
      if (event.type === 'CAPITAL_CALL' || event.type === 'NEW_HOLDING' || event.type === 'DIRECT_INVESTMENT') {
        totalInvested += Math.abs(event.amount)
      } else if (event.type === 'DISTRIBUTION') {
        totalDistributed += event.amount
      }
    })

    const activeFundIds = new Set(filteredEvents.map((event) => event.fundId))
    if (selectedFund !== 'all') {
      activeFundIds.add(selectedFund)
    }

    const currentNAV = cashFlowData.fundSnapshots
      .filter((fund) => activeFundIds.has(fund.id))
      .reduce((sum, fund) => sum + fund.nav, 0)

    return {
      totalInvested,
      totalDistributed,
      netCashFlow: totalDistributed - totalInvested,
      currentNAV,
      totalValue: currentNAV + totalDistributed + (cashFlowData.summary.cashAvailable || 0),
      moic: totalInvested > 0 ? (currentNAV + totalDistributed) / totalInvested : 0,
      fundCount: activeFundIds.size || cashFlowData.summary.fundCount,
      pendingCallsCount: pendingCalls.length,
      pendingCallsAmount: pendingCalls.reduce((sum, call) => sum + Math.abs(call.amount), 0),
      cashAvailable: cashFlowData.summary.cashAvailable,
    }
  }, [filteredEvents, selectedFund, cashFlowData, pendingCalls])

  // Export Functions
  const handleExportPDF = async () => {
    const doc = exportToPDF({
      title: 'Cash Flow Analysis Report',
      subtitle: `${selectedFund === 'all' ? 'All Funds' : 'Selected Fund'} - ${timeframe.toUpperCase()} Period`,
      date: formatDateForExport(new Date()),
      sections: [
        {
          title: 'Cash Flow Summary',
          type: 'metrics',
          data: [
            { label: 'Total Capital Calls', value: formatCurrencyForExport(summary.totalInvested) },
            { label: 'Total Distributions', value: formatCurrencyForExport(summary.totalDistributed) },
            { label: 'Net Cash Flow', value: formatCurrencyForExport(summary.netCashFlow) },
            { label: 'Current NAV', value: formatCurrencyForExport(summary.currentNAV) },
            { label: 'Total Value', value: formatCurrencyForExport(summary.totalValue) },
            { label: 'Cash Available', value: formatCurrencyForExport(summary.cashAvailable || 0) },
          ],
        },
        scenarioForecast
          ? {
              title: `Forecast (${scenarioConfig.label})`,
              type: 'metrics',
              data: [
                { label: 'Required Reserve', value: formatCurrencyForExport(scenarioForecast.requiredReserve) },
                { label: 'Projected Calls (8q)', value: formatCurrencyForExport(scenarioForecast.totalProjectedCalls) },
                {
                  label: 'Distribution Haircut',
                  value: `${Math.round(scenarioConfig.distributionHaircut * 100)}%`,
                },
                { label: 'Call Pace', value: `${scenarioConfig.callPaceMultiplier.toFixed(2)}x` },
                { label: 'Reserve Buffer', value: `${Math.round(scenarioConfig.reserveBufferPct * 100)}%` },
                { label: 'Available Cash', value: formatCurrencyForExport(cashFlowData?.summary.cashAvailable || 0) },
                { label: 'Reserve Gap', value: formatCurrencyForExport(scenarioForecast.reserveGap || 0) },
              ],
            }
          : null,
        {
          title: 'Recent Cash Flow Events',
          type: 'table',
          data: {
            headers: ['Date', 'Fund', 'Type', 'Amount', 'Status'],
            rows: filteredEvents.slice(0, 50).map((event) => [
              formatDateForExport(event.date),
              event.fundName,
              event.type.replace(/_/g, ' '),
              formatCurrencyForExport(event.amount),
              event.status || 'N/A',
            ]),
          },
        },
        {
          title: 'Capital Calls by Fund',
          type: 'table',
          data: {
            headers: ['Fund', 'Total Calls', 'Total Amount'],
            rows: Object.entries(
              filteredEvents
                .filter((e) => e.type === 'CAPITAL_CALL')
                .reduce((acc, e) => {
                  if (!acc[e.fundName]) acc[e.fundName] = { count: 0, total: 0 }
                  acc[e.fundName].count++
                  acc[e.fundName].total += e.amount
                  return acc
                }, {} as Record<string, { count: number; total: number }>)
            ).map(([fund, data]) => [fund, data.count.toString(), formatCurrencyForExport(data.total)]),
          },
        },
        scenarioForecast
          ? {
              title: 'Modeled Drawdowns (next 4 quarters)',
              type: 'table',
              data: {
                headers: ['Period', 'Projected Call'],
                rows: upcomingForecastDrawdowns.map((drawdown) => [
                  drawdown.period,
                  formatCurrencyForExport(drawdown.amount),
                ]),
              },
            }
          : null,
      ].filter(Boolean) as any,
    })

    doc.save(`cash-flow-${timeframe}-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportExcel = async () => {
    exportToExcel({
      filename: `cash-flow-${timeframe}-${new Date().toISOString().split('T')[0]}`,
      sheets: [
        {
          name: 'Summary',
          data: [
            ['Cash Flow Analysis Report'],
            ['Generated', formatDateForExport(new Date())],
            ['Timeframe', timeframe.toUpperCase()],
            ['Selected Fund', selectedFund === 'all' ? 'All Funds' : selectedFund],
            [],
            ['Metric', 'Value'],
            ['Total Capital Calls', summary.totalInvested],
            ['Total Distributions', summary.totalDistributed],
            ['Net Cash Flow', summary.netCashFlow],
            ['Current NAV', summary.currentNAV],
            ['Total Value', summary.totalValue],
            ['Cash Available', summary.cashAvailable || 0],
          ],
        },
        {
          name: 'Events',
          data: [
            ['Date', 'Fund', 'Type', 'Amount', 'Status', 'Description'],
            ...filteredEvents.map((event) => [
              formatDateForExport(event.date),
              event.fundName,
              event.type,
              event.amount,
              event.status || 'N/A',
              event.description,
            ]),
          ],
        },
        scenarioForecast
          ? {
              name: 'Forecast',
              data: [
                ['Scenario', scenarioConfig.label],
                ['Call Pace Multiplier', scenarioConfig.callPaceMultiplier],
                ['Distribution Haircut', scenarioConfig.distributionHaircut],
                ['Reserve Buffer %', scenarioConfig.reserveBufferPct],
                ['Required Reserve', scenarioForecast.requiredReserve],
                ['Available Cash', cashFlowData?.summary.cashAvailable || 0],
                ['Reserve Gap', scenarioForecast.reserveGap || 0],
                ['Total Projected Calls (8q)', scenarioForecast.totalProjectedCalls],
                [],
                ['Period', 'Capital Calls', 'Distributions', 'Net', 'Cumulative Net'],
                ...scenarioForecast.netCashFlow.map((row) => [
                  row.period,
                  row.capitalCalls,
                  row.distributions,
                  row.net,
                  row.cumulativeNet,
                ]),
              ],
            }
          : null,
      ].filter(Boolean) as any,
    })
  }

  const handleExportCSV = async () => {
    const csvData = [
      ['Date', 'Fund', 'Type', 'Amount', 'Status'],
      ...filteredEvents.map((event) => [
        formatDateForExport(event.date),
        event.fundName,
        event.type,
        event.amount.toString(),
        event.status || 'N/A',
      ]),
    ]

    exportToCSV(csvData, `cash-flow-events-${timeframe}-${new Date().toISOString().split('T')[0]}`)
  }

  const handleQuickExport = useCallback(async () => {
    if (isQuickExporting) return
    setIsQuickExporting(true)
    try {
      await Promise.resolve(handleExportPDF())
    } finally {
      setIsQuickExporting(false)
    }
  }, [isQuickExporting, handleExportPDF])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'e') {
        event.preventDefault()
        handleQuickExport()
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [handleQuickExport])

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

      if (event.type === 'CAPITAL_CALL' || event.type === 'NEW_HOLDING' || event.type === 'DIRECT_INVESTMENT') {
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

  // Prepare cumulative cash flow chart data (recomputed for current filters)
  const cumulativeData = useMemo(() => {
    let cumulativeInvested = 0
    let cumulativeDistributed = 0

    return filteredEvents
      .filter((e) => e.type !== 'NAV_UPDATE')
      .map((event) => {
        if (event.type === 'CAPITAL_CALL' || event.type === 'NEW_HOLDING') {
          cumulativeInvested += Math.abs(event.amount)
        } else if (event.type === 'DISTRIBUTION') {
          cumulativeDistributed += event.amount
        }

        return {
          date: formatDate(new Date(event.date)),
          invested: cumulativeInvested,
          distributed: cumulativeDistributed,
          netCashFlow: cumulativeDistributed - cumulativeInvested,
          fundName: event.fundName,
          type: event.type,
        }
      })
  }, [filteredEvents])

  const uniqueFunds = useMemo(() => {
    if (!cashFlowData) return []
    return Array.from(
      cashFlowData.events.reduce((map, event) => {
        if (!map.has(event.fundId)) {
          map.set(event.fundId, { id: event.fundId, name: event.fundName })
        }
        return map
      }, new Map<string, { id: string; name: string }>() ).values()
    )
  }, [cashFlowData])

  const distributionYearData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredEvents
      .filter((event) => event.type === 'DISTRIBUTION')
      .forEach((event) => {
        const year = new Date(event.date).getFullYear().toString()
        map[year] = (map[year] || 0) + event.amount
      })
    return Object.entries(map).map(([year, amount]) => ({ year, amount }))
  }, [filteredEvents])

  if (loading) {
  return (
    <div className="min-h-screen glass-page">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        </main>
      </div>

      {/* Pending Capital Calls - moved below visuals */}
      {pendingCalls.length > 0 && (
        <div className="px-6 lg:px-8 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            data-animate data-tilt
            className={`${panelBase} border-l-4 border-l-amber-500`}
          >
            <div className="glass-header border-b border-border flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground/60">Capital Calls</p>
                <h3 className="text-lg font-bold text-foreground">Pending obligations</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/70">
                <span className="font-semibold text-foreground">
                  {summary.pendingCallsCount} open call{summary.pendingCallsCount === 1 ? '' : 's'}
                </span>
                <span className="px-3 py-1 rounded-full glass-panel border border-amber-300/70 text-amber-700 font-semibold">
                  {formatCurrency(summary.pendingCallsAmount)}
                </span>
                {scenarioForecast && forecastDrawdownTotal > 0 && (
                  <span className="px-3 py-1 rounded-full glass-panel border border-blue-300/70 text-blue-700 font-semibold">
                    Modeled drawdowns: {formatCurrency(forecastDrawdownTotal)}
                  </span>
                )}
              </div>

              <div className="divide-y divide-border rounded-xl border border-border/70 overflow-hidden">
                {pendingCalls.slice(0, 5).map((call) => (
                  <div
                    key={call.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 glass-panel border border-border/60"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{call.fundName}</p>
                      <p className="text-xs text-foreground/60 line-clamp-1">{call.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(Math.abs(call.amount))}
                      </span>
                      <span className="text-xs text-foreground/60">{formatDate(new Date(call.date))}</span>
                    </div>
                  </div>
                ))}
              </div>

              {scenarioForecast && upcomingForecastDrawdowns.length > 0 && (
                <div className="pt-2 border-t border-border/70">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Modeled drawdowns ({scenarioConfig.label})
                  </p>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {upcomingForecastDrawdowns.slice(0, 4).map((drawdown, index) => (
                      <div
                        key={drawdown.period + index}
                        className="p-3 rounded-lg glass-panel border border-border/70"
                      >
                        <p className="text-xs text-foreground/60">{drawdown.period}</p>
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(drawdown.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

  if (!cashFlowData) {
    return (
      <div className="min-h-screen glass-page">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="text-center py-12 glass-panel border border-border rounded-2xl shadow-2xl shadow-black/10">
              <p className="text-foreground/60">
                {error ? error : 'No cash flow data available'}
              </p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen glass-page">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-6 lg:p-8 space-y-8">
          {/* Animated Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-8"
          >
            <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
              <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl glass-panel border border-border/60 flex items-center justify-center shadow-lg shadow-accent/20">
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
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={scenarioConfig.key}
                  onChange={(e) => {
                    const preset = SCENARIO_PRESETS[e.target.value as keyof typeof SCENARIO_PRESETS]
                    setScenarioConfig(preset)
                  }}
                  className="px-4 py-2 rounded-xl border border-border glass-panel text-sm font-medium hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                >
                  {Object.values(SCENARIO_PRESETS).map((preset) => (
                    <option key={preset.key} value={preset.key}>
                      {preset.label} scenario
                    </option>
                  ))}
                </select>
                <Link
                  href="/forecasting"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass-panel border border-border text-sm font-semibold hover:border-accent hover:text-accent transition-all"
                >
                  Open full forecasting
                </Link>
                <button
                  onClick={handleQuickExport}
                  disabled={isQuickExporting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border glass-panel text-sm font-semibold text-foreground hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isQuickExporting ? (
                    <>
                      <Download className="w-4 h-4 animate-spin" />
                      Exporting…
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Quick Export
                      <span className="text-xs text-foreground/60">({shortcutLabel})</span>
                    </>
                  )}
                </button>
                <ExportButton
                  onExportPDF={handleExportPDF}
                  onExportExcel={handleExportExcel}
                  onExportCSV={handleExportCSV}
                  label="Export Report"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mt-6">
              <select
                value={selectedFund}
                onChange={(e) => setSelectedFund(e.target.value)}
                className="px-4 py-2 rounded-xl border border-border glass-panel text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
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
                className="px-4 py-2 rounded-xl border border-border glass-panel text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
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
                data-animate data-tilt
                className={`${panelBase} p-6`}
              >
                <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl glass-panel border border-border/60 flex items-center justify-center">
                    <ArrowDown className="w-5 h-5 text-red-700 dark:text-red-300" />
                  </div>
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                    Total Invested
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300 mb-1">
                  {formatCurrency(summary.totalInvested)}
                </div>
              <div className="text-xs text-foreground/60">{summary.fundCount} funds</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                data-animate data-tilt
                className={`${panelBase} p-6`}
              >
                <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl glass-panel border border-border/60 flex items-center justifyCenter">
                    <ArrowUp className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                    Total Distributed
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                  {formatCurrency(summary.totalDistributed)}
                </div>
              <div className="text-xs text-foreground/60">
                {distributionYearData.length} distribution events
              </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                data-animate data-tilt
                className={`${panelBase} p-6`}
              >
                <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl glass-panel border border-border/60 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">Net Cash Flow</div>
                </div>
              <div
                  className={`text-2xl font-bold mb-1 ${
                    summary.netCashFlow >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'
                }`}
              >
                {formatCurrency(summary.netCashFlow)}
              </div>
              <div className="text-xs text-foreground/60">
                  {summary.totalInvested > 0
                    ? `${((summary.totalDistributed / summary.totalInvested) * 100).toFixed(1)}% returned`
                    : 'Awaiting capital deployment'}
              </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                data-animate data-tilt
                className={`${panelBase} p-6`}
              >
                <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl glass-panel border border-border/60 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-orange-700 dark:text-orange-300" />
                  </div>
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">Portfolio MOIC</div>
                </div>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 mb-1">
                  {formatMultiple(summary.moic)}
              </div>
              <div className="text-xs text-foreground/60">
                Total Value: {formatCurrency(summary.totalValue)}
              </div>
              </motion.div>

              {scenarioForecast && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                    <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      {scenarioConfig.label} scenario
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-foreground/70">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Required reserve</span>
                      <span className="font-bold text-blue-700 dark:text-blue-200">
                        {formatCurrency(scenarioForecast.requiredReserve)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Available cash accounts</span>
                      <span className="font-semibold">
                        {formatCurrency(cashFlowData?.summary.cashAvailable || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Reserve gap</span>
                      <span className="font-semibold">
                        {formatCurrency(scenarioForecast.reserveGap || 0)}
                      </span>
                    </div>
                  </div>
                  {forecastDrawdownTotal > 0 && (
                    <div className="text-xs text-foreground/60 mt-2">
                      Next 4 quarters drawdowns: {formatCurrency(forecastDrawdownTotal)}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Waterfall Chart */}
            <div data-animate data-tilt className={panelBase}>
              <div className={panelHeader}>
                <BarChart3 className="w-5 h-5 text-accent" />
                <h2 className="font-bold text-lg">Quarterly Cash Flow</h2>
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
                        tickFormatter={(value: number) => {
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
            <div data-animate data-tilt className={panelBase}>
              <div className={panelHeader}>
                <PieChart className="w-5 h-5 text-accent" />
                <h2 className="font-bold text-lg">Distributions by Year</h2>
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
                        tickFormatter={(value: number) => {
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
          <div data-animate data-tilt className={`${panelBase} mb-8`}>
            <div className={panelHeader}>
              <Activity className="w-5 h-5 text-accent" />
              <h2 className="font-bold text-lg">Cumulative Cash Flow</h2>
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
                      tickFormatter={(value: number) => {
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
          <div className={panelBase}>
            <div className={panelHeader}>
              <Calendar className="w-5 h-5 text-accent" />
              <h2 className="font-bold text-lg">Recent Cash Flow Events</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="glass-header border-b border-border">
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
                <tbody className="divide-y divide-border">
                  {filteredEvents
                    .filter((e) => e.type !== 'NAV_UPDATE')
                    .slice(-20)
                    .reverse()
                    .map((event) => (
                      <tr key={event.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">
                          {formatDate(new Date(event.date))}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{event.fundName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium glass-panel border ${
                              event.type === 'DISTRIBUTION'
                                ? 'border-emerald-300/60 text-emerald-600'
                                : event.type === 'CAPITAL_CALL'
                                ? 'border-red-300/60 text-red-600'
                                : 'border-blue-300/60 text-blue-600'
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
                            event.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
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
