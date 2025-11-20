'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Target, TrendingUp, PieChart, Settings, BarChart3 } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'

export function PortfolioBuilderClient() {
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Portfolio Builder
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-sm text-foreground/60 mt-0.5"
              >
                Optimize allocations, rebalance holdings, and model target portfolios
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
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-teal-600/5 dark:from-emerald-500/20 dark:to-teal-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Portfolio Optimization Coming Soon</h2>
            <p className="text-foreground/60 mb-8">
              Build and optimize your ideal portfolio with advanced tools:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-8">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Target Allocation</h3>
                  <p className="text-sm text-foreground/60">Set and track target allocations by asset class, geography, and strategy</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Rebalancing Engine</h3>
                  <p className="text-sm text-foreground/60">Get recommendations to rebalance and optimize your portfolio</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">What-If Analysis</h3>
                  <p className="text-sm text-foreground/60">Model different scenarios and see impact on your portfolio</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Commitment Pacing</h3>
                  <p className="text-sm text-foreground/60">Plan vintage pacing and optimize commitment timing</p>
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

