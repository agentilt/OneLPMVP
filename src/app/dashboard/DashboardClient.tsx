'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { FundCard } from '@/components/FundCard'
import { formatCurrency, formatMultiple } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'

interface Fund {
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
  lastReportDate: Date
  navHistory: { date: Date; nav: number }[]
}

interface CryptoHolding {
  id: string
  symbol: string
  name: string
  amount: number
  valueUsd: number
}

interface PortfolioSummary {
  totalCommitment: number
  totalNav: number
  portfolioTvpi: number
  activeCapitalCalls: number
}

interface DashboardClientProps {
  funds: Fund[]
  portfolioSummary: PortfolioSummary
  cryptoHoldings: CryptoHolding[]
  userRole: string
  userFirstName: string
}

export function DashboardClient({
  funds,
  portfolioSummary,
  cryptoHoldings,
  userRole,
  userFirstName,
}: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const totalCryptoValue = cryptoHoldings.reduce(
    (sum, holding) => sum + holding.valueUsd,
    0
  )

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          {/* Animated Greeting */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Hello, {userFirstName}! 
              </motion.span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-foreground/60"
            >
              Welcome back to your portfolio dashboard
            </motion.p>
          </motion.div>

          {/* Admin link */}
          {userRole === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-6"
            >
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                Go to Admin Panel
              </Link>
            </motion.div>
          )}

          {/* Data Manager link */}
          {userRole === 'DATA_MANAGER' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-6"
            >
              <Link
                href="/data-manager"
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                Go to Data Manager
              </Link>
            </motion.div>
          )}

          {/* Portfolio Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold mb-4">Portfolio Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="border rounded-lg p-4"
              >
                <div className="text-xs text-foreground/60 mb-1">
                  Total Commitments
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(portfolioSummary.totalCommitment)}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="border rounded-lg p-4"
              >
                <div className="text-xs text-foreground/60 mb-1">Total NAV</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(portfolioSummary.totalNav)}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="border rounded-lg p-4"
              >
                <div className="text-xs text-foreground/60 mb-1">
                  Portfolio TVPI
                </div>
                <div className="text-lg font-semibold">
                  {formatMultiple(portfolioSummary.portfolioTvpi)}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.4 }}
                className="border rounded-lg p-4"
              >
                <div className="text-xs text-foreground/60 mb-1">
                  Active Capital Calls
                </div>
                <div className="text-lg font-semibold">
                  {portfolioSummary.activeCapitalCalls}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Funds Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold mb-4">Your Funds</h2>
            {funds.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {funds.map((fund, index) => (
                  <motion.div
                    key={fund.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 + index * 0.1, duration: 0.4 }}
                  >
                    <FundCard {...fund} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-foreground/60">
                  You don't have access to any funds yet. Contact your fund manager.
                </p>
              </div>
            )}
          </motion.div>

          {/* Crypto Holdings */}
          {cryptoHoldings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-bold mb-4">Crypto Holdings</h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 0.4 }}
                className="border rounded-lg overflow-hidden"
              >
                <table className="w-full">
                  <thead className="bg-foreground/5 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">
                        Asset
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium">
                        Amount
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium">
                        Value (USD)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cryptoHoldings.map((holding) => (
                      <tr key={holding.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-medium">{holding.name}</div>
                          <div className="text-xs text-foreground/60">
                            {holding.symbol}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {holding.amount.toFixed(8)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(holding.valueUsd, 'USD')}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-foreground/5 font-semibold">
                      <td className="px-4 py-3" colSpan={2}>
                        Total
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(totalCryptoValue, 'USD')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </motion.div>
            </motion.div>
          )}

          {/* Document Upload Demo - Only show for admins */}
          {userRole === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.5 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.8, duration: 0.4 }}
                >
                  <Link
                    href="/admin/documents/upload"
                    className="border rounded-lg p-4 hover:bg-black/5 dark:hover:bg-white/10 transition-colors block"
                  >
                    <div className="font-medium mb-1">Upload Document</div>
                    <div className="text-sm text-foreground/60">
                      Upload capital calls, reports, and other documents
                    </div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.9, duration: 0.4 }}
                >
                  <Link
                    href="/admin/users"
                    className="border rounded-lg p-4 hover:bg-black/5 dark:hover:bg-white/10 transition-colors block"
                  >
                    <div className="font-medium mb-1">Manage Users</div>
                    <div className="text-sm text-foreground/60">
                      Invite users and manage fund access
                    </div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.0, duration: 0.4 }}
                >
                  <Link
                    href="/admin/funds/new"
                    className="border rounded-lg p-4 hover:bg-black/5 dark:hover:bg-white/10 transition-colors block"
                  >
                    <div className="font-medium mb-1">Create Fund</div>
                    <div className="text-sm text-foreground/60">
                      Add a new fund to the platform
                    </div>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}

