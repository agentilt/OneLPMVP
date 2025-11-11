'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { formatCurrency, formatPercent, formatMultiple, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, MapPin, Calendar, ArrowUpRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface FundCardProps {
  id: string
  name: string
  domicile: string
  vintage: number
  manager: string
  commitment: number
  paidIn: number
  nav: number
  tvpi: number
  dpi: number
  lastReportDate: Date | string
  navHistory?: { date: Date; nav: number }[]
}

export function FundCard({
  id,
  name,
  domicile,
  vintage,
  manager,
  commitment,
  paidIn,
  nav,
  tvpi,
  dpi,
  lastReportDate,
  navHistory = [],
}: FundCardProps) {
  // Prepare chart data
  const chartData = navHistory.length > 0 
    ? navHistory.map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        nav: item.nav,
      }))
    : []

  // Calculate TVPI correctly: (NAV + Distributions) / Paid-in
  // Since Distributions = DPI * Paid-in, TVPI = (NAV / Paid-in) + DPI
  const calculatedTvpi = paidIn > 0 ? (nav / paidIn) + dpi : 0
  const tvpiPositive = calculatedTvpi >= 1.0

  return (
    <Link href={`/funds/${id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
        className="group relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-2xl hover:border-accent/30 transition-all duration-200 cursor-pointer overflow-hidden"
      >
        {/* Background Gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        {/* Header */}
        <div className="relative mb-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-bold text-lg group-hover:text-accent transition-colors flex-1">{name}</h3>
            <ArrowUpRight className="w-5 h-5 text-foreground/40 group-hover:text-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
          </div>
          
          <div className="flex items-center gap-3 text-xs text-foreground/60 mb-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="font-medium">{domicile}</span>
            </div>
            <span className="text-foreground/30">•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span className="font-medium">Vintage {vintage}</span>
            </div>
          </div>
          
          <p className="text-sm text-foreground/70 font-medium">{manager}</p>
        </div>

        {/* Performance Indicator */}
        <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg ${
          tvpiPositive 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        }`}>
          {tvpiPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-bold">{formatMultiple(calculatedTvpi)} TVPI</span>
        </div>

        {/* NAV Over Time Chart */}
        {chartData.length > 0 ? (
          <div className="mb-5 relative h-32 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/30 rounded-xl p-2 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  stroke="currentColor"
                  opacity={0.4}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  stroke="currentColor"
                  opacity={0.4}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="nav"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mb-5 relative h-32 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/30 rounded-xl p-4 flex items-center justify-center">
            <p className="text-xs text-foreground/40">No NAV history available</p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Commitment</div>
            <div className="text-base font-bold">{formatCurrency(commitment)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Paid-in</div>
            <div className="text-base font-bold">{formatCurrency(paidIn)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">NAV</div>
            <div className="text-base font-bold text-accent">{formatCurrency(nav)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">TVPI</div>
            <div className="text-base font-bold">{formatMultiple(calculatedTvpi)}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-4"></div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-foreground/60 font-medium">
            DPI: <span className="text-foreground font-bold">{formatMultiple(dpi)}</span>
          </div>
          <div className="text-foreground/50">
            {formatDate(lastReportDate)}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

