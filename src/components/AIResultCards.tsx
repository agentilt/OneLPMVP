'use client'

import clsx from 'clsx'

type FundSummary = {
  id: string
  name: string
  nav: number | null
  irr: number | null
  tvpi: number | null
  dpi: number | null
  commitment: number | null
  paidIn: number | null
  assetClass?: string | null
}

type DirectSummary = {
  id: string
  name: string
  investmentType?: string | null
  industry?: string | null
  currentValue?: number | null
  investmentAmount?: number | null
}

type CapitalCallSummary = {
  id: string
  fundId: string
  fund?: { name?: string | null }
  dueDate?: string | Date | null
  callAmount?: number | null
  paymentStatus?: string | null
  title?: string | null
}

type DistributionSummary = {
  id: string
  fundId: string
  fund?: { name?: string | null }
  distributionDate?: string | Date | null
  amount?: number | null
  distributionType?: string | null
  description?: string | null
}

interface AIResultCardsProps {
  funds?: FundSummary[]
  directs?: DirectSummary[]
  capitalCalls?: CapitalCallSummary[]
  distributions?: DistributionSummary[]
}

const formatDate = (d?: string | Date | null) => {
  if (!d) return 'n/a'
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return 'n/a'
  return date.toISOString().slice(0, 10)
}

export function AIResultCards({ funds, directs, capitalCalls, distributions }: AIResultCardsProps) {
  const hasAny =
    (funds && funds.length) ||
    (directs && directs.length) ||
    (capitalCalls && capitalCalls.length) ||
    (distributions && distributions.length)

  if (!hasAny) return null

  return (
    <div className="space-y-4">
      {capitalCalls && capitalCalls.length > 0 && (
        <section data-animate data-tilt className="border border-border dark:border-slate-800 rounded-xl p-3 bg-surface/70 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">Upcoming Capital Calls</h4>
            <span className="text-xs text-foreground/60">{capitalCalls.length}</span>
          </div>
          <div className="space-y-2">
            {capitalCalls.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-border/50 dark:border-slate-800 px-3 py-2 flex items-start justify-between text-sm"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">{c.fund?.name ?? 'Fund'}</div>
                  <div className="text-foreground/70">{c.title || 'Capital call'}</div>
                  <div className="text-xs text-foreground/60">
                    Due: {formatDate(c.dueDate)} • Status: {c.paymentStatus ?? 'n/a'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {c.callAmount != null ? `$${Number(c.callAmount).toLocaleString()}` : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {distributions && distributions.length > 0 && (
        <section data-animate data-tilt className="border border-border dark:border-slate-800 rounded-xl p-3 bg-surface/70 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">Upcoming Distributions</h4>
            <span className="text-xs text-foreground/60">{distributions.length}</span>
          </div>
          <div className="space-y-2">
            {distributions.map((d) => (
              <div
                key={d.id}
                className="rounded-lg border border-border/50 dark:border-slate-800 px-3 py-2 flex items-start justify-between text-sm"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">{d.fund?.name ?? 'Fund'}</div>
                  <div className="text-foreground/70">{d.description || d.distributionType || 'Distribution'}</div>
                  <div className="text-xs text-foreground/60">Date: {formatDate(d.distributionDate)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">
                    {d.amount != null ? `$${Number(d.amount).toLocaleString()}` : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {funds && funds.length > 0 && (
        <section data-animate data-tilt className="border border-border dark:border-slate-800 rounded-xl p-3 bg-surface/70 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">Funds</h4>
            <span className="text-xs text-foreground/60">{funds.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {funds.map((f) => (
              <div
                key={f.id}
                className="rounded-lg border border-border/50 dark:border-slate-800 px-3 py-2 text-sm flex justify-between items-start"
              >
                <div>
                  <div className="font-semibold text-foreground">{f.name}</div>
                  <div className="text-xs text-foreground/60">
                    {f.assetClass || 'Fund'} • Commitment {f.commitment ?? 'n/a'} • PaidIn {f.paidIn ?? 'n/a'}
                  </div>
                </div>
                <div className="text-right text-xs text-foreground/70 space-y-1">
                  <div>NAV: {f.nav ?? 'n/a'}</div>
                  <div>IRR: {f.irr ?? 'n/a'}</div>
                  <div>TVPI: {f.tvpi ?? 'n/a'}</div>
                  <div>DPI: {f.dpi ?? 'n/a'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {directs && directs.length > 0 && (
        <section data-animate data-tilt className="border border-border dark:border-slate-800 rounded-xl p-3 bg-surface/70 backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">Direct Investments</h4>
            <span className="text-xs text-foreground/60">{directs.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {directs.map((d) => (
              <div
                key={d.id}
                className="rounded-lg border border-border/50 dark:border-slate-800 px-3 py-2 text-sm flex justify-between items-start"
              >
                <div>
                  <div className="font-semibold text-foreground">{d.name}</div>
                  <div className="text-xs text-foreground/60">
                    {d.industry || 'Direct'} • {d.investmentType || 'n/a'}
                  </div>
                </div>
                <div className="text-right text-xs text-foreground/70 space-y-1">
                  <div>Current: {d.currentValue ?? 'n/a'}</div>
                  <div>Invested: {d.investmentAmount ?? 'n/a'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
