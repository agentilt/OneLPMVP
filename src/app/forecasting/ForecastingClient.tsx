'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, DollarSign, Activity } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'

export function ForecastingClient() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Cash Flow Forecasting
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-sm text-foreground/60 mt-0.5"
              >
                Project cash flows, model scenarios, and plan liquidity needs
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Coming Soon Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-12"
        >
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-600/5 dark:from-blue-500/20 dark:to-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Advanced Forecasting Coming Soon</h2>
            <p className="text-foreground/60 mb-8">
              This powerful forecasting module will include:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-8">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Capital Call Projections</h3>
                  <p className="text-sm text-foreground/60">Forecast future capital calls based on fund pace and commitments</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Distribution Forecasts</h3>
                  <p className="text-sm text-foreground/60">Project expected distributions and exit timelines</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Scenario Planning</h3>
                  <p className="text-sm text-foreground/60">Model best, worst, and base case scenarios</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Liquidity Planning</h3>
                  <p className="text-sm text-foreground/60">Manage funding requirements and reserve levels</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors font-medium">
                Request Early Access
              </button>
              <button className="px-6 py-3 border border-border rounded-xl hover:bg-surface-hover transition-colors font-medium text-foreground">
                Learn More
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

