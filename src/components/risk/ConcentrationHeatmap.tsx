'use client'

import { motion } from 'framer-motion'

interface ConcentrationHeatmapProps {
  title?: string
  description?: string
  data: Array<{ name: string; percentage: number }>
  highlightLimit?: number
}

export function ConcentrationHeatmap({
  title = 'Concentration Heatmap',
  description,
  data,
  highlightLimit = 30,
}: ConcentrationHeatmapProps) {
  if (!data?.length) {
    return (
      <div className="bg-white dark:bg-surface rounded-2xl border border-border dark:border-slate-800/60 p-6 h-full flex items-center justify-center text-sm text-foreground/60">
        No concentration data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map((item) => item.percentage), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-surface rounded-2xl border border-border dark:border-slate-800/60 p-6 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && <p className="text-sm text-foreground/60">{description}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {data.map((item, index) => {
          const intensity = item.percentage / maxValue
          const isBreach = item.percentage >= highlightLimit
          return (
            <div
              key={`${item.name}-${index}`}
              className={`rounded-2xl p-4 border ${
                isBreach
                  ? 'border-red-200/60 dark:border-red-800/60 bg-red-500/5'
                  : 'border-border dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                {isBreach && (
                  <span className="text-xs font-semibold text-red-500 dark:text-red-400">High</span>
                )}
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isBreach ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.max(intensity * 100, 5)}%` }}
                />
              </div>
              <p className="text-sm font-semibold text-foreground mt-2">{item.percentage.toFixed(1)}%</p>
              <p className="text-xs text-foreground/60">of portfolio</p>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
