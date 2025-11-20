'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  TrendingUp,
  PieChart as PieChartIcon,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { ExportButton } from '@/components/ExportButton'
import { formatCurrency, formatPercent } from '@/lib/utils'
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  formatCurrencyForExport,
  formatPercentForExport,
  formatDateForExport,
} from '@/lib/exportUtils'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
  domicile: string
  vintage: number
  commitment: number
  paidIn: number
  nav: number
  irr: number
  tvpi: number
}

interface DirectInvestment {
  id: string
  name: string
  currentValue: number | null
}

interface CurrentAllocations {
  byManager: { [key: string]: number }
  byGeography: { [key: string]: number }
  byVintage: { [key: string]: number }
}

interface PortfolioMetrics {
  totalCommitment: number
  totalNav: number
  totalPaidIn: number
  totalPortfolioValue: number
  unfundedCommitments: number
  diTotalValue: number
}

interface PortfolioBuilderClientProps {
  funds: Fund[]
  directInvestments: DirectInvestment[]
  currentAllocations: CurrentAllocations
  portfolioMetrics: PortfolioMetrics
}

const COLORS = ['#4b6c9c', '#2d7a5f', '#6d5d8a', '#c77340', '#3b82f6', '#10b981', '#ef4444', '#a85f35']

// Default target allocations (can be customized by user)
const DEFAULT_TARGETS: {
  byManager: { [key: string]: number }
  byGeography: { [key: string]: number }
  byVintage: { [key: string]: number }
} = {
  byManager: {
    'Venture Capital': 30,
    'Private Equity': 35,
    'Growth Equity': 20,
    'Other': 15,
  },
  byGeography: {
    'North America': 50,
    'Europe': 30,
    'Asia': 15,
    'Other': 5,
  },
  byVintage: {
    '2020-2022': 40,
    '2023-2024': 35,
    '2025+': 25,
  },
}

export function PortfolioBuilderClient({
  funds,
  directInvestments,
  currentAllocations,
  portfolioMetrics,
}: PortfolioBuilderClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'rebalance' | 'whatif' | 'pacing'>('overview')
  const [targetAllocations, setTargetAllocations] = useState(DEFAULT_TARGETS)
  const [whatIfCommitment, setWhatIfCommitment] = useState(10000000) // $10M default

  // Calculate current allocation percentages
  const currentAllocationPercentages = useMemo(() => {
    const { totalPortfolioValue } = portfolioMetrics
    
    const byManager = Object.entries(currentAllocations.byManager).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalPortfolioValue) * 100,
    }))

    const byGeography = Object.entries(currentAllocations.byGeography).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalPortfolioValue) * 100,
    }))

    const byVintage = Object.entries(currentAllocations.byVintage).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalPortfolioValue) * 100,
    }))

    return { byManager, byGeography, byVintage }
  }, [currentAllocations, portfolioMetrics])

  // Calculate allocation drift
  const allocationDrift = useMemo(() => {
    const managerDrift = currentAllocationPercentages.byManager.map(alloc => {
      const target = targetAllocations.byManager[alloc.name] || 0
      const drift = alloc.percentage - target
      return { name: alloc.name, current: alloc.percentage, target, drift }
    })

    const totalDrift = managerDrift.reduce((sum, item) => sum + Math.abs(item.drift), 0)
    const needsRebalancing = totalDrift > 5 // More than 5% total drift

    return { managerDrift, totalDrift, needsRebalancing }
  }, [currentAllocationPercentages, targetAllocations])

  // Calculate rebalancing recommendations
  const rebalancingRecommendations = useMemo(() => {
    const recommendations = allocationDrift.managerDrift
      .filter(item => Math.abs(item.drift) > 2) // Only show items with >2% drift
      .map(item => {
        const isOverweight = item.drift > 0
        const adjustmentAmount = (Math.abs(item.drift) / 100) * portfolioMetrics.totalPortfolioValue
        
        return {
          category: item.name,
          current: item.current,
          target: item.target,
          drift: item.drift,
          isOverweight,
          adjustmentAmount,
          action: isOverweight ? 'Reduce' : 'Increase',
        }
      })
      .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))

    return recommendations
  }, [allocationDrift, portfolioMetrics])

  // What-if scenario calculation
  const whatIfScenario = useMemo(() => {
    const newTotalValue = portfolioMetrics.totalPortfolioValue + whatIfCommitment
    const newAllocations = currentAllocationPercentages.byManager.map(alloc => ({
      name: alloc.name,
      currentValue: alloc.value,
      newValue: alloc.value, // Simplified - would need allocation input
      currentPercentage: alloc.percentage,
      newPercentage: (alloc.value / newTotalValue) * 100,
    }))

    return { newTotalValue, newAllocations }
  }, [currentAllocationPercentages, portfolioMetrics, whatIfCommitment])

  // Commitment pacing calculation
  const commitmentPacing = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const next5Years = Array.from({ length: 5 }, (_, i) => currentYear + i)
    
    // Calculate suggested annual commitments to maintain target allocation
    const annualPacing = next5Years.map(year => {
      const baseCommitment = portfolioMetrics.unfundedCommitments / 5 // Spread over 5 years
      const vintageAdjustment = year === currentYear ? 1.2 : year === currentYear + 1 ? 1.1 : 1.0
      
      return {
        year,
        suggested: baseCommitment * vintageAdjustment,
        deployed: year < currentYear + 2 ? baseCommitment * 0.8 : 0, // Historical for past years
      }
    })

    return annualPacing
  }, [portfolioMetrics])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'rebalance', label: 'Rebalancing', icon: Settings },
    { id: 'whatif', label: 'What-If Analysis', icon: TrendingUp },
    { id: 'pacing', label: 'Commitment Pacing', icon: Calendar },
  ]

  // Export Functions
  const handleExportPDF = async () => {
    const totalPositions = funds.length + directInvestments.length

    const doc = exportToPDF({
      title: 'Portfolio Builder Report',
      subtitle: 'Target Allocation Analysis and Rebalancing Recommendations',
      date: formatDateForExport(new Date()),
      sections: [
        {
          title: 'Portfolio Summary',
          type: 'metrics',
          data: [
            { label: 'Total Portfolio Value', value: formatCurrencyForExport(portfolioMetrics.totalPortfolioValue) },
            { label: 'Active Positions', value: totalPositions.toString() },
            { label: 'Allocation Drift', value: formatPercentForExport(allocationDrift.totalDrift) },
            { label: 'Unfunded Commitments', value: formatCurrencyForExport(portfolioMetrics.unfundedCommitments) },
          ],
        },
        {
          title: 'Current vs Target Allocation',
          type: 'table',
          data: {
            headers: ['Category', 'Current', 'Target', 'Drift'],
            rows: allocationDrift.managerDrift.map((item) => [
              item.name,
              formatPercentForExport(item.current),
              formatPercentForExport(item.target),
              formatPercentForExport(item.drift),
            ]),
          },
        },
        {
          title: 'Rebalancing Recommendations',
          type: 'table',
          data: {
            headers: ['Category', 'Action', 'Amount', 'Priority'],
            rows: rebalancingRecommendations.map((rec) => [
              rec.category,
              rec.action,
              formatCurrencyForExport(rec.adjustmentAmount),
              Math.abs(rec.drift) > 5 ? 'High' : 'Medium',
            ]),
          },
        },
        {
          title: 'What-If Analysis',
          type: 'summary',
          data: {
            'Proposed Commitment': formatCurrencyForExport(whatIfCommitment),
            'New Portfolio Value': formatCurrencyForExport(whatIfScenario.newTotalValue),
            'Increase': formatPercentForExport((whatIfCommitment / portfolioMetrics.totalPortfolioValue) * 100),
          },
        },
        {
          title: '5-Year Commitment Pacing Plan',
          type: 'table',
          data: {
            headers: ['Year', 'Suggested Commitments', 'Deployed Capital'],
            rows: commitmentPacing.map((p) => [
              p.year,
              formatCurrencyForExport(p.suggested),
              formatCurrencyForExport(p.deployed),
            ]),
          },
        },
      ],
    })

    doc.save(`portfolio-builder-report-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportExcel = async () => {
    const totalPositions = funds.length + directInvestments.length

    exportToExcel({
      filename: `portfolio-builder-report-${new Date().toISOString().split('T')[0]}`,
      sheets: [
        {
          name: 'Summary',
          data: [
            ['Portfolio Builder Report'],
            ['Generated', formatDateForExport(new Date())],
            [],
            ['Metric', 'Value'],
            ['Total Portfolio Value', portfolioMetrics.totalPortfolioValue],
            ['Active Positions', totalPositions],
            ['Allocation Drift', allocationDrift.totalDrift],
            ['Unfunded Commitments', portfolioMetrics.unfundedCommitments],
          ],
        },
        {
          name: 'Allocation',
          data: [
            ['Category', 'Current %', 'Target %', 'Drift %', 'Current Value'],
            ...allocationDrift.managerDrift.map((item) => [
              item.name,
              item.current,
              item.target,
              item.drift,
              currentAllocations.byManager[item.name] || 0,
            ]),
          ],
        },
        {
          name: 'Rebalancing',
          data: [
            ['Category', 'Action', 'Adjustment Amount', 'Drift %'],
            ...rebalancingRecommendations.map((rec) => [
              rec.category,
              rec.action,
              rec.adjustmentAmount,
              rec.drift,
            ]),
          ],
        },
        {
          name: 'Pacing Plan',
          data: [
            ['Year', 'Suggested Commitments', 'Deployed Capital'],
            ...commitmentPacing.map((p) => [p.year, p.suggested, p.deployed]),
          ],
        },
      ],
    })
  }

  const handleExportCSV = async () => {
    const csvData = [
      ['Category', 'Current %', 'Target %', 'Drift %', 'Current Value'],
      ...allocationDrift.managerDrift.map((item) => [
        item.name,
        item.current.toString(),
        item.target.toString(),
        item.drift.toString(),
        (currentAllocations.byManager[item.name] || 0).toString(),
      ]),
    ]

    exportToCSV(csvData, `portfolio-allocation-${new Date().toISOString().split('T')[0]}`)
  }

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
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    Portfolio Builder
                  </motion.span>
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-sm text-foreground/60 mt-0.5"
                >
                  Optimize allocations, rebalance holdings, and model target portfolios
                </motion.p>
              </div>
            </div>
            <ExportButton
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onExportCSV={handleExportCSV}
              label="Export Portfolio"
            />
          </div>
        </motion.div>

        {/* Status Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl border border-blue-200/60 dark:border-blue-800/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <PieChartIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-foreground">Portfolio Value</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(portfolioMetrics.totalPortfolioValue)}
            </p>
            <p className="text-xs text-foreground/60">Total NAV</p>
          </div>

          <div className={`bg-gradient-to-br ${
            allocationDrift.needsRebalancing 
              ? 'from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 border-amber-200/60 dark:border-amber-800/60'
              : 'from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 border-emerald-200/60 dark:border-emerald-800/60'
          } rounded-xl border p-6`}>
            <div className="flex items-center gap-2 mb-3">
              {allocationDrift.needsRebalancing ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
              <h3 className="text-sm font-semibold text-foreground">Allocation Drift</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatPercent(allocationDrift.totalDrift, 1)}
            </p>
            <p className="text-xs text-foreground/60">
              {allocationDrift.needsRebalancing ? 'Rebalance recommended' : 'On target'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10 rounded-xl border border-purple-200/60 dark:border-purple-800/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-foreground">Active Positions</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {funds.length + directInvestments.length}
            </p>
            <p className="text-xs text-foreground/60">{funds.length} funds, {directInvestments.length} direct</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 dark:from-orange-500/20 dark:to-orange-600/10 rounded-xl border border-orange-200/60 dark:border-orange-800/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-sm font-semibold text-foreground">Unfunded</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(portfolioMetrics.unfundedCommitments)}
            </p>
            <p className="text-xs text-foreground/60">Available capacity</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            {/* Current vs Target Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Current Allocation</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={currentAllocationPercentages.byManager}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {currentAllocationPercentages.byManager.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Target vs Current</h3>
                <div className="space-y-4">
                  {allocationDrift.managerDrift.slice(0, 6).map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        <span className={`text-sm font-semibold ${
                          Math.abs(item.drift) > 5 
                            ? 'text-red-600 dark:text-red-400'
                            : Math.abs(item.drift) > 2
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {item.drift > 0 ? '+' : ''}{formatPercent(item.drift, 1)}
                        </span>
                      </div>
                      <div className="relative h-8 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                        <div
                          className="absolute h-full bg-blue-500/30 border-r-2 border-blue-500"
                          style={{ width: `${item.target}%` }}
                        />
                        <div
                          className={`absolute h-full ${
                            item.drift > 0 ? 'bg-red-500' : item.drift < 0 ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${item.current}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-white">
                            {formatPercent(item.current, 1)} / {formatPercent(item.target, 1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Geographic Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={currentAllocationPercentages.byGeography}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `${value.toFixed(0)}%`} />
                  <Tooltip formatter={(value: number) => `${formatPercent(value as number, 1)} (${formatCurrency(value * portfolioMetrics.totalPortfolioValue / 100)})`} />
                  <Bar dataKey="percentage" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Rebalancing Tab */}
        {activeTab === 'rebalance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            {/* Rebalancing Alert */}
            {allocationDrift.needsRebalancing && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Rebalancing Recommended</h3>
                    <p className="text-sm text-foreground/60 mb-4">
                      Your portfolio has drifted {formatPercent(allocationDrift.totalDrift, 1)} from target allocations.
                      Consider rebalancing to maintain your desired risk profile.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rebalancing Recommendations */}
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recommended Actions</h3>
              {rebalancingRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {rebalancingRecommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <ArrowRight className={`w-5 h-5 ${
                            rec.isOverweight 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`} />
                          <h4 className="text-sm font-semibold text-foreground">{rec.action} {rec.category}</h4>
                        </div>
                        <p className="text-xs text-foreground/60 mb-2">
                          Current: {formatPercent(rec.current, 1)} → Target: {formatPercent(rec.target, 1)}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {rec.action} exposure by {formatCurrency(rec.adjustmentAmount)}
                          </span>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg ${
                        Math.abs(rec.drift) > 5
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        <p className="text-lg font-bold">
                          {rec.drift > 0 ? '+' : ''}{formatPercent(rec.drift, 1)}
                        </p>
                        <p className="text-xs">drift</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-foreground/60">Portfolio is well-balanced. No rebalancing needed at this time.</p>
                </div>
              )}
            </div>

            {/* Impact Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Rebalancing Impact</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-foreground">Expected Transactions</span>
                    <span className="text-sm font-semibold text-foreground">{rebalancingRecommendations.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-foreground">Total Adjustment</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(rebalancingRecommendations.reduce((sum, r) => sum + r.adjustmentAmount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-foreground">Risk Reduction</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPercent(allocationDrift.totalDrift * 0.8, 1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Implementation Timeline</h3>
                <div className="space-y-3">
                  {['Month 1-2', 'Month 3-4', 'Month 5-6'].map((period, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{period}</p>
                        <p className="text-xs text-foreground/60">
                          {index === 0 ? 'Execute high-priority rebalancing' : 
                           index === 1 ? 'Deploy new capital to underweight categories' : 
                           'Monitor and fine-tune allocations'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* What-If Tab */}
        {activeTab === 'whatif' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            {/* Input Panel */}
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Scenario Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">New Commitment Amount</label>
                  <input
                    type="number"
                    value={whatIfCommitment}
                    onChange={(e) => setWhatIfCommitment(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-foreground/60 mt-2">
                    Current: {formatCurrency(portfolioMetrics.totalPortfolioValue)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Target Category</label>
                  <select className="w-full px-4 py-3 border border-border rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent">
                    <option>Venture Capital</option>
                    <option>Private Equity</option>
                    <option>Growth Equity</option>
                    <option>Other</option>
                  </select>
                  <p className="text-xs text-foreground/60 mt-2">
                    Select allocation target
                  </p>
                </div>
              </div>
            </div>

            {/* Impact Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio Impact</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-foreground/60 mb-1">New Portfolio Value</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(whatIfScenario.newTotalValue)}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      +{formatPercent((whatIfCommitment / portfolioMetrics.totalPortfolioValue) * 100, 1)} increase
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-xs text-foreground/60 mb-1">Total Commitments</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(portfolioMetrics.totalCommitment + whatIfCommitment)}
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-xs text-foreground/60 mb-1">Diversification Impact</p>
                    <p className="text-2xl font-bold text-foreground">
                      {whatIfCommitment > portfolioMetrics.totalPortfolioValue * 0.1 ? 'Improved' : 'Minimal'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Allocation Changes</h3>
                <div className="space-y-3">
                  {whatIfScenario.newAllocations.slice(0, 5).map((alloc, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{alloc.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-foreground/60">
                          {formatPercent(alloc.currentPercentage, 1)}
                        </span>
                        <ArrowRight className="w-4 h-4 text-foreground/40" />
                        <span className="text-sm font-semibold text-foreground">
                          {formatPercent(alloc.newPercentage, 1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pacing Tab */}
        {activeTab === 'pacing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">5-Year Commitment Pacing</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={commitmentPacing}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="suggested" fill="#10b981" name="Suggested" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="deployed" fill="#3b82f6" name="Deployed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Pacing Recommendations</h3>
                <div className="space-y-3">
                  {commitmentPacing.map((year, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">{year.year}</p>
                        <p className="text-xs text-foreground/60">Annual commitment</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{formatCurrency(year.suggested)}</p>
                        <p className="text-xs text-foreground/60">
                          {year.deployed > 0 && `${formatPercent((year.deployed / year.suggested) * 100, 0)} deployed`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Pacing Strategy</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Steady State</h4>
                    <p className="text-xs text-foreground/60">
                      Maintain consistent annual commitments of ~{formatCurrency(portfolioMetrics.unfundedCommitments / 5)} 
                      to match distributions and maintain portfolio size.
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Growth Mode</h4>
                    <p className="text-xs text-foreground/60">
                      Increase near-term commitments by 20% to grow portfolio and improve vintage diversification.
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Vintage Diversification</h4>
                    <p className="text-xs text-foreground/60">
                      Spread commitments across 2-3 vintages per year to reduce vintage concentration risk.
                    </p>
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
