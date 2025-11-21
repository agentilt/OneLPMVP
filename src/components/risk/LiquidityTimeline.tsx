'use client'

import { motion } from 'framer-motion'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface LiquidityTimelineProps {
  schedule: Array<{ period: string; capitalCalls: number; distributions: number; net?: number }>
  pendingCalls?: number
  next12MonthCalls?: number
  next24MonthCalls?: number
  liquidityCoverage?: number
}

export function LiquidityTimeline({
  schedule,
  pendingCalls = 0,
  next12MonthCalls,
  next24MonthCalls,
  liquidityCoverage,
}: LiquidityTimelineProps) {
  if (!schedule?.length) {
    return (
      <div className="bg-white dark:bg-surface rounded-2xl border border-border dark:border-slate-800/60 p-6">
        <p className="text-sm text-foreground/60">No liquidity timeline available.</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-surface rounded-2xl border border-border dark:border-slate-800/60 p-6"
    >
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Liquidity Timeline</h3>
          <p className="text-sm text-foreground/60">
            Pending calls: {formatCurrency(pendingCalls)}
          </p>
        </div>
        {typeof liquidityCoverage === 'number' && (
          <div className="text-sm">
            <p className="text-foreground/60">Liquidity Coverage</p>
            <p className={`text-lg font-semibold ${liquidityCoverage < 1.2 ? 'text-red-500' : 'text-emerald-500'}`}>
              {liquidityCoverage.toFixed(2)}x
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Next 12 Months" value={next12MonthCalls} />
        <SummaryCard label="Next 24 Months" value={next24MonthCalls} />
        <SummaryCard label="Annualized Net Flow" value={schedule.reduce((sum, item) => sum + (item.net ?? item.distributions - item.capitalCalls), 0)} />
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={schedule}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="period" stroke="#6b7280" />
          <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1_000_000).toFixed(1)}M`} />
          <Tooltip
            formatter={(value: number, name) => [
              formatCurrency(value),
              name === 'capitalCalls' ? 'Capital Calls' : name === 'distributions' ? 'Distributions' : 'Net',
            ]}
          />
          <Legend />
          <Area type="monotone" dataKey="capitalCalls" stroke="#f97316" fill="#f97316" fillOpacity={0.25} name="Capital Calls" />
          <Area type="monotone" dataKey="distributions" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Distributions" />
          <Area type="monotone" dataKey="net" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} name="Net Flow" />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

function SummaryCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-border dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/40 p-4">
      <p className="text-xs text-foreground/60 mb-1">{label}</p>
      <p className="text-lg font-semibold text-foreground">{typeof value === 'number' ? formatCurrency(value) : '—'}</p>
    </div>
  )
}
