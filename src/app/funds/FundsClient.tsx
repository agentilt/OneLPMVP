'use client'

import { useState, useMemo } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { FundCard } from '@/components/FundCard'
import { motion } from 'framer-motion'
import { Briefcase, TrendingUp, TrendingDown, DollarSign, BarChart3, Filter, Search, ArrowUpDown, Eye, EyeOff } from 'lucide-react'

interface Fund {
  id: string
  name: string
  domicile: string
  vintage: number
  manager: string
  managerEmail?: string | null
  managerPhone?: string | null
  managerWebsite?: string | null
  commitment: number
  paidIn: number
  nav: number
  tvpi: number
  dpi: number
  lastReportDate: Date
  navHistory: { date: Date; nav: number }[]
}

interface FundsClientProps {
  funds: Fund[]
}

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatMultiple = (value: number) => {
  return value.toFixed(2) + 'x'
}

const formatPercent = (value: number) => {
  return (value * 100).toFixed(1) + '%'
}

export function FundsClient({ funds }: FundsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [sortBy, setSortBy] = useState<'name' | 'tvpi' | 'nav' | 'commitment'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'positive' | 'negative'>('all')

  // Helper function to calculate TVPI: (NAV + Distributions) / Paid-in = (NAV / Paid-in) + DPI
  const calculateTvpi = (nav: number, paidIn: number, dpi: number) => {
    return paidIn > 0 ? (nav / paidIn) + dpi : 0
  }

  // Calculate portfolio summary
  const portfolioSummary = useMemo(() => {
    const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
    const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
    const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
    const calculatedTvpis = funds.map(fund => calculateTvpi(fund.nav, fund.paidIn, fund.dpi))
    const avgTvpi = calculatedTvpis.length > 0 ? calculatedTvpis.reduce((sum, tvpi) => sum + tvpi, 0) / calculatedTvpis.length : 0
    const avgDpi = funds.length > 0 ? funds.reduce((sum, fund) => sum + fund.dpi, 0) / funds.length : 0
    const positiveFunds = calculatedTvpis.filter(tvpi => tvpi >= 1.0).length
    const totalFunds = funds.length

    return {
      totalCommitment,
      totalPaidIn,
      totalNav,
      avgTvpi,
      avgDpi,
      positiveFunds,
      totalFunds,
      totalReturn: totalNav - totalPaidIn,
      totalReturnPercent: totalPaidIn > 0 ? ((totalNav - totalPaidIn) / totalPaidIn) * 100 : 0
    }
  }, [funds])

  // Filter and sort funds
  const filteredAndSortedFunds = useMemo(() => {
    let filtered = funds.filter(fund => {
      const matchesSearch = fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fund.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fund.domicile.toLowerCase().includes(searchTerm.toLowerCase())
      
      const calculatedTvpi = calculateTvpi(fund.nav, fund.paidIn, fund.dpi)
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'positive' && calculatedTvpi >= 1.0) ||
                           (filterBy === 'negative' && calculatedTvpi < 1.0)
      
      return matchesSearch && matchesFilter
    })

    return filtered.sort((a, b) => {
      let aValue, bValue
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'tvpi':
          aValue = calculateTvpi(a.nav, a.paidIn, a.dpi)
          bValue = calculateTvpi(b.nav, b.paidIn, b.dpi)
          break
        case 'nav':
          aValue = a.nav
          bValue = b.nav
          break
        case 'commitment':
          aValue = a.commitment
          bValue = b.commitment
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
  }, [funds, searchTerm, filterBy, sortBy, sortOrder])

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
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Fund Portfolio
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-sm text-foreground/60 mt-0.5"
              >
                Comprehensive view of all your fund investments
              </motion.p>
            </div>
          </div>
        </motion.div>


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
                placeholder="Search funds, managers, or domiciles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              />
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Filter by Performance */}
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as 'all' | 'positive' | 'negative')}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              >
                <option value="all">All Funds</option>
                <option value="positive">Positive Performance</option>
                <option value="negative">Negative Performance</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'tvpi' | 'nav' | 'commitment')}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              >
                <option value="name">Sort by Name</option>
                <option value="tvpi">Sort by TVPI</option>
                <option value="nav">Sort by NAV</option>
                <option value="commitment">Sort by Commitment</option>
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

        {/* Funds Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {filteredAndSortedFunds.length > 0 ? (
            viewMode === 'cards' ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAndSortedFunds.map((fund, index) => (
                  <motion.div
                    key={fund.id}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
                  >
                    <FundCard {...fund} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Fund</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Manager</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Commitment</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">NAV</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">TVPI</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">DPI</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredAndSortedFunds.map((fund, index) => (
                        <motion.tr
                          key={fund.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.05, duration: 0.3 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-foreground">{fund.name}</div>
                              <div className="text-sm text-foreground/60">{fund.domicile} • {fund.vintage}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{fund.manager}</td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{formatCurrency(fund.commitment)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-accent">{formatCurrency(fund.nav)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{formatMultiple(calculateTvpi(fund.nav, fund.paidIn, fund.dpi))}</td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{formatMultiple(fund.dpi)}</td>
                          <td className="px-6 py-4">
                            {(() => {
                              const calculatedTvpi = calculateTvpi(fund.nav, fund.paidIn, fund.dpi)
                              return (
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${
                                  calculatedTvpi >= 1.0 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {calculatedTvpi >= 1.0 ? (
                                    <TrendingUp className="w-4 h-4" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4" />
                                  )}
                                  {calculatedTvpi >= 1.0 ? 'Positive' : 'Negative'}
                                </div>
                              )
                            })()}
                          </td>
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
                <Briefcase className="w-8 h-8 text-accent" />
              </div>
              <p className="text-foreground/60 mb-2 font-medium">
                {searchTerm || filterBy !== 'all' 
                  ? 'No funds match your current filters.' 
                  : 'You don\'t have access to any funds yet.'
                }
              </p>
              <p className="text-sm text-foreground/40">
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Contact your fund manager for access.'
                }
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

