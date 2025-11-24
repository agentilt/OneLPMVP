'use client'

import { useState, useMemo } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ExportButton } from '@/components/ExportButton'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Search, ArrowUpDown, Building2, LayoutGrid, Table2, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  formatCurrencyForExport,
  formatPercentForExport,
  formatDateForExport,
} from '@/lib/exportUtils'

interface DirectInvestment {
  id: string
  name: string
  investmentType: string
  industry?: string | null
  stage?: string | null
  investmentDate?: Date | null
  investmentAmount?: number | null
  
  // Private Debt/Credit fields
  principalAmount?: number | null
  interestRate?: number | null
  couponRate?: number | null
  maturityDate?: Date | null
  creditRating?: string | null
  defaultStatus?: string | null
  currentValue?: number | null
  yield?: number | null
  
  // Public Equity fields
  tickerSymbol?: string | null
  shares?: number | null
  purchasePrice?: number | null
  currentPrice?: number | null
  dividends?: number | null
  marketValue?: number | null
  
  // Real Estate fields
  propertyType?: string | null
  propertyAddress?: string | null
  squareFootage?: number | null
  purchaseDate?: Date | null
  purchaseValue?: number | null
  currentAppraisal?: number | null
  rentalIncome?: number | null
  occupancyRate?: number | null
  propertyTax?: number | null
  maintenanceCost?: number | null
  netOperatingIncome?: number | null
  
  // Real Assets fields
  assetType?: string | null
  assetDescription?: string | null
  assetLocation?: string | null
  acquisitionDate?: Date | null
  acquisitionValue?: number | null
  assetCurrentValue?: number | null
  assetIncome?: number | null
  holdingCost?: number | null
  
  // Cash fields
  accountType?: string | null
  accountName?: string | null
  cashInterestRate?: number | null
  balance?: number | null
  currency?: string | null
  cashMaturityDate?: Date | null
  
  // Private Equity metrics
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

const panelBase =
  'bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 overflow-hidden'

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

export function DirectInvestmentsClient({ directInvestments }: DirectInvestmentsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'cashBalance' | 'investmentAmount'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'high-growth' | 'early-stage'>('all')

  // Calculate portfolio summary
  const portfolioSummary = useMemo(() => {
    const totalInvested = directInvestments.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0)
    const totalRevenue = directInvestments.reduce((sum, inv) => sum + (inv.revenue || 0), 0)
    const totalARR = directInvestments.reduce((sum, inv) => sum + (inv.arr || 0), 0)
    const totalCashBalance = directInvestments.reduce((sum, inv) => sum + (inv.cashBalance || 0), 0)

    return {
      totalInvested,
      totalRevenue,
      totalARR,
      totalCashBalance,
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

  // Export Functions
  const handleExportPDF = async () => {
    const currentValue = directInvestments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0)
    const totalReturn = currentValue - portfolioSummary.totalInvested
    const avgROI = portfolioSummary.totalInvested > 0 ? (totalReturn / portfolioSummary.totalInvested) * 100 : 0

    const doc = exportToPDF({
      title: 'Direct Investments Report',
      subtitle: 'Complete Portfolio Overview',
      date: formatDateForExport(new Date()),
      sections: [
        {
          title: 'Portfolio Summary',
          type: 'metrics',
          data: [
            { label: 'Total Investments', value: portfolioSummary.totalInvestments.toString() },
            { label: 'Total Invested', value: formatCurrencyForExport(portfolioSummary.totalInvested) },
            { label: 'Current Value', value: formatCurrencyForExport(currentValue) },
            { label: 'Total Return', value: formatCurrencyForExport(totalReturn) },
            { label: 'Average ROI', value: formatPercentForExport(avgROI) },
          ],
        },
        {
          title: 'Investment Portfolio',
          type: 'table',
          data: {
            headers: ['Name', 'Type', 'Industry', 'Stage', 'Investment', 'Revenue', 'ARR'],
            rows: filteredAndSortedInvestments.map((inv) => [
              inv.name,
              inv.investmentType,
              inv.industry || 'N/A',
              inv.stage || 'N/A',
              formatCurrencyForExport(inv.investmentAmount || 0),
              formatCurrencyForExport(inv.revenue || 0),
              formatCurrencyForExport(inv.arr || 0),
            ]),
          },
        },
      ],
    })

    doc.save(`direct-investments-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportExcel = async () => {
    exportToExcel({
      filename: `direct-investments-${new Date().toISOString().split('T')[0]}`,
      sheets: [
        {
          name: 'Summary',
          data: [
            ['Direct Investments Report'],
            ['Generated', formatDateForExport(new Date())],
            [],
            ['Metric', 'Value'],
            ['Total Investments', portfolioSummary.totalInvestments],
            ['Total Invested', portfolioSummary.totalInvested],
            ['Total Revenue', portfolioSummary.totalRevenue],
            ['Total ARR', portfolioSummary.totalARR],
          ],
        },
        {
          name: 'Investments',
          data: [
            ['Name', 'Type', 'Industry', 'Stage', 'Investment', 'Revenue', 'ARR', 'Cash Balance'],
            ...filteredAndSortedInvestments.map((inv) => [
              inv.name,
              inv.investmentType,
              inv.industry || 'N/A',
              inv.stage || 'N/A',
              inv.investmentAmount || 0,
              inv.revenue || 0,
              inv.arr || 0,
              inv.cashBalance || 0,
            ]),
          ],
        },
      ],
    })
  }

  const handleExportCSV = async () => {
    const csvData = [
      ['Name', 'Type', 'Industry', 'Stage', 'Investment', 'Revenue', 'ARR'],
      ...filteredAndSortedInvestments.map((inv) => [
        inv.name,
        inv.investmentType,
        inv.industry || 'N/A',
        inv.stage || 'N/A',
        (inv.investmentAmount || 0).toString(),
        (inv.revenue || 0).toString(),
        (inv.arr || 0).toString(),
      ]),
    ]

    exportToCSV(csvData, `direct-investments-${new Date().toISOString().split('T')[0]}`)
  }

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-foreground">Direct Investments</h1>
            <ExportButton
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onExportCSV={handleExportCSV}
              label="Export"
            />
          </div>
          <p className="text-sm text-foreground/60">
            Portfolio companies and direct investment holdings
          </p>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-lg p-5 hover:border-accent/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-foreground/70" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                    Total Invested
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatCurrency(portfolioSummary.totalInvested)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/60">Companies</span>
              <span className="font-semibold text-foreground/80">{directInvestments.length}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-lg p-5 hover:border-accent/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-foreground/70" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                    Total Revenue
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatCurrency(portfolioSummary.totalRevenue)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/60">Aggregate</span>
              <span className="font-semibold text-foreground/80">Latest</span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-lg p-5 hover:border-accent/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-foreground/70" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                    Total ARR
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatCurrency(portfolioSummary.totalARR)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/60">Annual Recurring</span>
              <span className="font-semibold text-foreground/80">Revenue</span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-lg p-5 hover:border-accent/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-foreground/70" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                    Cash Balance
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatCurrency(portfolioSummary.totalCashBalance)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/60">Portfolio Total</span>
              <span className="font-semibold text-foreground/80">Latest</span>
            </div>
          </div>
        </motion.div>

        {/* Investments Table/Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={viewMode === 'table' ? panelBase : ''}
        >
          {/* Table Header with Filters */}
          <div className="px-6 py-4 border-b border-border dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-foreground/70" />
                <h2 className="font-bold text-lg text-foreground">All Investments</h2>
                <span className="text-sm text-foreground/60">({filteredAndSortedInvestments.length})</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                  <input
                    type="text"
                    placeholder="Search investments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>

                {/* Stage Filter */}
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="all">All Stages</option>
                  <option value="high-growth">High Growth</option>
                  <option value="early-stage">Early Stage</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="name">Sort by Name</option>
                  <option value="revenue">Sort by Revenue</option>
                  <option value="cashBalance">Sort by Cash</option>
                  <option value="investmentAmount">Sort by Investment</option>
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
                    {filterBy === 'high-growth' ? 'High Growth' : 'Early Stage'}
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
          {filteredAndSortedInvestments.length === 0 ? (
            <div className="px-6 py-16 text-center text-foreground/60">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-foreground/20" />
              <p className="text-sm font-medium">No investments match your filters</p>
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
            <>
              {/* Table Header - Fixed */}
              <div className="overflow-x-auto border-b border-border">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                  <div>Company</div>
                  <div className="text-right w-28">Investment</div>
                  <div className="text-right w-24">Revenue</div>
                  <div className="text-right w-24">ARR</div>
                  <div className="text-right w-24">Cash</div>
                  <div className="w-20">Stage</div>
                </div>
              </div>

              {/* Table Rows - Scrollable */}
              <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                {filteredAndSortedInvestments.map((investment) => (
                  <Link
                    key={investment.id}
                    href={`/direct-investments/${investment.id}`}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group"
                  >
                    <div className="flex flex-col justify-center min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate group-hover:text-accent transition-colors" title={investment.name}>
                        {investment.name}
                      </p>
                      <p className="text-xs text-foreground/60 truncate" title={investment.industry || 'N/A'}>
                        {investment.industry || 'N/A'}
                      </p>
                    </div>
                    <div className="w-28 flex items-center justify-end" title={`Investment: ${formatCurrency(investment.investmentAmount)}`}>
                      <span className="text-sm text-foreground/70 font-mono">
                        {investment.investmentAmount ? `${(investment.investmentAmount / 1000000).toFixed(1)}M` : '—'}
                      </span>
                    </div>
                    <div className="w-24 flex items-center justify-end" title={`Revenue: ${formatCurrency(investment.revenue)}`}>
                      <span className="text-sm text-foreground/70 font-mono">
                        {investment.revenue ? `${(investment.revenue / 1000000).toFixed(1)}M` : '—'}
                      </span>
                    </div>
                    <div className="w-24 flex items-center justify-end" title={`ARR: ${formatCurrency(investment.arr)}`}>
                      <span className="text-sm text-foreground/70 font-mono">
                        {investment.arr ? `${(investment.arr / 1000000).toFixed(1)}M` : '—'}
                      </span>
                    </div>
                    <div className="w-24 flex items-center justify-end" title={`Cash: ${formatCurrency(investment.cashBalance)}`}>
                      <span className="text-sm text-foreground/70 font-mono">
                        {investment.cashBalance ? `${(investment.cashBalance / 1000000).toFixed(1)}M` : '—'}
                      </span>
                    </div>
                    <div className="w-20 flex items-center">
                      <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-foreground/70" title={investment.stage || 'N/A'}>
                        {investment.stage || 'N/A'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Summary Row */}
              <div className="border-t border-border">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-foreground">Total</span>
                  </div>
                  <div className="w-28 flex items-center justify-end">
                    <span className="text-sm font-bold text-foreground font-mono">
                      {(portfolioSummary.totalInvested / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="w-24 flex items-center justify-end">
                    <span className="text-sm font-bold text-foreground font-mono">
                      {(portfolioSummary.totalRevenue / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="w-24 flex items-center justify-end">
                    <span className="text-sm font-bold text-foreground font-mono">
                      {(portfolioSummary.totalARR / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="w-24 flex items-center justify-end">
                    <span className="text-sm font-bold text-foreground font-mono">
                      {(portfolioSummary.totalCashBalance / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="w-20 flex items-center">
                    <span className="text-xs text-foreground/60">{directInvestments.length} cos.</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAndSortedInvestments.map((investment, index) => (
                <motion.div
                  key={investment.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Link href={`/direct-investments/${investment.id}`}>
                    <div className="group bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 p-5 hover:shadow-md hover:border-accent/40 transition-all duration-150 cursor-pointer h-full">
                      {/* Header */}
                      <div className="mb-4">
                        <h3 className="font-semibold text-base group-hover:text-accent transition-colors mb-2">
                          {investment.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          {investment.industry && (
                            <>
                              <MapPin className="w-3 h-3" />
                              <span>{investment.industry}</span>
                            </>
                          )}
                          {investment.stage && (
                            <>
                              <span className="text-foreground/30">•</span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-foreground/70">
                                {investment.stage}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="space-y-3">
                        {investment.investmentAmount !== null && investment.investmentAmount !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-foreground/60">Investment</span>
                            <span className="text-sm font-bold text-foreground">{formatCurrency(investment.investmentAmount)}</span>
                          </div>
                        )}
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
                      </div>

                      {/* Footer */}
                      {investment.investmentDate && (
                        <div className="mt-4 pt-4 border-t border-border dark:border-slate-800 flex items-center gap-2 text-xs text-foreground/50">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(investment.investmentDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
