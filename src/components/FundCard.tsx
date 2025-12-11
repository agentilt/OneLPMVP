'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { formatCurrency, formatPercent, formatMultiple, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, MapPin, Calendar, ArrowUpRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useActivityTracker } from '@/hooks/useActivityTracker'

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
  const { trackFundView, trackClick } = useActivityTracker()

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

  const handleClick = () => {
    trackClick(`fund-card-${id}`, { fundId: id, fundName: name })
    trackFundView(id, { name, domicile, vintage, manager })
  }

  return (
    <Link href={`/funds/${id}`} onClick={handleClick}>
      <motion.div
        data-tilt
        data-animate
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ duration: 0.15 }}
        className="group glass-panel rounded-2xl border border-border p-5 shadow-xl shadow-black/12 hover:shadow-accent/20 hover:border-accent/40 transition-all duration-150 cursor-pointer"
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-base group-hover:text-accent transition-colors flex-1">{name}</h3>
            <ArrowUpRight className="w-4 h-4 text-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          
          <div className="flex items-center gap-2 text-xs text-foreground/60 mb-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{domicile}</span>
            </div>
            <span className="text-foreground/30">•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Vintage {vintage}</span>
            </div>
          </div>
          
          <p className="text-sm text-foreground/70">{manager}</p>
        </div>

        {/* Performance Indicator */}
        <div
          className={`flex items-center gap-2 mb-4 px-3 py-1.5 rounded-md text-xs font-medium ${
          tvpiPositive 
              ? 'bg-[color-mix(in_srgb,var(--accent-color) 18%,var(--surface))] text-foreground'
              : 'bg-[color-mix(in_srgb,var(--accent-color) 14%,var(--surface))] text-foreground'
          }`}
        >
          {tvpiPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>{formatMultiple(calculatedTvpi)} TVPI</span>
        </div>

        {/* NAV Over Time Chart */}
        {chartData.length > 0 ? (
          <div className="mb-4 relative h-28 glass-panel border border-border/60 rounded-xl p-2 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9 }}
                  stroke="currentColor"
                  opacity={0.3}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9 }}
                  stroke="currentColor"
                  opacity={0.3}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="nav"
                  stroke="var(--accent-color)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mb-4 relative h-28 glass-panel border border-border/60 rounded-xl p-4 flex items-center justify-center">
            <p className="text-xs text-foreground/60">No NAV history available</p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Commitment</div>
            <div className="text-sm font-semibold">{formatCurrency(commitment)}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Paid-in</div>
            <div className="text-sm font-semibold">{formatCurrency(paidIn)}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">NAV</div>
            <div className="text-sm font-semibold text-accent">{formatCurrency(nav)}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">TVPI</div>
            <div className="text-sm font-semibold">{formatMultiple(calculatedTvpi)}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/80 mb-3"></div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-foreground/60">
            DPI: <span className="text-foreground font-semibold">{formatMultiple(dpi)}</span>
          </div>
          <div className="text-foreground/50">
            {formatDate(lastReportDate)}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}


