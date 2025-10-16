'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { formatCurrency, formatPercent, formatMultiple, formatDate } from '@/lib/utils'

interface FundCardProps {
  id: string
  name: string
  domicile: string
  vintage: number
  manager: string
  commitment: number
  paidIn: number
  nav: number
  irr: number
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
  irr,
  tvpi,
  dpi,
  lastReportDate,
  navHistory = [],
}: FundCardProps) {
  // Generate sparkline points
  const generateSparklinePoints = () => {
    if (navHistory.length === 0) {
      // Generate dummy data if no history
      const dummyData = [nav * 0.8, nav * 0.85, nav * 0.9, nav * 0.95, nav]
      const max = Math.max(...dummyData)
      const min = Math.min(...dummyData)
      const range = max - min || 1

      return dummyData
        .map((value, index) => {
          const x = (index / (dummyData.length - 1)) * 100
          const y = 100 - ((value - min) / range) * 100
          return `${x},${y}`
        })
        .join(' ')
    }

    const values = navHistory.map((h) => h.nav)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 100
        const y = 100 - ((value - min) / range) * 100
        return `${x},${y}`
      })
      .join(' ')
  }

  return (
    <Link href={`/funds/${id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      >
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg mb-1">{name}</h3>
          <div className="flex items-center gap-2 text-xs text-foreground/60">
            <span>{domicile}</span>
            <span>•</span>
            <span>Vintage {vintage}</span>
          </div>
          <p className="text-sm text-foreground/60 mt-1">{manager}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          <div>
            <div className="text-xs text-foreground/60">Commitment</div>
            <div className="text-sm font-medium">{formatCurrency(commitment)}</div>
          </div>
          <div>
            <div className="text-xs text-foreground/60">Paid-in</div>
            <div className="text-sm font-medium">{formatCurrency(paidIn)}</div>
          </div>
          <div>
            <div className="text-xs text-foreground/60">NAV</div>
            <div className="text-sm font-medium">{formatCurrency(nav)}</div>
          </div>
          <div>
            <div className="text-xs text-foreground/60">IRR</div>
            <div className="text-sm font-medium">{formatPercent(irr)}</div>
          </div>
          <div>
            <div className="text-xs text-foreground/60">TVPI</div>
            <div className="text-sm font-medium">{formatMultiple(tvpi)}</div>
          </div>
          <div>
            <div className="text-xs text-foreground/60">DPI</div>
            <div className="text-sm font-medium">{formatMultiple(dpi)}</div>
          </div>
        </div>

        {/* Sparkline */}
        <div className="mb-2 text-blue-600 dark:text-blue-400">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-8 w-full"
          >
            <polyline
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              points={generateSparklinePoints()}
            />
          </svg>
        </div>

        {/* Footer */}
        <div className="text-xs text-foreground/60">
          Last report: {formatDate(lastReportDate)}
        </div>
      </motion.div>
    </Link>
  )
}

