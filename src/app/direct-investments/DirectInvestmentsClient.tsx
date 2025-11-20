'use client'

import { useState, useMemo } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ExportButton } from '@/components/ExportButton'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Filter, Search, ArrowUpDown, Eye, EyeOff, Building2, Link as LinkIcon, Zap } from 'lucide-react'
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
    const totalARR = directInvestments.reduce((sum, inv) => sum + (inv.arr || 0), 0)
    const totalCashBalance = directInvestments.reduce((sum, inv) => sum + (inv.cashBalance || 0), 0)
    const avgArr = directInvestments.length > 0 
      ? directInvestments.filter(inv => inv.arr).reduce((sum, inv) => sum + (inv.arr || 0), 0) / directInvestments.filter(inv => inv.arr).length 
      : 0

    return {
      totalInvested,
      totalRevenue,
      totalARR,
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
            headers: ['Name', 'Type', 'Industry', 'Stage', 'Investment', 'Current Value', 'Return'],
            rows: filteredAndSortedInvestments.map((inv) => [
              inv.name,
              inv.investmentType,
              inv.industry || 'N/A',
              inv.stage || 'N/A',
              formatCurrencyForExport(inv.investmentAmount || 0),
              formatCurrencyForExport(inv.currentValue || 0),
              formatCurrencyForExport((inv.currentValue || 0) - (inv.investmentAmount || 0)),
            ]),
          },
        },
        {
          title: 'Performance by Type',
          type: 'table',
          data: {
            headers: ['Investment Type', 'Count', 'Total Invested', 'Current Value', 'ROI %'],
            rows: Object.entries(
              filteredAndSortedInvestments.reduce((acc, inv) => {
                if (!acc[inv.investmentType]) {
                  acc[inv.investmentType] = { count: 0, invested: 0, value: 0 }
                }
                acc[inv.investmentType].count++
                acc[inv.investmentType].invested += inv.investmentAmount || 0
                acc[inv.investmentType].value += inv.currentValue || 0
                return acc
              }, {} as Record<string, { count: number; invested: number; value: number }>)
            ).map(([type, data]) => [
              type,
              data.count.toString(),
              formatCurrencyForExport(data.invested),
              formatCurrencyForExport(data.value),
              formatPercentForExport(data.invested > 0 ? ((data.value - data.invested) / data.invested) * 100 : 0),
            ]),
          },
        },
      ],
    })

    doc.save(`direct-investments-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportExcel = async () => {
    const currentValue = directInvestments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0)
    const totalReturn = currentValue - portfolioSummary.totalInvested
    const avgROI = portfolioSummary.totalInvested > 0 ? (totalReturn / portfolioSummary.totalInvested) * 100 : 0

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
            ['Current Value', currentValue],
            ['Total Return', totalReturn],
            ['Average ROI', avgROI],
          ],
        },
        {
          name: 'Investments',
          data: [
            ['Name', 'Type', 'Industry', 'Stage', 'Investment Date', 'Investment', 'Current Value', 'Return', 'ROI %'],
            ...filteredAndSortedInvestments.map((inv) => [
              inv.name,
              inv.investmentType,
              inv.industry || 'N/A',
              inv.stage || 'N/A',
              inv.investmentDate ? formatDateForExport(inv.investmentDate) : 'N/A',
              inv.investmentAmount || 0,
              inv.currentValue || 0,
              (inv.currentValue || 0) - (inv.investmentAmount || 0),
              inv.investmentAmount && inv.investmentAmount > 0
                ? (((inv.currentValue || 0) - inv.investmentAmount) / inv.investmentAmount) * 100
                : 0,
            ]),
          ],
        },
      ],
    })
  }

  const handleExportCSV = async () => {
    const csvData = [
      ['Name', 'Type', 'Industry', 'Stage', 'Investment', 'Current Value', 'Return', 'ROI %'],
      ...filteredAndSortedInvestments.map((inv) => [
        inv.name,
        inv.investmentType,
        inv.industry || 'N/A',
        inv.stage || 'N/A',
        (inv.investmentAmount || 0).toString(),
        (inv.currentValue || 0).toString(),
        ((inv.currentValue || 0) - (inv.investmentAmount || 0)).toString(),
        inv.investmentAmount && inv.investmentAmount > 0
          ? ((((inv.currentValue || 0) - inv.investmentAmount) / inv.investmentAmount) * 100).toFixed(2)
          : '0',
      ]),
    ]

    exportToCSV(csvData, `direct-investments-${new Date().toISOString().split('T')[0]}`)
  }

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
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
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
            <ExportButton
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onExportCSV={handleExportCSV}
              label="Export Portfolio"
            />
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10 rounded-xl border border-purple-200/60 dark:border-purple-800/60 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                  Total Invested
                </div>
              </div>
              <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(portfolioSummary.totalInvested)}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl border border-blue-200/60 dark:border-blue-800/60 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                  Total Revenue
                </div>
              </div>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(portfolioSummary.totalRevenue)}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                  Total ARR
                </div>
              </div>
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(portfolioSummary.totalARR)}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 rounded-xl border border-amber-200/60 dark:border-amber-800/60 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                  Portfolio Companies
                </div>
              </div>
              <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                {portfolioSummary.totalInvestments}
              </div>
            </motion.div>
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
                  <Eye className="w-4 h-4" />
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
                      <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 p-6 hover:shadow-2xl hover:border-accent/50 transition-all cursor-pointer h-full">
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
              <div className="bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 overflow-hidden p-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Startup</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Stage</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Investment</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">ARR</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Cash Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-slate-800">
                      {filteredAndSortedInvestments.map((investment, index) => (
                        <motion.tr
                          key={investment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.05, duration: 0.3 }}
                          className="hover:bg-surface-hover dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
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
              className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-xl p-12 text-center"
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

