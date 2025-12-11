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
      <div className="glass-panel rounded-2xl border border-border p-6 h-full flex items-center justify-center text-sm text-foreground/60 shadow-2xl shadow-black/10">
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
      className="glass-panel rounded-2xl border border-border p-6 h-full shadow-2xl shadow-black/10"
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
              className={`rounded-2xl p-4 border glass-panel ${
                isBreach ? 'border-red-200/60 dark:border-red-800/60' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                {isBreach && (
                  <span className="text-xs font-semibold text-red-500 dark:text-red-400">High</span>
                )}
              </div>
              <div className="h-2 rounded-full bg-[var(--border)]/40 glass-panel overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isBreach ? 'bg-red-500' : 'bg-[color-mix(in_srgb,var(--accent-color) 80%,transparent)]'
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
