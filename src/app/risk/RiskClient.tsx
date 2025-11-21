'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  AlertCircle,
  TrendingUp,
  PieChart,
  Activity,
  ChevronRight,
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
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts'

interface Fund {
  id: string
  name: string
  manager: string
  domicile: string
  commitment: number
  paidIn: number
  nav: number
  assetClass: string
}

interface DirectInvestment {
  id: string
  name: string
  industry: string | null
  investmentAmount: number | null
  currentValue: number | null
  assetClass: string
}

interface RiskMetrics {
  totalPortfolio: number
  totalCommitment: number
  unfundedCommitments: number
  assetClassConcentration: { [key: string]: number }
  geographyConcentration: { [key: string]: number }
}

interface RiskClientProps {
  funds: Fund[]
  directInvestments: DirectInvestment[]
  riskMetrics: RiskMetrics
  assetClasses: string[]
}

const calculateRiskMetricsFromFunds = (
  funds: Fund[],
  directInvestments: DirectInvestment[]
): RiskMetrics => {
  const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
  const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
  const totalDI = directInvestments.reduce((sum, di) => sum + (di.currentValue || 0), 0)
  const totalPortfolio = totalNav + totalDI
  const unfundedCommitments = funds.reduce((sum, fund) => sum + (fund.commitment - fund.paidIn), 0)

  const assetClassConcentration = funds.reduce((acc: { [key: string]: number }, fund) => {
    const cls = fund.assetClass || 'Multi-Strategy'
    acc[cls] = (acc[cls] || 0) + fund.nav
    return acc
  }, {})

  const geographyConcentration = funds.reduce((acc: { [key: string]: number }, fund) => {
    const geo = fund.domicile || 'Unknown'
    acc[geo] = (acc[geo] || 0) + fund.nav
    return acc
  }, {})

  return {
    totalPortfolio,
    totalCommitment,
    unfundedCommitments,
    assetClassConcentration,
    geographyConcentration,
  }
}

const COLORS = ['#4b6c9c', '#2d7a5f', '#6d5d8a', '#c77340', '#3b82f6', '#10b981', '#ef4444', '#a85f35']

export function RiskClient({ funds, directInvestments, riskMetrics, assetClasses }: RiskClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'concentration' | 'stress' | 'liquidity'>('overview')
  const [filterMode, setFilterMode] = useState<'portfolio' | 'fund' | 'assetClass'>('portfolio')
  const [selectedFundId, setSelectedFundId] = useState('all')
  const [selectedAssetClass, setSelectedAssetClass] = useState('all')

  useEffect(() => {
    if (filterMode !== 'fund') {
      setSelectedFundId('all')
    }
    if (filterMode !== 'assetClass') {
      setSelectedAssetClass('all')
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

  const currentRiskMetrics = useMemo(() => {
    if (filterMode === 'portfolio') return riskMetrics
    return calculateRiskMetricsFromFunds(filteredFunds, filteredDirectInvestments)
  }, [filterMode, riskMetrics, filteredFunds, filteredDirectInvestments])

  const fundsForDisplay = filterMode === 'portfolio' ? funds : filteredFunds
  const directInvestmentsForDisplay =
    filterMode === 'portfolio' ? directInvestments : filteredDirectInvestments

  const selectedFundName = useMemo(() => {
    if (selectedFundId === 'all') return 'All Funds'
    return funds.find((fund) => fund.id === selectedFundId)?.name || 'Selected Fund'
  }, [selectedFundId, funds])

  const focusDescription = useMemo(() => {
    if (filterMode === 'fund' && selectedFundId !== 'all') {
      return selectedFundName
    }
    if (filterMode === 'assetClass' && selectedAssetClass !== 'all') {
      return `${selectedAssetClass} exposure`
    }
    return 'Entire portfolio'
  }, [filterMode, selectedFundId, selectedAssetClass, selectedFundName])

  // Calculate risk score (simplified)
  const calculateRiskScore = () => {
    // Concentration risk
    const concentrationScores = Object.values(currentRiskMetrics.assetClassConcentration).map(
      (value) => (value / currentRiskMetrics.totalPortfolio) * 100
    )
    const maxConcentration = Math.max(...concentrationScores, 0)
    const concentrationRisk = maxConcentration > 40 ? 8 : maxConcentration > 30 ? 6 : maxConcentration > 20 ? 4 : 2

    // Liquidity risk
    const liquidityRatio = currentRiskMetrics.unfundedCommitments / currentRiskMetrics.totalPortfolio
    const liquidityRisk = liquidityRatio > 0.5 ? 8 : liquidityRatio > 0.3 ? 6 : liquidityRatio > 0.1 ? 4 : 2

    // Average the risks
    return ((concentrationRisk + liquidityRisk) / 2).toFixed(1)
  }

  const riskScore = calculateRiskScore()

  // Prepare data for charts
  const assetClassData = Object.entries(currentRiskMetrics.assetClassConcentration).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / currentRiskMetrics.totalPortfolio) * 100).toFixed(1),
  }))

  const geographyData = Object.entries(currentRiskMetrics.geographyConcentration).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / currentRiskMetrics.totalPortfolio) * 100).toFixed(1),
  }))

  // Identify concentration violations (>30% rule)
  const violations = assetClassData.filter((item) => parseFloat(item.percentage) > 30)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'concentration', label: 'Concentration', icon: PieChart },
    { id: 'stress', label: 'Stress Testing', icon: Activity },
    { id: 'liquidity', label: 'Liquidity & VaR', icon: TrendingUp },
  ]

  // Export Functions
  const handleExportPDF = async () => {
    const totalPositions = fundsForDisplay.length + directInvestmentsForDisplay.length
    const concentrationRisk = Math.max(
      ...Object.values(currentRiskMetrics.assetClassConcentration).map(
        (v) => (v / currentRiskMetrics.totalPortfolio) * 100
      )
    )
    const liquidityRisk = (currentRiskMetrics.unfundedCommitments / currentRiskMetrics.totalPortfolio) * 100
    const dailyVaR = currentRiskMetrics.totalPortfolio * 0.02 * 1.65

    const doc = exportToPDF({
      title: 'Risk Management Report',
      subtitle: 'Portfolio Risk Analysis and Stress Testing',
      date: formatDateForExport(new Date()),
      sections: [
        {
          title: 'Risk Overview',
          type: 'metrics',
          data: [
            { label: 'Overall Risk Score', value: `${riskScore} / 10` },
            { label: 'Total Portfolio Value', value: formatCurrencyForExport(currentRiskMetrics.totalPortfolio) },
            { label: 'Active Positions', value: totalPositions.toString() },
            { label: 'Policy Violations', value: violations.length.toString() },
            { label: 'Concentration Risk', value: formatPercentForExport(concentrationRisk) },
            { label: 'Liquidity Risk', value: formatPercentForExport(liquidityRisk) },
          ],
        },
        {
          title: 'Asset Class Allocation',
          type: 'table',
          data: {
            headers: ['Asset Class', 'Value', 'Percentage'],
            rows: assetClassData.map((item) => [
              item.name,
              formatCurrencyForExport(item.value),
              `${item.percentage}%`,
            ]),
          },
        },
        {
          title: 'Concentration Analysis',
          type: 'table',
          data: {
            headers: ['Category', 'Exposure', 'Percentage', 'Status'],
            rows: assetClassData.map((item) => {
              const pct = parseFloat(item.percentage)
              return [
                item.name,
                formatCurrencyForExport(item.value),
                `${item.percentage}%`,
                pct > 30 ? 'Violation' : pct > 25 ? 'Warning' : 'Within Policy',
              ]
            }),
          },
        },
        {
          title: 'Value at Risk (95% Confidence)',
          type: 'summary',
          data: {
            'Daily VaR': formatCurrencyForExport(dailyVaR),
            'Monthly VaR': formatCurrencyForExport(dailyVaR * 4.47),
            'Annual VaR': formatCurrencyForExport(dailyVaR * 15.87),
          },
        },
        {
          title: 'Unfunded Commitments',
          type: 'table',
          data: {
            headers: ['Fund', 'Manager', 'Commitment', 'Paid In', 'Unfunded'],
            rows: fundsForDisplay.map((fund) => [
              fund.name,
              fund.manager,
              formatCurrencyForExport(fund.commitment),
              formatCurrencyForExport(fund.paidIn),
              formatCurrencyForExport(fund.commitment - fund.paidIn),
            ]),
          },
        },
      ],
    })

    doc.save(`risk-report-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportExcel = async () => {
    const totalPositions = fundsForDisplay.length + directInvestmentsForDisplay.length
    const concentrationRisk = Math.max(
      ...Object.values(currentRiskMetrics.assetClassConcentration).map(
        (v) => (v / currentRiskMetrics.totalPortfolio) * 100
      )
    )
    const liquidityRisk = (currentRiskMetrics.unfundedCommitments / currentRiskMetrics.totalPortfolio) * 100

    exportToExcel({
      filename: `risk-report-${new Date().toISOString().split('T')[0]}`,
      sheets: [
        {
          name: 'Risk Overview',
          data: [
            ['Risk Management Report'],
            ['Generated', formatDateForExport(new Date())],
            [],
            ['Metric', 'Value'],
            ['Overall Risk Score', `${riskScore} / 10`],
            ['Total Portfolio Value', formatCurrencyForExport(currentRiskMetrics.totalPortfolio)],
            ['Active Positions', totalPositions.toString()],
            ['Policy Violations', violations.length.toString()],
            ['Concentration Risk', formatPercentForExport(concentrationRisk)],
            ['Liquidity Risk', formatPercentForExport(liquidityRisk)],
          ],
        },
        {
          name: 'Asset Allocation',
          data: [
            ['Asset Class', 'Value', 'Percentage'],
            ...assetClassData.map((item) => [
              item.name,
              item.value,
              `${item.percentage}%`,
            ]),
          ],
        },
        {
          name: 'Funds',
          data: [
            ['Fund', 'Manager', 'Domicile', 'Commitment', 'Paid In', 'NAV', 'Unfunded'],
            ...fundsForDisplay.map((fund) => [
              fund.name,
              fund.manager,
              fund.domicile,
              fund.commitment,
              fund.paidIn,
              fund.nav,
              fund.commitment - fund.paidIn,
            ]),
          ],
        },
        {
          name: 'Direct Investments',
          data: [
            ['Name', 'Industry', 'Investment', 'Current Value'],
            ...directInvestmentsForDisplay.map((di) => [
              di.name,
              di.industry || 'N/A',
              di.investmentAmount || 0,
              di.currentValue || 0,
            ]),
          ],
        },
      ],
    })
  }

  const handleExportCSV = async () => {
    const csvData = [
      ['Asset Class', 'Value', 'Percentage'],
      ...assetClassData.map((item) => [
        item.name,
        item.value.toString(),
        `${item.percentage}%`,
      ]),
    ]

    exportToCSV(csvData, `risk-asset-allocation-${new Date().toISOString().split('T')[0]}`)
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    Risk Management
                  </motion.span>
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-sm text-foreground/60 mt-0.5"
                >
                  Monitor concentration, stress test scenarios, and track policy compliance
                </motion.p>
              </div>
            </div>
            <ExportButton
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onExportCSV={handleExportCSV}
              label="Export Report"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-foreground/70">Focus:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Portfolio', value: 'portfolio' },
                  { label: 'Fund', value: 'fund' },
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
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                  Fund
                </label>
                <select
                  value={selectedFundId}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                  className="w-full md:w-72 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
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
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                  Asset Class
                </label>
                <select
                  value={selectedAssetClass}
                  onChange={(e) => setSelectedAssetClass(e.target.value)}
                  className="w-full md:w-72 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
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

            <p className="text-xs text-foreground/60">Viewing: {focusDescription}</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
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
          <>
            {/* Risk Score and Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8"
            >
              {/* Risk Score Card */}
              <div className="lg:col-span-1 bg-gradient-to-br from-red-500/10 to-rose-600/5 dark:from-red-500/20 dark:to-rose-600/10 rounded-xl border border-red-200/60 dark:border-red-800/60 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-sm font-semibold text-foreground">Risk Score</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">{riskScore}</span>
                  <span className="text-lg text-foreground/60">/10</span>
                </div>
                <p className="text-xs text-foreground/60 mt-2">
                  {parseFloat(riskScore) < 5 ? 'Low Risk' : parseFloat(riskScore) < 7 ? 'Moderate Risk' : 'High Risk'}
                </p>
              </div>

              {/* Violations */}
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 rounded-xl border border-amber-200/60 dark:border-amber-800/60 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-semibold text-foreground">Policy Violations</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">{violations.length}</span>
                  <span className="text-lg text-foreground/60">active</span>
                </div>
                <p className="text-xs text-foreground/60 mt-2">Concentration limits breached</p>
              </div>

              {/* Portfolio Value */}
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl border border-blue-200/60 dark:border-blue-800/60 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <PieChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-semibold text-foreground">Portfolio Value</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{formatCurrency(currentRiskMetrics.totalPortfolio)}</span>
                </div>
                <p className="text-xs text-foreground/60 mt-2">Total NAV across all investments</p>
              </div>

              {/* Unfunded */}
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10 rounded-xl border border-purple-200/60 dark:border-purple-800/60 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-semibold text-foreground">Unfunded</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{formatCurrency(currentRiskMetrics.unfundedCommitments)}</span>
                </div>
                <p className="text-xs text-foreground/60 mt-2">
                  {formatPercent((currentRiskMetrics.unfundedCommitments / currentRiskMetrics.totalCommitment) * 100)} of commitments
                </p>
              </div>
            </motion.div>

            {/* Violations Alert */}
            {violations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      Concentration Limit Violations
                    </h4>
                    <div className="space-y-1">
                      {violations.map((violation) => (
                        <p key={violation.name} className="text-sm text-amber-800 dark:text-amber-200">
                          • <strong>{violation.name}</strong> exceeds 30% limit at {violation.percentage}% (
                          {formatCurrency(violation.value)})
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Class Concentration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4">Asset Class Concentration</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={assetClassData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {assetClassData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RePieChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Geography Concentration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4">Geographic Concentration</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={geographyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#4b6c9c" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </>
        )}

        {/* Concentration Analysis Tab */}
        {activeTab === 'concentration' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Concentration Analysis</h2>
              <p className="text-foreground/60 mb-6">
                Detailed breakdown of portfolio concentration across different dimensions
              </p>
              
              {/* Concentration Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-surface rounded-xl border border-border p-4">
                  <p className="text-xs text-foreground/60 mb-1">Top Manager</p>
                  <p className="text-2xl font-bold text-foreground">
                    {assetClassData.length > 0 ? Math.max(...assetClassData.map(d => parseFloat(d.percentage))).toFixed(1) : '0'}%
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {assetClassData.length > 0 ? assetClassData.reduce((max, d) => parseFloat(d.percentage) > parseFloat(max.percentage) ? d : max).name : 'N/A'}
                  </p>
                </div>
                
                <div className="bg-white dark:bg-surface rounded-xl border border-border p-4">
                  <p className="text-xs text-foreground/60 mb-1">Top Geography</p>
                  <p className="text-2xl font-bold text-foreground">
                    {geographyData.length > 0 ? Math.max(...geographyData.map(d => parseFloat(d.percentage))).toFixed(1) : '0'}%
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {geographyData.length > 0 ? geographyData.reduce((max, d) => parseFloat(d.percentage) > parseFloat(max.percentage) ? d : max).name : 'N/A'}
                  </p>
                </div>
                
                <div className="bg-white dark:bg-surface rounded-xl border border-border p-4">
                  <p className="text-xs text-foreground/60 mb-1">Number of Managers</p>
                  <p className="text-2xl font-bold text-foreground">{assetClassData.length}</p>
                  <p className="text-xs text-foreground/60 mt-1">Unique managers</p>
                </div>
                
                <div className="bg-white dark:bg-surface rounded-xl border border-border p-4">
                  <p className="text-xs text-foreground/60 mb-1">Diversification</p>
                  <p className="text-2xl font-bold text-foreground">
                    {assetClassData.length > 3 ? 'Good' : assetClassData.length > 1 ? 'Moderate' : 'Low'}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">Portfolio spread</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Manager Concentration (Pie) */}
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Manager Concentration</h3>
                  {assetClassData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={assetClassData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {assetClassData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-foreground/40">
                      No data available
                    </div>
                  )}
                </div>

                {/* Geography Concentration (Bar) */}
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Geographic Distribution</h3>
                  {geographyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={geographyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="value" fill="#4b6c9c" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-foreground/40">
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Manager Breakdown Table */}
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Manager Breakdown</h3>
                  <div className="space-y-2">
                    {assetClassData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(item.value)}</p>
                          <p className={`text-xs ${
                            parseFloat(item.percentage) > 30 
                              ? 'text-red-600 dark:text-red-400 font-semibold' 
                              : 'text-foreground/60'
                          }`}>
                            {item.percentage}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Geography Breakdown Table */}
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Geography Breakdown</h3>
                  <div className="space-y-2">
                    {geographyData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(item.value)}</p>
                          <p className={`text-xs ${
                            parseFloat(item.percentage) > 40 
                              ? 'text-red-600 dark:text-red-400 font-semibold' 
                              : 'text-foreground/60'
                          }`}>
                            {item.percentage}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Stress Testing Tab */}
        {activeTab === 'stress' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Stress Testing & Scenario Analysis</h2>
              <p className="text-foreground/60 mb-6">
                Model portfolio performance under various market scenarios
              </p>

              {/* Scenario Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { name: 'Mild Downturn', impact: -15, color: 'amber', desc: '15% market decline' },
                  { name: 'Severe Recession', impact: -30, color: 'orange', desc: '30% market decline' },
                  { name: 'Financial Crisis', impact: -50, color: 'red', desc: '50% market decline' },
                ].map((scenario) => {
                  const impactedValue = currentRiskMetrics.totalPortfolio * (1 + scenario.impact / 100)
                  const impactAmount = impactedValue - currentRiskMetrics.totalPortfolio
                  
                  return (
                    <div
                      key={scenario.name}
                      className={`bg-gradient-to-br ${
                        scenario.color === 'amber'
                          ? 'from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 border-amber-200/60 dark:border-amber-800/60'
                          : scenario.color === 'orange'
                          ? 'from-orange-500/10 to-orange-600/5 dark:from-orange-500/20 dark:to-orange-600/10 border-orange-200/60 dark:border-orange-800/60'
                          : 'from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 border-red-200/60 dark:border-red-800/60'
                      } rounded-xl border p-6`}
                    >
                      <h3 className="text-lg font-semibold text-foreground mb-2">{scenario.name}</h3>
                      <p className="text-sm text-foreground/60 mb-4">{scenario.desc}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-foreground/60">Current Value</span>
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(currentRiskMetrics.totalPortfolio)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-foreground/60">Stressed Value</span>
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(impactedValue)}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-border">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-foreground/60">Impact</span>
                            <span className={`text-sm font-bold ${
                              scenario.color === 'amber'
                                ? 'text-amber-600 dark:text-amber-400'
                                : scenario.color === 'orange'
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {formatCurrency(impactAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Scenario Comparison Chart */}
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6 mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Scenario Impact Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { scenario: 'Current', value: currentRiskMetrics.totalPortfolio },
                      { scenario: 'Mild (-15%)', value: currentRiskMetrics.totalPortfolio * 0.85 },
                      { scenario: 'Severe (-30%)', value: currentRiskMetrics.totalPortfolio * 0.7 },
                      { scenario: 'Crisis (-50%)', value: currentRiskMetrics.totalPortfolio * 0.5 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="scenario" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sensitivity Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Key Risk Factors</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground">Market Risk</span>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">High</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground">Concentration Risk</span>
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Medium</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground">Liquidity Risk</span>
                        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                          {currentRiskMetrics.unfundedCommitments / currentRiskMetrics.totalPortfolio > 0.3 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((currentRiskMetrics.unfundedCommitments / currentRiskMetrics.totalPortfolio) * 100, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Historical Comparisons</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">2008 Financial Crisis</p>
                        <p className="text-xs text-foreground/60">Avg. decline: -37%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(currentRiskMetrics.totalPortfolio * 0.63)}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">2020 COVID Crash</p>
                        <p className="text-xs text-foreground/60">Avg. decline: -20%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                          {formatCurrency(currentRiskMetrics.totalPortfolio * 0.8)}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">2022 Tech Correction</p>
                        <p className="text-xs text-foreground/60">Avg. decline: -25%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                          {formatCurrency(currentRiskMetrics.totalPortfolio * 0.75)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Liquidity & VaR Tab */}
        {activeTab === 'liquidity' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Liquidity Analysis & Value at Risk</h2>
              <p className="text-foreground/60 mb-6">
                Monitor unfunded commitments, liquidity requirements, and value at risk metrics
              </p>

              {/* Key Liquidity Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl border border-blue-200/60 dark:border-blue-800/60 p-4">
                  <p className="text-xs text-foreground/60 mb-1">Unfunded Commitments</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(currentRiskMetrics.unfundedCommitments)}</p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {formatPercent((currentRiskMetrics.unfundedCommitments / currentRiskMetrics.totalCommitment) * 100, 1)} of commitments
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 p-4">
                  <p className="text-xs text-foreground/60 mb-1">Liquidity Ratio</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatPercent((currentRiskMetrics.unfundedCommitments / currentRiskMetrics.totalPortfolio) * 100, 1)}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {(currentRiskMetrics.unfundedCommitments / currentRiskMetrics.totalPortfolio) > 0.5 ? 'High risk' : 'Manageable'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 rounded-xl border border-amber-200/60 dark:border-amber-800/60 p-4">
                  <p className="text-xs text-foreground/60 mb-1">Avg. Quarterly Call</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(currentRiskMetrics.unfundedCommitments * 0.15)}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">Est. based on pace</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10 rounded-xl border border-purple-200/60 dark:border-purple-800/60 p-4">
                  <p className="text-xs text-foreground/60 mb-1">Est. Duration</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.ceil((currentRiskMetrics.unfundedCommitments / (currentRiskMetrics.unfundedCommitments * 0.15)) / 4)}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">Years to deploy</p>
                </div>
              </div>

              {/* Unfunded Timeline */}
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6 mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Projected Capital Call Timeline</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={[
                      { period: 'Q1 2025', amount: currentRiskMetrics.unfundedCommitments * 0.15 },
                      { period: 'Q2 2025', amount: currentRiskMetrics.unfundedCommitments * 0.18 },
                      { period: 'Q3 2025', amount: currentRiskMetrics.unfundedCommitments * 0.12 },
                      { period: 'Q4 2025', amount: currentRiskMetrics.unfundedCommitments * 0.16 },
                      { period: 'Q1 2026', amount: currentRiskMetrics.unfundedCommitments * 0.14 },
                      { period: 'Q2 2026', amount: currentRiskMetrics.unfundedCommitments * 0.10 },
                      { period: 'Q3 2026', amount: currentRiskMetrics.unfundedCommitments * 0.08 },
                      { period: 'Q4 2026', amount: currentRiskMetrics.unfundedCommitments * 0.07 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="amount" stroke="#4b6c9c" fill="#4b6c9c" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* VaR and Risk Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Value at Risk (VaR)</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground">Daily VaR (95%)</span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(currentRiskMetrics.totalPortfolio * 0.02)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/60">
                        95% confidence: max daily loss won't exceed this amount
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground">Monthly VaR (95%)</span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(currentRiskMetrics.totalPortfolio * 0.08)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/60">
                        95% confidence: max monthly loss won't exceed this amount
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground">Expected Shortfall (CVaR)</span>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(currentRiskMetrics.totalPortfolio * 0.12)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/60">
                        Average loss when VaR threshold is exceeded
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Liquidity Requirements</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">Next 12 Months</p>
                        <p className="text-xs text-foreground/60">Estimated calls</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(currentRiskMetrics.unfundedCommitments * 0.6)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">Next 24 Months</p>
                        <p className="text-xs text-foreground/60">Total projected</p>
                      </div>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(currentRiskMetrics.unfundedCommitments * 0.85)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">Reserve Buffer</p>
                        <p className="text-xs text-foreground/60">Recommended 15%</p>
                      </div>
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(currentRiskMetrics.unfundedCommitments * 0.9)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fund-by-Fund Breakdown */}
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Unfunded Commitments by Fund</h3>
                <div className="space-y-2">
                  {fundsForDisplay.slice(0, 10).map((fund, index) => {
                    const unfunded = fund.commitment - fund.paidIn
                    const percentage =
                      currentRiskMetrics.unfundedCommitments > 0
                        ? (unfunded / currentRiskMetrics.unfundedCommitments) * 100
                        : 0
                    return (
                      <div key={fund.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{fund.name}</p>
                          <p className="text-xs text-foreground/60">{fund.manager}</p>
                        </div>
                        <div className="w-32">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-1">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-foreground/60 text-right">{percentage.toFixed(1)}%</p>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(unfunded)}</p>
                          <p className="text-xs text-foreground/60">
                            {formatPercent((unfunded / fund.commitment) * 100, 0)} left
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  )
}
