'use client'

import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { RiskPolicyBreach } from '@/lib/riskEngine'

interface ViolationsAlertProps {
  violations: RiskPolicyBreach[]
}

export function ViolationsAlert({ violations }: ViolationsAlertProps) {
  if (!violations?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 mb-6"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
            Policy Breaches ({violations.length})
          </h4>
          <div className="space-y-2">
            {violations.slice(0, 4).map((violation, index) => (
              <div
                key={`${violation.dimension}-${violation.label}-${index}`}
                className="flex flex-wrap items-center justify-between text-sm text-amber-800 dark:text-amber-100 gap-2"
              >
                <div>
                  <span className="font-semibold">{violation.label}</span>{' '}
                  <span className="text-amber-700/70 dark:text-amber-200/70">{violation.message}</span>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    violation.severity === 'CRITICAL'
                      ? 'bg-red-500/10 text-red-600'
                      : violation.severity === 'HIGH'
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-amber-400/10 text-amber-600'
                  }`}
                >
                  {violation.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
