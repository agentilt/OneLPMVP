'use client'

import { useState, useMemo } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Filter, Search, ArrowUpDown, Eye, EyeOff, Building2, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

interface DirectInvestment {
  id: string
  name: string
  industry?: string | null
  stage?: string | null
  investmentDate?: Date | null
  investmentAmount?: number | null
  period?: string | null
  periodDate?: Date | null
  revenue?: number | null
  arr?: number | null
  mrr?: number | null
  cashBalance?: number | null
  lastReportDate?: Date | null
  documents: { id: string }[]
}

interface DirectInvestmentsClientProps {
  directInvestments: DirectInvestment[]
}

// Utility functions
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A'
  return (value * 100).toFixed(1) + '%'
}

export function DirectInvestmentsClient({ directInvestments }: DirectInvestmentsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'cashBalance' | 'investmentAmount'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'high-growth' | 'early-stage'>('all')

  // Calculate portfolio summary
  const portfolioSummary = useMemo(() => {
    const totalInvested = directInvestments.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0)
    const totalRevenue = directInvestments.reduce((sum, inv) => sum + (inv.revenue || 0), 0)
    const totalCashBalance = directInvestments.reduce((sum, inv) => sum + (inv.cashBalance || 0), 0)
    const avgArr = directInvestments.length > 0 
      ? directInvestments.filter(inv => inv.arr).reduce((sum, inv) => sum + (inv.arr || 0), 0) / directInvestments.filter(inv => inv.arr).length 
      : 0

    return {
      totalInvested,
      totalRevenue,
      totalCashBalance,
      avgArr,
      totalInvestments: directInvestments.length,
    }
  }, [directInvestments])

  // Filter and sort direct investments
  const filteredAndSortedInvestments = useMemo(() => {
    let filtered = directInvestments.filter(inv => {
      const matchesSearch = inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (inv.industry?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (inv.stage?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'high-growth' && (inv.arr || 0) > 1000000) ||
                           (filterBy === 'early-stage' && ['Seed', 'Pre-Seed', 'Series A'].includes(inv.stage || ''))
      
      return matchesSearch && matchesFilter
    })

    return filtered.sort((a, b) => {
      let aValue: any, bValue: any
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'revenue':
          aValue = a.revenue || 0
          bValue = b.revenue || 0
          break
        case 'cashBalance':
          aValue = a.cashBalance || 0
          bValue = b.cashBalance || 0
          break
        case 'investmentAmount':
          aValue = a.investmentAmount || 0
          bValue = b.investmentAmount || 0
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }, [directInvestments, searchTerm, filterBy, sortBy, sortOrder])

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Direct Investments
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-sm text-foreground/60 mt-0.5"
              >
                Comprehensive view of all your direct investments
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Portfolio Summary */}
        {portfolioSummary.totalInvestments > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6">
              <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Total Invested</div>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(portfolioSummary.totalInvested)}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6">
              <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Total Revenue</div>
              <div className="text-2xl font-bold text-accent">{formatCurrency(portfolioSummary.totalRevenue)}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6">
              <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Total Cash Balance</div>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(portfolioSummary.totalCashBalance)}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6">
              <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Total Investments</div>
              <div className="text-2xl font-bold text-foreground">{portfolioSummary.totalInvestments}</div>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="text"
                placeholder="Search startups, industries, or stages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              />
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Filter */}
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as 'all' | 'high-growth' | 'early-stage')}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              >
                <option value="all">All Investments</option>
                <option value="high-growth">High Growth</option>
                <option value="early-stage">Early Stage</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'revenue' | 'cashBalance' | 'investmentAmount')}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              >
                <option value="name">Sort by Name</option>
                <option value="revenue">Sort by Revenue</option>
                <option value="cashBalance">Sort by Cash Balance</option>
                <option value="investmentAmount">Sort by Investment Amount</option>
              </select>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
              </button>

              {/* View Mode Toggle */}
              <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 transition-all ${
                    viewMode === 'cards'
                      ? 'bg-accent text-white'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 transition-all ${
                    viewMode === 'table'
                      ? 'bg-accent text-white'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Direct Investments Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {filteredAndSortedInvestments.length > 0 ? (
            viewMode === 'cards' ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAndSortedInvestments.map((investment, index) => (
                  <motion.div
                    key={investment.id}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
                  >
                    <Link href={`/direct-investments/${investment.id}`}>
                      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-2xl hover:border-accent/50 transition-all cursor-pointer h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-foreground mb-1">{investment.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-foreground/60">
                              {investment.industry && <span>{investment.industry}</span>}
                              {investment.stage && (
                                <>
                                  <span>•</span>
                                  <span>{investment.stage}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {investment.revenue !== null && investment.revenue !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-foreground/60">Revenue</span>
                              <span className="text-sm font-semibold text-accent">{formatCurrency(investment.revenue)}</span>
                            </div>
                          )}
                          {investment.arr !== null && investment.arr !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-foreground/60">ARR</span>
                              <span className="text-sm font-semibold text-foreground">{formatCurrency(investment.arr)}</span>
                            </div>
                          )}
                          {investment.cashBalance !== null && investment.cashBalance !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-foreground/60">Cash Balance</span>
                              <span className="text-sm font-semibold text-foreground">{formatCurrency(investment.cashBalance)}</span>
                            </div>
                          )}
                          {investment.investmentAmount !== null && investment.investmentAmount !== undefined && (
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                              <span className="text-sm font-medium text-foreground/60">Investment</span>
                              <span className="text-sm font-bold text-foreground">{formatCurrency(investment.investmentAmount)}</span>
                            </div>
                          )}
                        </div>
                        
                        {investment.documents.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 text-xs text-foreground/40">
                            <LinkIcon className="w-3 h-3" />
                            <span>{investment.documents.length} document{investment.documents.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Startup</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Stage</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Investment</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">ARR</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Cash Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredAndSortedInvestments.map((investment, index) => (
                        <motion.tr
                          key={investment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.05, duration: 0.3 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <Link href={`/direct-investments/${investment.id}`}>
                              <div>
                                <div className="font-semibold text-foreground">{investment.name}</div>
                                <div className="text-sm text-foreground/60">{investment.industry || 'N/A'}</div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{investment.stage || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{formatCurrency(investment.investmentAmount)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-accent">{formatCurrency(investment.revenue)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{formatCurrency(investment.arr)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{formatCurrency(investment.cashBalance)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="bg-white dark:bg-slate-900 border rounded-2xl shadow-xl p-12 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-accent" />
              </div>
              <p className="text-foreground/60 mb-2 font-medium">
                {searchTerm || filterBy !== 'all' 
                  ? 'No investments match your current filters.' 
                  : 'You don\'t have any direct investments yet.'
                }
              </p>
              <p className="text-sm text-foreground/40">
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Contact your administrator to add direct investments.'
                }
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

