'use client'

import { useState } from 'react'
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
import { formatCurrency, formatPercent } from '@/lib/utils'
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
} from 'recharts'

interface Fund {
  id: string
  name: string
  manager: string
  domicile: string
  commitment: number
  paidIn: number
  nav: number
}

interface DirectInvestment {
  id: string
  name: string
  industry: string | null
  investmentAmount: number | null
  currentValue: number | null
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
}

const COLORS = ['#4b6c9c', '#2d7a5f', '#6d5d8a', '#c77340', '#3b82f6', '#10b981', '#ef4444', '#a85f35']

export function RiskClient({ funds, directInvestments, riskMetrics }: RiskClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'concentration' | 'stress' | 'liquidity'>('overview')

  // Calculate risk score (simplified)
  const calculateRiskScore = () => {
    // Concentration risk
    const concentrationScores = Object.values(riskMetrics.assetClassConcentration).map(
      (value) => (value / riskMetrics.totalPortfolio) * 100
    )
    const maxConcentration = Math.max(...concentrationScores, 0)
    const concentrationRisk = maxConcentration > 40 ? 8 : maxConcentration > 30 ? 6 : maxConcentration > 20 ? 4 : 2

    // Liquidity risk
    const liquidityRatio = riskMetrics.unfundedCommitments / riskMetrics.totalPortfolio
    const liquidityRisk = liquidityRatio > 0.5 ? 8 : liquidityRatio > 0.3 ? 6 : liquidityRisk > 0.1 ? 4 : 2

    // Average the risks
    return ((concentrationRisk + liquidityRisk) / 2).toFixed(1)
  }

  const riskScore = calculateRiskScore()

  // Prepare data for charts
  const assetClassData = Object.entries(riskMetrics.assetClassConcentration).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / riskMetrics.totalPortfolio) * 100).toFixed(1),
  }))

  const geographyData = Object.entries(riskMetrics.geographyConcentration).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / riskMetrics.totalPortfolio) * 100).toFixed(1),
  }))

  // Identify concentration violations (>30% rule)
  const violations = assetClassData.filter((item) => parseFloat(item.percentage) > 30)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'concentration', label: 'Concentration', icon: PieChart },
    { id: 'stress', label: 'Stress Testing', icon: Activity },
    { id: 'liquidity', label: 'Liquidity & VaR', icon: TrendingUp },
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
                  <span className="text-2xl font-bold text-foreground">{formatCurrency(riskMetrics.totalPortfolio)}</span>
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
                  <span className="text-2xl font-bold text-foreground">{formatCurrency(riskMetrics.unfundedCommitments)}</span>
                </div>
                <p className="text-xs text-foreground/60 mt-2">
                  {formatPercent((riskMetrics.unfundedCommitments / riskMetrics.totalCommitment) * 100)} of commitments
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

        {/* Other Tabs - Coming Soon */}
        {activeTab !== 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h3>
              <p className="text-foreground/60 mb-6">
                This section is under development and will be available soon.
              </p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}

