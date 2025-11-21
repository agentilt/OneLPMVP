'use client'

import { motion } from 'framer-motion'

interface RiskScoreGaugeProps {
  title: string
  subtitle?: string
  score: number
  max?: number
}

export function RiskScoreGauge({ title, subtitle, score, max = 100 }: RiskScoreGaugeProps) {
  const normalized = Math.max(0, Math.min(score, max))
  const percentage = (normalized / max) * 100

  const progressColor =
    percentage > 66 ? '#ef4444' : percentage > 33 ? '#f97316' : '#10b981'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-surface rounded-2xl border border-border dark:border-slate-800/60 shadow-lg shadow-black/5 dark:shadow-black/20 p-6 h-full flex flex-col justify-between"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">{title}</p>
        {subtitle && <p className="text-sm text-foreground/60 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center justify-center py-6">
        <div
          className="relative w-36 h-36 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-900"
          style={{
            backgroundImage: `conic-gradient(${progressColor} ${percentage}%, #e2e8f0 ${percentage}%)`,
          }}
        >
          <div className="absolute inset-3 rounded-full bg-white dark:bg-slate-950 border border-border flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{normalized.toFixed(1)}</span>
            <span className="text-xs text-foreground/60">/ {max}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-foreground/60 text-center">
        {percentage >= 75 ? 'High Risk' : percentage >= 40 ? 'Moderate Risk' : 'Low Risk'}
      </div>
    </motion.div>
  )
}
