'use client'

import { motion } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { RiskScenarioResult } from '@/lib/riskEngine'

interface StressTestPanelProps {
  scenarios: RiskScenarioResult[]
}

export function StressTestPanel({ scenarios }: StressTestPanelProps) {
  if (!scenarios?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-surface rounded-2xl border border-border dark:border-slate-800/60 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Stress Test Scenarios</h3>
          <p className="text-sm text-foreground/60">Modeled drawdowns and liquidity coverage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {scenarios.map((scenario) => (
          <div
            key={scenario.name}
            className={`rounded-2xl border p-4 ${
              scenario.liquidityGap > 0
                ? 'border-red-200/60 dark:border-red-800/60 bg-red-500/5'
                : 'border-border dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">{scenario.name}</p>
              <span className="text-xs font-semibold text-foreground/60">
                {(scenario.navShock * 100).toFixed(0)}% NAV
              </span>
            </div>
            <div className="text-xs text-foreground/60 mb-2">Coverage {scenario.coverageRatio.toFixed(2)}x</div>
            <div className="space-y-1 text-sm text-foreground/80">
              <p>Calls: {formatCurrency(scenario.projectedCalls)}</p>
              <p>Dists: {formatCurrency(scenario.projectedDistributions)}</p>
              <p className={`font-semibold ${scenario.liquidityGap > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {scenario.liquidityGap > 0
                  ? `Gap ${formatCurrency(scenario.liquidityGap)}`
                  : 'Fully covered'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={scenarios}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1_000_000).toFixed(1)}M`} />
          <Tooltip formatter={(value: number, name) => [formatCurrency(value), name === 'projectedCalls' ? 'Capital Calls' : 'Distributions']} />
          <Bar dataKey="projectedCalls" fill="#f97316" name="Capital Calls" />
          <Bar dataKey="projectedDistributions" fill="#10b981" name="Distributions" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
