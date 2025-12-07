'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ExportButton } from '@/components/ExportButton'
import { FundCard } from '@/components/FundCard'
import { motion } from 'framer-motion'
import { Briefcase, TrendingUp, DollarSign, Search, AlertCircle, ArrowUpDown, LayoutGrid, Table2, Download, Sparkles } from 'lucide-react'
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  formatCurrencyForExport,
  formatPercentForExport,
  formatDateForExport,
} from '@/lib/exportUtils'
import Link from 'next/link'

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

const panelBase =
  'glass-panel rounded-2xl border border-border/80 overflow-hidden shadow-[0_20px_70px_rgba(12,26,75,0.12)]'

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

export function FundsClient({ funds, fundSummary }: FundsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [sortBy, setSortBy] = useState<'name' | 'tvpi' | 'nav' | 'commitment' | 'vintage'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'positive' | 'negative'>('all')
  const [isQuickExporting, setIsQuickExporting] = useState(false)

  // Calculate portfolio summary
  const portfolioSummary = useMemo(() => {
    const totalCommitment = funds.reduce((sum, fund) => sum + fund.commitment, 0)
    const totalPaidIn = funds.reduce((sum, fund) => sum + fund.paidIn, 0)
    const totalNav = funds.reduce((sum, fund) => sum + fund.nav, 0)
    const totalDistributions = funds.reduce((sum, fund) => sum + (fund.dpi * fund.paidIn), 0)
    const portfolioTvpi = totalPaidIn > 0 ? (totalNav + totalDistributions) / totalPaidIn : 0
    const portfolioDpi = totalPaidIn > 0 ? totalDistributions / totalPaidIn : 0

    return {
      totalCommitment,
      totalPaidIn,
      totalNav,
      portfolioTvpi,
      portfolioDpi,
      totalFunds: funds.length,
    }
  }, [funds])

  // Filter and sort funds
  const filteredAndSortedFunds = useMemo(() => {
    let filtered = funds.filter(fund => {
      const matchesSearch = fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fund.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fund.domicile.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'positive' && fund.tvpi >= 1.0) ||
                           (filterBy === 'negative' && fund.tvpi < 1.0)
      
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
          aValue = a.tvpi
          bValue = b.tvpi
          break
        case 'nav':
          aValue = a.nav
          bValue = b.nav
          break
        case 'commitment':
          aValue = a.commitment
          bValue = b.commitment
          break
        case 'vintage':
          aValue = a.vintage
          bValue = b.vintage
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

  const shortcutLabel = useMemo(() => {
    if (typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')) {
      return '⌘⇧E'
    }
    return 'Ctrl+Shift+E'
  }, [])

  const handleQuickExport = useCallback(async () => {
    if (isQuickExporting) return
    setIsQuickExporting(true)
    try {
      await Promise.resolve(handleExportPDF())
    } finally {
      setIsQuickExporting(false)
    }
  }, [isQuickExporting, handleExportPDF])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'e') {
        event.preventDefault()
        handleQuickExport()
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [handleQuickExport])

  const triggerCopilotPrompt = (prompt: string) => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('onelp-copilot-prompt', { detail: { prompt } }))
  }

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 p-6 lg:p-10 space-y-8">
        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="glass-strong rounded-3xl border border-white/60 dark:border-white/10 bg-white/92 dark:bg-surface/95 shadow-[0_30px_90px_rgba(12,26,75,0.16)] p-6 sm:p-8"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
                Funds Command Desk
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-2">Fund Portfolio</h1>
              <p className="text-sm text-foreground/70 mt-2 max-w-2xl">
                Minimal, AI-native view of managers, mandates, and capital calls.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Which funds are below 1.5x TVPI?', 'Summarize capital calls by manager'].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => triggerCopilotPrompt(prompt)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 dark:bg-white/5 border border-border text-xs font-semibold text-foreground/80 hover:border-accent/50 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <button
                onClick={handleQuickExport}
                disabled={isQuickExporting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white/80 dark:bg-white/5 text-sm font-semibold text-foreground hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isQuickExporting ? (
                  <>
                    <Download className="w-4 h-4 animate-spin" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Quick Export
                    <span className="text-xs text-foreground/60">({shortcutLabel})</span>
                  </>
                )}
              </button>
              <ExportButton
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onExportCSV={handleExportCSV}
                label="Export"
              />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border/80 bg-white/80 dark:bg-white/5 p-4 shadow-sm">
              <p className="text-xs text-foreground/60">Total NAV</p>
              <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(fundSummary.totalNav)}</p>
              <p className="text-xs text-foreground/60">Commitment {formatCurrency(fundSummary.totalCommitment)}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white/80 dark:bg-white/5 p-4 shadow-sm">
              <p className="text-xs text-foreground/60">Portfolio TVPI</p>
              <p className="text-xl font-bold text-foreground mt-1">{formatMultiple(fundSummary.portfolioTvpi)}</p>
              <p className="text-xs text-foreground/60">{funds.length} active funds</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white/80 dark:bg-white/5 p-4 shadow-sm">
              <p className="text-xs text-foreground/60">Capital calls flagged</p>
              <p className="text-xl font-bold text-foreground mt-1">{fundSummary.activeCapitalCalls}</p>
              <p className="text-xs text-foreground/60">Open notices</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="glass-panel rounded-2xl border border-border/80 p-5 hover:shadow-[0_22px_70px_rgba(14,165,233,0.18)] transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                    Total Commitment
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatCurrency(fundSummary.totalCommitment)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/60">Total Funds</span>
              <span className="font-semibold text-foreground/80">{funds.length}</span>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-border/80 p-5 hover:shadow-[0_22px_70px_rgba(14,165,233,0.18)] transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                    Total NAV
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatCurrency(fundSummary.totalNav)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/60">Current Value</span>
              <span className="font-semibold text-foreground/80">Latest</span>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-border/80 p-5 hover:shadow-[0_22px_70px_rgba(14,165,233,0.18)] transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                    Portfolio TVPI
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatMultiple(fundSummary.portfolioTvpi)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/60">Total Multiple</span>
              <span className="font-semibold text-foreground/80">Portfolio</span>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-amber-300/60 p-5 hover:shadow-[0_22px_70px_rgba(248,180,0,0.25)] transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                    Capital Calls
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {fundSummary.activeCapitalCalls}
                  </div>
                </div>
              </div>
              {fundSummary.activeCapitalCalls > 0 && (
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-1"></div>
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/60">Active</span>
              <Link href="/capital-calls" className="font-semibold text-accent hover:text-accent-hover">
                View All →
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Funds Table/Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Table Header with Filters */}
          <div className={`px-6 py-4 border-b border-border dark:border-slate-800 ${panelBase}`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-foreground/70" />
                <h2 className="font-bold text-lg text-foreground">All Funds</h2>
                <span className="text-sm text-foreground/60">({filteredAndSortedFunds.length})</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <input
                    type="text"
                    placeholder="Search funds..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>

                {/* Performance Filter */}
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as 'all' | 'positive' | 'negative')}
                  className="px-3 py-2 text-sm border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="all">All Performance</option>
                  <option value="positive">Positive (≥1.0x)</option>
                  <option value="negative">Negative (&lt;1.0x)</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="name">Sort by Name</option>
                  <option value="vintage">Sort by Vintage</option>
                  <option value="tvpi">Sort by TVPI</option>
                  <option value="nav">Sort by NAV</option>
                  <option value="commitment">Sort by Commitment</option>
                </select>

                {/* Sort Order */}
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                </button>

                {/* View Mode Toggle */}
                <div className="flex border border-border dark:border-slate-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 transition-all ${
                      viewMode === 'table'
                        ? 'bg-accent text-white'
                        : 'bg-white dark:bg-slate-900 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    title="Table View"
                  >
                    <Table2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 transition-all ${
                      viewMode === 'cards'
                        ? 'bg-accent text-white'
                        : 'bg-white dark:bg-slate-900 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    title="Card View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(filterBy !== 'all' || searchTerm !== '') && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-foreground/60">Active filters:</span>
                {filterBy !== 'all' && (
                  <span className="px-2 py-1 bg-accent/10 text-accent rounded">
                    {filterBy === 'positive' ? 'Positive Performance' : 'Negative Performance'}
                  </span>
                )}
                {searchTerm !== '' && (
                  <span className="px-2 py-1 bg-accent/10 text-accent rounded">
                    "{searchTerm}"
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilterBy('all')
                    setSearchTerm('')
                  }}
                  className="text-accent hover:text-accent-hover"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Content - Table or Cards */}
          {filteredAndSortedFunds.length === 0 ? (
            <div className={`px-6 py-16 text-center text-foreground/60 ${panelBase} rounded-t-none border-t-0`}>
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-foreground/20" />
              <p className="text-sm font-medium">No funds match your filters</p>
              <button
                onClick={() => {
                  setFilterBy('all')
                  setSearchTerm('')
                }}
                className="mt-2 text-sm text-accent hover:text-accent-hover"
              >
                Clear filters
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <div className={`${panelBase} rounded-t-none border-t-0 overflow-hidden`}>
              {/* Table Header - Fixed */}
              <div className="overflow-x-auto border-b border-border">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-foreground/70 uppercase tracking-wider min-w-max">
                  <div>Fund</div>
                  <div className="text-right w-16">Vintage</div>
                  <div className="text-right w-28">Commitment</div>
                  <div className="text-right w-24">Paid In</div>
                  <div className="text-right w-24">NAV</div>
                  <div className="text-right w-16">TVPI</div>
                  <div className="text-right w-16">DPI</div>
                </div>
              </div>

              {/* Table Rows - Scrollable */}
              <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                {filteredAndSortedFunds.map((fund) => (
                  <Link
                    key={fund.id}
                    href={`/funds/${fund.id}`}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group min-w-max"
                  >
                    <div className="flex flex-col justify-center min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate group-hover:text-accent transition-colors" title={fund.name}>
                        {fund.name}
                      </p>
                      <p className="text-xs text-foreground/60 truncate" title={fund.manager}>
                        {fund.manager}
                      </p>
                    </div>
                    <div className="w-16 flex items-center justify-end" title={`Vintage: ${fund.vintage}`}>
                      <span className="text-sm text-foreground/70 font-mono">{fund.vintage}</span>
                    </div>
                    <div className="w-28 flex items-center justify-end" title={`Commitment: ${formatCurrency(fund.commitment)}`}>
                      <span className="text-sm text-foreground/70 font-mono">
                        {(fund.commitment / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="w-24 flex items-center justify-end" title={`Paid In: ${formatCurrency(fund.paidIn)}`}>
                      <span className="text-sm text-foreground/70 font-mono">
                        {(fund.paidIn / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="w-24 flex items-center justify-end" title={`NAV: ${formatCurrency(fund.nav)}`}>
                      <span className="text-sm text-foreground/70 font-mono">
                        {(fund.nav / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="w-16 flex items-center justify-end" title={`TVPI: ${formatMultiple(fund.tvpi)}`}>
                      <span className="text-sm font-bold text-foreground tabular-nums">
                        {formatMultiple(fund.tvpi)}
                      </span>
                    </div>
                    <div className="w-16 flex items-center justify-end" title={`DPI: ${formatMultiple(fund.dpi)}`}>
                      <span className="text-sm font-semibold text-foreground/70 tabular-nums">
                        {formatMultiple(fund.dpi)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Summary Row */}
              <div className="border-t border-border overflow-x-auto">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 min-w-max">
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-foreground">Total / Average</span>
                  </div>
                  <div className="w-16"></div>
                  <div className="w-28 flex items-center justify-end">
                    <span className="text-sm font-bold text-foreground font-mono">
                      {(portfolioSummary.totalCommitment / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="w-24 flex items-center justify-end">
                    <span className="text-sm font-bold text-foreground font-mono">
                      {(portfolioSummary.totalPaidIn / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="w-24 flex items-center justify-end">
                    <span className="text-sm font-bold text-foreground font-mono">
                      {(portfolioSummary.totalNav / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="w-16 flex items-center justify-end">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatMultiple(portfolioSummary.portfolioTvpi)}
                    </span>
                  </div>
                  <div className="w-16 flex items-center justify-end">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatMultiple(portfolioSummary.portfolioDpi)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {filteredAndSortedFunds.map((fund, index) => (
                <motion.div
                  key={fund.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <FundCard {...fund} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
