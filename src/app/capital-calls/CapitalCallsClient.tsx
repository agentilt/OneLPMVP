'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { motion } from 'framer-motion'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ExportButton } from '@/components/ExportButton'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle,
  Clock,
  Filter,
  XCircle,
  DollarSign,
  TrendingUp,
  Search,
  Download,
} from 'lucide-react'
import { exportToCSV } from '@/lib/exportUtils'
import Link from 'next/link'

type CapitalCallStatus = 'PAID' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING'

interface CapitalCall {
  id: string
  fundId: string
  fundName: string
  title: string
  dueDate: string | null
  uploadDate: string
  callAmount: number
  paymentStatus: string
  status: CapitalCallStatus
}

interface CapitalCallSummary {
  totalCalls: number
  outstandingCount: number
  outstandingAmount: number
  dueSoonCount: number
  dueSoonAmount: number
  overdueCount: number
  overdueAmount: number
}

interface ApiResponse {
  capitalCalls: CapitalCall[]
  summary: CapitalCallSummary
}

const panelBase =
  'bg-white dark:bg-surface rounded-lg shadow-sm border border-border dark:border-slate-800 overflow-hidden'
const panelHeader =
  'px-6 py-4 border-b border-border dark:border-slate-800 flex items-center gap-2'

export function CapitalCallsClient() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fundFilter, setFundFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<CapitalCallStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isQuickExporting, setIsQuickExporting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/capital-calls')
      if (!res.ok) {
        throw new Error('Unable to load capital calls')
      }
      const result = await res.json()
      setData(result.data)
    } catch (err) {
      setError('Unable to load capital calls')
    } finally {
      setLoading(false)
    }
  }

  const funds = useMemo(() => {
    if (!data) return []
    const map = new Map<string, string>()
    data.capitalCalls.forEach((c) => {
      map.set(c.fundId, c.fundName)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [data])

  const filteredCalls = useMemo(() => {
    if (!data) return []
    return data.capitalCalls.filter((call) => {
      const fundMatch = fundFilter === 'all' ? true : call.fundId === fundFilter
      const statusMatch = statusFilter === 'ALL' ? true : call.status === statusFilter
      const searchMatch = searchQuery === '' || 
        call.fundName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.title.toLowerCase().includes(searchQuery.toLowerCase())
      return fundMatch && statusMatch && searchMatch
    })
  }, [data, fundFilter, statusFilter, searchQuery])

  const filteredSummary = useMemo(() => {
    const outstandingAmount = filteredCalls
      .filter((c) => c.status !== 'PAID')
      .reduce((sum, c) => sum + Math.abs(c.callAmount), 0)
    
    const dueSoonAmount = filteredCalls
      .filter((c) => c.status === 'DUE_SOON')
      .reduce((sum, c) => sum + Math.abs(c.callAmount), 0)
    
    const overdueAmount = filteredCalls
      .filter((c) => c.status === 'OVERDUE')
      .reduce((sum, c) => sum + Math.abs(c.callAmount), 0)
    
    const paidAmount = filteredCalls
      .filter((c) => c.status === 'PAID')
      .reduce((sum, c) => sum + Math.abs(c.callAmount), 0)

    return {
      outstanding: outstandingAmount,
      dueSoon: dueSoonAmount,
      overdue: overdueAmount,
      paid: paidAmount,
      total: filteredCalls.length,
    }
  }, [filteredCalls])

  const handleExportCSV = () => {
    if (!filteredCalls.length) return
    const rows = [
      ['Fund', 'Title', 'Due Date', 'Amount', 'Status', 'Payment Status'],
      ...filteredCalls.map((c) => [
        c.fundName,
        c.title,
        c.dueDate ? formatDate(new Date(c.dueDate)) : 'N/A',
        c.callAmount.toString(),
        c.status,
        c.paymentStatus || 'PENDING',
      ]),
    ]
    exportToCSV(rows, `capital-calls-${new Date().toISOString().split('T')[0]}`)
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
      await Promise.resolve(handleExportCSV())
    } finally {
      setIsQuickExporting(false)
    }
  }, [isQuickExporting, handleExportCSV])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface dark:bg-background">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-6">
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-accent" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!data || error) {
    return (
      <div className="min-h-screen bg-surface dark:bg-background">
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-6">
            <div className="h-64 flex items-center justify-center text-foreground/60">
              {error || 'No capital call data available'}
            </div>
          </main>
        </div>
      </div>
    )
  }

  const { summary } = data

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
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
            <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
              <h1 className="text-3xl font-bold text-foreground">Capital Calls</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleQuickExport}
                  disabled={isQuickExporting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white dark:bg-surface text-sm font-semibold text-foreground hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <ExportButton onExportCSV={handleExportCSV} label="Export" />
              </div>
            </div>
            <p className="text-sm text-foreground/60">
              Monitor outstanding capital call obligations across your portfolio
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
                      Outstanding
                    </div>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(summary.outstandingAmount)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/60">Unpaid Calls</span>
                <span className="font-semibold text-foreground/80">{summary.outstandingCount}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-surface border border-amber-200 dark:border-amber-500/30 rounded-lg p-5 hover:border-amber-500/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                      Due Soon
                    </div>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(summary.dueSoonAmount)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/60">≤14 Days</span>
                <span className="font-semibold text-foreground/80">{summary.dueSoonCount} calls</span>
              </div>
            </div>

            <div className="bg-white dark:bg-surface border border-red-200 dark:border-red-500/30 rounded-lg p-5 hover:border-red-500/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                      Overdue
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                      {formatCurrency(summary.overdueAmount)}
                    </div>
                  </div>
                </div>
                {summary.overdueCount > 0 && (
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mt-1"></div>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/60">Action Required</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{summary.overdueCount} calls</span>
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
                      Total Calls
                    </div>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {summary.totalCalls}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/60">All Statuses</span>
                <span className="font-semibold text-foreground/80">YTD</span>
              </div>
            </div>
          </motion.div>

          {/* Capital Calls Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={panelBase}
          >
            {/* Table Header with Filters */}
            <div className="px-6 py-4 border-b border-border dark:border-slate-800">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-foreground/70" />
                  <h2 className="font-bold text-lg text-foreground">All Capital Calls</h2>
                  <span className="text-sm text-foreground/60">({filteredCalls.length})</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <input
                      type="text"
                      placeholder="Search funds or titles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>

                  {/* Fund Filter */}
                  <select
                    value={fundFilter}
                    onChange={(e) => setFundFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="all">All Funds</option>
                    {funds.map((fund) => (
                      <option key={fund.id} value={fund.id}>
                        {fund.name}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as CapitalCallStatus | 'ALL')}
                    className="px-3 py-2 text-sm border border-border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="DUE_SOON">Due Soon</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(fundFilter !== 'all' || statusFilter !== 'ALL' || searchQuery !== '') && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-foreground/60">Active filters:</span>
                  {fundFilter !== 'all' && (
                    <span className="px-2 py-1 bg-accent/10 text-accent rounded">
                      {funds.find(f => f.id === fundFilter)?.name}
                    </span>
                  )}
                  {statusFilter !== 'ALL' && (
                    <span className="px-2 py-1 bg-accent/10 text-accent rounded">
                      {statusFilter.replace('_', ' ')}
                    </span>
                  )}
                  {searchQuery !== '' && (
                    <span className="px-2 py-1 bg-accent/10 text-accent rounded">
                      "{searchQuery}"
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setFundFilter('all')
                      setStatusFilter('ALL')
                      setSearchQuery('')
                    }}
                    className="text-accent hover:text-accent-hover"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Table - Scrollable Container */}
            {filteredCalls.length === 0 ? (
              <div className="px-6 py-16 text-center text-foreground/60">
                <CalendarClock className="w-12 h-12 mx-auto mb-3 text-foreground/20" />
                <p className="text-sm font-medium">No capital calls match your filters</p>
                <button
                  onClick={() => {
                    setFundFilter('all')
                    setStatusFilter('ALL')
                    setSearchQuery('')
                  }}
                  className="mt-2 text-sm text-accent hover:text-accent-hover"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                {/* Table Header - Fixed */}
                <div className="overflow-x-auto border-b border-border">
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                    <div>Fund</div>
                    <div className="w-40">Title</div>
                    <div className="text-right w-24">Due Date</div>
                    <div className="text-right w-28">Amount</div>
                    <div className="text-center w-24">Status</div>
                    <div className="text-center w-24">Payment</div>
                  </div>
                </div>

                {/* Table Rows - Scrollable */}
                <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                  {filteredCalls.map((call) => (
                    <Link
                      key={call.id}
                      href={`/funds/${call.fundId}`}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group"
                    >
                      <div className="flex items-center min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate group-hover:text-accent transition-colors" title={call.fundName}>
                          {call.fundName}
                        </p>
                      </div>
                      <div className="w-40 flex items-center">
                        <span className="text-sm text-foreground/70 truncate" title={call.title}>
                          {call.title}
                        </span>
                      </div>
                      <div className="w-24 flex items-center justify-end">
                        <span className="text-sm text-foreground/70 font-mono">
                          {call.dueDate ? new Date(call.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </span>
                      </div>
                      <div className="w-28 flex items-center justify-end">
                        <span className="text-sm font-bold text-foreground tabular-nums" title={formatCurrency(Math.abs(call.callAmount))}>
                          {formatCurrency(Math.abs(call.callAmount))}
                        </span>
                      </div>
                      <div className="w-24 flex items-center justify-center">
                        <StatusPill status={call.status} />
                      </div>
                      <div className="w-24 flex items-center justify-center">
                        <span className="text-sm text-foreground/70">
                          {call.paymentStatus || 'PENDING'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Summary Row - Fixed at Bottom */}
                <div className="border-t border-border">
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-foreground">Total</span>
                    </div>
                    <div className="w-40"></div>
                    <div className="w-24"></div>
                    <div className="w-28 flex items-center justify-end">
                      <span className="text-sm font-bold text-foreground tabular-nums">
                        {formatCurrency(filteredSummary.outstanding)}
                      </span>
                    </div>
                    <div className="w-24 flex items-center justify-center">
                      <span className="text-xs text-foreground/60">{filteredSummary.total} calls</span>
                    </div>
                    <div className="w-24"></div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: CapitalCallStatus }) {
  const config: Record<CapitalCallStatus, { color: string; icon: any; label: string }> = {
    PAID: { 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500/30', 
      icon: CheckCircle, 
      label: 'Paid' 
    },
    OVERDUE: { 
      color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-500/30', 
      icon: XCircle, 
      label: 'Overdue' 
    },
    DUE_SOON: { 
      color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-500/30', 
      icon: AlertTriangle, 
      label: 'Due Soon' 
    },
    UPCOMING: { 
      color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-500/30', 
      icon: Clock, 
      label: 'Upcoming' 
    },
  }

  const { color, icon: Icon, label } = config[status]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}
