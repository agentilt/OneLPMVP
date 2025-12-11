'use client'

import { motion } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { RiskScenarioResult } from '@/lib/riskEngine'

interface StressTestPanelProps {
  scenarios: RiskScenarioResult[]
}

// Enhanced color scheme
const CHART_COLORS = {
  calls: '#dc2626', // Bold red for capital calls
  distributions: '#059669', // Bold emerald for distributions
  callsHover: '#b91c1c',
  distributionsHover: '#047857',
}

// Improved styling constants
const AXIS_STYLE = {
  fontSize: 13,
  fontWeight: 500,
  fill: '#475569', // slate-600
}

const GRID_STYLE = {
  stroke: '#e2e8f0', // slate-200
  strokeDasharray: '3 3',
  opacity: 0.6,
}

export function StressTestPanel({ scenarios }: StressTestPanelProps) {
  if (!scenarios?.length) return null

  // Custom tooltip with enhanced readability
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel border border-border rounded-xl shadow-2xl p-4">
          <p className="font-bold text-base mb-3 text-foreground">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-foreground/80">
                    {entry.name}:
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10"
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
            className={`rounded-2xl border p-4 transition-all hover:shadow-md glass-panel ${
              scenario.liquidityGap > 0
                ? 'border-red-300/70 dark:border-red-800/80'
                : 'border-emerald-200/70 dark:border-emerald-800/60'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">{scenario.name}</p>
              <span className="px-2 py-1 text-xs font-bold glass-panel border border-border/60 text-foreground rounded-md">
                {(scenario.navShock * 100).toFixed(0)}% NAV
              </span>
            </div>
            <div className="text-xs font-semibold text-foreground/70 mb-3 glass-panel border border-border/60 px-2 py-1 rounded">
              Coverage: {scenario.coverageRatio.toFixed(2)}x
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-foreground/80 font-medium">Calls:</span>
                <span className="font-bold text-foreground tabular-nums">{formatCurrency(scenario.projectedCalls)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/80 font-medium">Dists:</span>
                <span className="font-bold text-foreground tabular-nums">{formatCurrency(scenario.projectedDistributions)}</span>
              </div>
              <div className={`flex justify-between items-center pt-2 border-t border-border ${scenario.liquidityGap > 0 ? 'border-red-200 dark:border-red-800' : 'border-emerald-200 dark:border-emerald-800'}`}>
                <span className="text-foreground/80 font-medium">Status:</span>
                <span className={`font-bold ${scenario.liquidityGap > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {scenario.liquidityGap > 0
                    ? `Gap ${formatCurrency(scenario.liquidityGap)}`
                    : 'Fully covered'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Chart */}
      <div className="glass-panel rounded-xl p-4 border border-border shadow-lg shadow-black/5">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={scenarios} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis 
              dataKey="name" 
              tick={AXIS_STYLE}
              stroke="#cbd5e1"
              tickLine={{ stroke: '#cbd5e1' }}
              angle={-15}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={AXIS_STYLE}
              stroke="#cbd5e1"
              tickLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(value) => `$${(value / 1_000_000).toFixed(1)}M`}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }}
              iconType="rect"
              iconSize={14}
            />
            <Bar 
              dataKey="projectedCalls" 
              fill={CHART_COLORS.calls}
              name="Capital Calls"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
            />
            <Bar 
              dataKey="projectedDistributions" 
              fill={CHART_COLORS.distributions}
              name="Distributions"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
