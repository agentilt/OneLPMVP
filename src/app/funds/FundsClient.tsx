'use client'

import { useState, useMemo } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { FundCard } from '@/components/FundCard'
import { FundsTable } from '@/components/FundsTable'
import { ExportButton } from '@/components/ExportButton'
import { motion } from 'framer-motion'
import { Briefcase, TrendingUp, TrendingDown, DollarSign, BarChart3, Filter, Search, ArrowUpDown, LayoutGrid, Table2, AlertCircle } from 'lucide-react'
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  formatCurrencyForExport,
  formatPercentForExport,
  formatDateForExport,
} from '@/lib/exportUtils'

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

interface FundSummary {
  totalCommitment: number
  totalNav: number
  portfolioTvpi: number
  activeCapitalCalls: number
}

interface FundsClientProps {
  funds: Fund[]
  fundSummary: FundSummary
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

export function FundsClient({ funds, fundSummary }: FundsClientProps) {
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

  // Helper function to calculate RVPI: NAV / Paid-in
  const calculateRvpi = (nav: number, paidIn: number) => {
    return paidIn > 0 ? nav / paidIn : 0
  }

  // Calculate portfolio summary
  const portfolioSummary = useMemo(() => {
    const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
    const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
    const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
    
    // Calculate total distributions: DPI × Paid-In for each fund
    const totalDistributions = funds.reduce((sum, fund) => sum + (fund.dpi * fund.paidIn), 0)
    
    // Portfolio TVPI (CORRECT): Use total method, not simple average
    // TVPI = (Total NAV + Total Distributions) / Total Paid-In
    const portfolioTvpi = totalPaidIn > 0 ? (totalNav + totalDistributions) / totalPaidIn : 0
    
    // Portfolio DPI (CORRECT): Total distributions / Total Paid-In
    const portfolioDpi = totalPaidIn > 0 ? totalDistributions / totalPaidIn : 0
    
    // Portfolio RVPI: Total NAV / Total Paid-In
    const portfolioRvpi = totalPaidIn > 0 ? totalNav / totalPaidIn : 0
    
    // Calculate individual TVPIs for filtering
    const calculatedTvpis = funds.map(fund => calculateTvpi(fund.nav, fund.paidIn, fund.dpi))
    const positiveFunds = calculatedTvpis.filter(tvpi => tvpi >= 1.0).length
    const totalFunds = funds.length

    return {
      totalCommitment,
      totalPaidIn,
      totalNav,
      totalDistributions,
      portfolioTvpi,  // Changed from avgTvpi to portfolioTvpi
      portfolioDpi,   // Changed from avgDpi to portfolioDpi
      portfolioRvpi,  // NEW: Added RVPI
      positiveFunds,
      totalFunds,
      totalReturn: totalNav + totalDistributions - totalPaidIn,  // FIXED: Include distributions in return
      totalReturnPercent: totalPaidIn > 0 ? ((totalNav + totalDistributions - totalPaidIn) / totalPaidIn) * 100 : 0
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

  // Export Functions
  const handleExportPDF = async () => {
    const doc = exportToPDF({
      title: 'Fund Portfolio Report',
      subtitle: 'Complete Portfolio Overview',
      date: formatDateForExport(new Date()),
      sections: [
        {
          title: 'Portfolio Summary',
          type: 'metrics',
          data: [
            { label: 'Total Commitments', value: formatCurrencyForExport(fundSummary.totalCommitment) },
            { label: 'Total NAV', value: formatCurrencyForExport(fundSummary.totalNav) },
            { label: 'Portfolio TVPI', value: `${fundSummary.portfolioTvpi.toFixed(2)}x` },
            { label: 'Active Capital Calls', value: fundSummary.activeCapitalCalls.toString() },
            { label: 'Total Funds', value: funds.length.toString() },
          ],
        },
        {
          title: 'Fund Portfolio',
          type: 'table',
          data: {
            headers: ['Fund Name', 'Manager', 'Vintage', 'Commitment', 'Paid In', 'NAV', 'TVPI', 'DPI'],
            rows: filteredAndSortedFunds.map((fund) => [
              fund.name,
              fund.manager,
              fund.vintage.toString(),
              formatCurrencyForExport(fund.commitment),
              formatCurrencyForExport(fund.paidIn),
              formatCurrencyForExport(fund.nav),
              `${fund.tvpi.toFixed(2)}x`,
              `${fund.dpi.toFixed(2)}x`,
            ]),
          },
        },
        {
          title: 'Performance Analysis',
          type: 'table',
          data: {
            headers: ['Fund Name', 'TVPI', 'DPI', 'Unfunded', '% Funded'],
            rows: filteredAndSortedFunds.map((fund) => [
              fund.name,
              `${fund.tvpi.toFixed(2)}x`,
              `${fund.dpi.toFixed(2)}x`,
              formatCurrencyForExport(fund.commitment - fund.paidIn),
              formatPercentForExport((fund.paidIn / fund.commitment) * 100),
            ]),
          },
        },
      ],
    })

    doc.save(`fund-portfolio-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportExcel = async () => {
    exportToExcel({
      filename: `fund-portfolio-${new Date().toISOString().split('T')[0]}`,
      sheets: [
        {
          name: 'Summary',
          data: [
            ['Fund Portfolio Report'],
            ['Generated', formatDateForExport(new Date())],
            [],
            ['Metric', 'Value'],
            ['Total Commitments', fundSummary.totalCommitment],
            ['Total NAV', fundSummary.totalNav],
            ['Portfolio TVPI', fundSummary.portfolioTvpi],
            ['Active Capital Calls', fundSummary.activeCapitalCalls],
            ['Total Funds', funds.length],
          ],
        },
        {
          name: 'Funds',
          data: [
            ['Fund Name', 'Manager', 'Domicile', 'Vintage', 'Commitment', 'Paid In', 'NAV', 'TVPI', 'DPI', 'Unfunded', '% Funded'],
            ...filteredAndSortedFunds.map((fund) => [
              fund.name,
              fund.manager,
              fund.domicile,
              fund.vintage,
              fund.commitment,
              fund.paidIn,
              fund.nav,
              fund.tvpi,
              fund.dpi,
              fund.commitment - fund.paidIn,
              (fund.paidIn / fund.commitment) * 100,
            ]),
          ],
        },
      ],
    })
  }

  const handleExportCSV = async () => {
    const csvData = [
      ['Fund Name', 'Manager', 'Domicile', 'Vintage', 'Commitment', 'Paid In', 'NAV', 'TVPI', 'DPI'],
      ...filteredAndSortedFunds.map((fund) => [
        fund.name,
        fund.manager,
        fund.domicile,
        fund.vintage.toString(),
        fund.commitment.toString(),
        fund.paidIn.toString(),
        fund.nav.toString(),
        fund.tvpi.toString(),
        fund.dpi.toString(),
      ]),
    ]

    exportToCSV(csvData, `fund-portfolio-${new Date().toISOString().split('T')[0]}`)
  }

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 p-6 lg:p-8">
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
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
            <ExportButton
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onExportCSV={handleExportCSV}
              label="Export Portfolio"
            />
          </div>
        </motion.div>

        {/* Fund Summary Cards */}
        {funds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl border border-blue-200/60 dark:border-blue-800/60 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                    Total Commitment
                  </div>
                </div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(fundSummary.totalCommitment)}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                    Total NAV
                  </div>
                </div>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(fundSummary.totalNav)}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10 rounded-xl border border-purple-200/60 dark:border-purple-800/60 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                    Portfolio TVPI
                  </div>
                </div>
                <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                  {formatMultiple(fundSummary.portfolioTvpi)}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 dark:from-orange-500/20 dark:to-orange-600/10 rounded-xl border border-orange-200/60 dark:border-orange-800/60 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                    Active Capital Calls
                  </div>
                </div>
                <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
                  {fundSummary.activeCapitalCalls}
                </div>
              </motion.div>
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
              <div className="flex border border-border dark:border-slate-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 transition-all ${
                    viewMode === 'cards'
                      ? 'bg-accent text-white'
                      : 'bg-surface dark:bg-slate-800/50 text-foreground hover:bg-surface-hover dark:hover:bg-slate-800'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 transition-all ${
                    viewMode === 'table'
                      ? 'bg-accent text-white'
                      : 'bg-surface dark:bg-slate-800/50 text-foreground hover:bg-surface-hover dark:hover:bg-slate-800'
                  }`}
                  title="Table View"
                >
                  <Table2 className="w-4 h-4" />
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
              <div className="bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 overflow-hidden p-4">
                <FundsTable funds={filteredAndSortedFunds} />
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

