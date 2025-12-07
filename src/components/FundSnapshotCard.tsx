'use client'

import { formatCurrency, formatMultiple, formatDate } from '@/lib/utils'

interface FundSnapshotCardProps {
  name: string
  commitment: number
  paidIn: number
  nav: number
  dpi: number
  lastReportDate: Date | string
}

export function FundSnapshotCard({
  name,
  commitment,
  paidIn,
  nav,
  dpi,
  lastReportDate,
}: FundSnapshotCardProps) {
  const calculatedTvpi = paidIn > 0 ? (nav / paidIn) + dpi : 0

  return (
    <div
      data-tilt
      data-animate
      className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm hover:shadow-lg transition-shadow duration-200 backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-foreground line-clamp-1">{name}</div>
          <div className="text-xs text-foreground/50 mt-1">Updated {formatDate(lastReportDate)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">NAV</div>
          <div className="text-sm font-bold text-accent">{formatCurrency(nav)}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800/70 px-2 py-2">
          <div className="font-medium text-foreground/60 uppercase tracking-wide text-[10px]">
            Commitment
          </div>
          <div className="mt-1 font-semibold text-foreground">
            {formatCurrency(commitment)}
          </div>
        </div>
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800/70 px-2 py-2">
          <div className="font-medium text-foreground/60 uppercase tracking-wide text-[10px]">
            Paid-In
          </div>
          <div className="mt-1 font-semibold text-foreground">
            {formatCurrency(paidIn)}
          </div>
        </div>
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800/70 px-2 py-2">
          <div className="font-medium text-foreground/60 uppercase tracking-wide text-[10px]">TVPI</div>
          <div className="mt-1 font-semibold text-foreground">
            {formatMultiple(calculatedTvpi)}
          </div>
        </div>
      </div>
    </div>
  )
}

