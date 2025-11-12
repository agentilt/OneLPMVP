'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bitcoin, Users, TrendingUp } from 'lucide-react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { formatDate } from '@/lib/utils'

interface HoldingOwner {
  id: string
  displayName: string
}

interface CryptoHolding {
  id: string
  symbol: string
  name: string
  amount: number
  valueUsd: number
  updatedAt: string
  owner?: HoldingOwner
}

interface CryptoClientProps {
  holdings: CryptoHolding[]
  totalValue: number
  showOwnerColumn: boolean
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: amount < 1 ? 8 : 4,
  }).format(amount)
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function CryptoClient({ holdings, totalValue, showOwnerColumn }: CryptoClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const aggregatedHoldings = useMemo(() => {
    const map = new Map<
      string,
      {
        symbol: string
        name: string
        totalAmount: number
        totalValue: number
        lastUpdated: string
        owners: HoldingOwner[]
      }
    >()

    holdings.forEach((holding) => {
      const key = holding.symbol.toUpperCase()
      const existing = map.get(key)

      const ownerList = holding.owner ? [holding.owner] : []
      const lastUpdated = holding.updatedAt

      if (existing) {
        existing.totalAmount += holding.amount
        existing.totalValue += holding.valueUsd
        if (new Date(lastUpdated) > new Date(existing.lastUpdated)) {
          existing.lastUpdated = lastUpdated
        }
        ownerList.forEach((owner) => {
          if (!existing.owners.find((o) => o.id === owner.id)) {
            existing.owners.push(owner)
          }
        })
      } else {
        map.set(key, {
          symbol: key,
          name: holding.name,
          totalAmount: holding.amount,
          totalValue: holding.valueUsd,
          lastUpdated,
          owners: [...ownerList],
        })
      }
    })

    return Array.from(map.values()).sort((a, b) => b.totalValue - a.totalValue)
  }, [holdings])

  const latestUpdate = useMemo(() => {
    if (holdings.length === 0) {
      return null
    }

    return holdings.reduce((latest, holding) => {
      return new Date(holding.updatedAt) > new Date(latest.updatedAt) ? holding : latest
    })
  }, [holdings])

  const uniqueHolderCount = useMemo(() => {
    if (!showOwnerColumn) {
      return 0
    }

    const ids = new Set<string>()
    holdings.forEach((holding) => {
      if (holding.owner?.id) {
        ids.add(holding.owner.id)
      }
    })
    return ids.size
  }, [holdings, showOwnerColumn])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
                  <Bitcoin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                    Crypto Holdings
                  </h1>
                  <p className="text-sm text-foreground/60 mt-0.5">
                    Track all cryptocurrency positions held within your portfolio
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-black/5 dark:shadow-black/20 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground/60">Total Value</span>
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <p className="text-3xl font-bold text-foreground mt-3">{formatUsd(totalValue)}</p>
                <p className="text-xs text-foreground/50 mt-2">
                  {aggregatedHoldings.length} {aggregatedHoldings.length === 1 ? 'asset' : 'assets'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-black/5 dark:shadow-black/20 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground/60">Latest Update</span>
                  <Bitcoin className="w-5 h-5 text-accent" />
                </div>
                <p className="text-lg font-semibold text-foreground mt-3">
                  {latestUpdate ? formatDate(latestUpdate.updatedAt) : 'No holdings yet'}
                </p>
                <p className="text-xs text-foreground/50 mt-2">
                  {latestUpdate ? latestUpdate.symbol : 'Awaiting first update'}
                </p>
              </motion.div>

              {showOwnerColumn && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-black/5 dark:shadow-black/20 p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground/60">Holders</span>
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-3xl font-bold text-foreground mt-3">
                {uniqueHolderCount}
                  </p>
                  <p className="text-xs text-foreground/50 mt-2">
                Unique account{uniqueHolderCount === 1 ? '' : 's'} holding crypto
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden"
          >
            {aggregatedHoldings.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto">
                  <Bitcoin className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">No crypto holdings yet</h2>
                <p className="text-sm text-foreground/60 max-w-md mx-auto">
                  When crypto assets are recorded for this account, they will appear here with position sizes and current valuations.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200/60 dark:divide-slate-800/60">
                  <thead className="bg-slate-50/60 dark:bg-slate-900/60">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                        Asset
                      </th>
                      {showOwnerColumn && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                          Holders
                        </th>
                      )}
                      <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                        Value (USD)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                    {aggregatedHoldings.map((item) => (
                      <tr
                        key={item.symbol}
                        className="transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-bold text-foreground shadow-inner">
                              {item.symbol}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{item.name}</p>
                              <p className="text-xs text-foreground/60 uppercase tracking-wide">
                                {item.symbol}
                              </p>
                            </div>
                          </div>
                        </td>
                        {showOwnerColumn && (
                          <td className="px-6 py-5">
                            <div className="flex flex-wrap gap-2">
                              {item.owners.length === 0 ? (
                                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-foreground/60">
                                  Unassigned
                                </span>
                              ) : (
                                item.owners.map((owner) => (
                                  <span
                                    key={owner.id}
                                    className="inline-flex items-center rounded-full bg-accent/10 text-accent px-3 py-1 text-xs font-medium"
                                  >
                                    {owner.displayName}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-foreground">
                            {formatAmount(item.totalAmount)}
                          </p>
                          <p className="text-xs text-foreground/60 uppercase tracking-wide">
                            {item.symbol}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-foreground">
                            {formatUsd(item.totalValue)}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(item.lastUpdated)}
                          </p>
                          <p className="text-xs text-foreground/60">
                            {formatTime(item.lastUpdated)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

