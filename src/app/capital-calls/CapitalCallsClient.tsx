'use client'

import { useEffect, useMemo, useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { motion } from 'framer-motion'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ExportButton } from '@/components/ExportButton'
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle,
  Clock,
  Filter,
  XCircle,
} from 'lucide-react'
import { exportToCSV } from '@/lib/exportUtils'

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
  'bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 overflow-hidden'
const panelHeader =
  'bg-gradient-to-r from-accent/10 via-accent/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2'

export function CapitalCallsClient() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fundFilter, setFundFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<CapitalCallStatus | 'ALL'>('ALL')

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
      return fundMatch && statusMatch
    })
  }, [data, fundFilter, statusFilter])

  const outstandingAmount = useMemo(
    () =>
      filteredCalls
        .filter((c) => c.status !== 'PAID')
        .reduce((sum, c) => sum + Math.abs(c.callAmount), 0),
    [filteredCalls]
  )

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
        <main className="flex-1 p-6 lg:p-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
                <CalendarClock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Capital Calls</h1>
                <p className="text-sm text-foreground/60">
                  Track outstanding, due soon, and paid calls across all funds.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton onExportCSV={handleExportCSV} label="Export CSV" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard
              title="Outstanding"
              value={formatCurrency(summary.outstandingAmount)}
              subtitle={`${summary.outstandingCount} calls`}
              accent="amber"
              icon={Clock}
            />
            <SummaryCard
              title="Due soon (≤14d)"
              value={formatCurrency(summary.dueSoonAmount)}
              subtitle={`${summary.dueSoonCount} calls`}
              accent="blue"
              icon={AlertTriangle}
            />
            <SummaryCard
              title="Overdue"
              value={formatCurrency(summary.overdueAmount)}
              subtitle={`${summary.overdueCount} calls`}
              accent="red"
              icon={XCircle}
            />
            <SummaryCard
              title="Total calls"
              value={summary.totalCalls.toString()}
              subtitle="All statuses"
              accent="emerald"
              icon={Activity}
            />
          </div>

          <div className={`${panelBase}`}>
            <div className={`${panelHeader} justify-between`}>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-accent" />
                <h2 className="font-bold text-lg">Filters</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={fundFilter}
                  onChange={(e) => setFundFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm"
                >
                  <option value="all">All funds</option>
                  {funds.map((fund) => (
                    <option key={fund.id} value={fund.id}>
                      {fund.name}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as CapitalCallStatus | 'ALL')}
                  className="px-3 py-2 rounded-xl border border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm"
                >
                  <option value="ALL">All statuses</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="DUE_SOON">Due soon</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      Fund
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      Due date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                  {filteredCalls.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-foreground/60">
                        No capital calls match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCalls.map((call) => (
                      <tr key={call.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{call.fundName}</td>
                        <td className="px-6 py-4 text-sm text-foreground/80">{call.title}</td>
                        <td className="px-6 py-4 text-sm text-foreground/70">
                          {call.dueDate ? formatDate(new Date(call.dueDate)) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-foreground">
                          {formatCurrency(Math.abs(call.callAmount))}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <StatusPill status={call.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground/70">{call.paymentStatus}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  subtitle,
  accent,
  icon: Icon,
}: {
  title: string
  value: string
  subtitle: string
  accent: 'amber' | 'blue' | 'red' | 'emerald'
  icon: any
}) {
  const colorMap = {
    amber: ['from-amber-500', 'to-amber-600'],
    blue: ['from-blue-500', 'to-blue-600'],
    red: ['from-red-500', 'to-red-600'],
    emerald: ['from-emerald-500', 'to-emerald-600'],
  }[accent]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${panelBase} p-5`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[0]} ${colorMap[1]} text-white flex items-center justify-center shadow-lg shadow-black/10`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground/60">{title}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
      <p className="text-xs text-foreground/60">{subtitle}</p>
    </motion.div>
  )
}

function StatusPill({ status }: { status: CapitalCallStatus }) {
  const styles: Record<CapitalCallStatus, string> = {
    PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    DUE_SOON: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    UPCOMING: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status === 'PAID' && <CheckCircle className="w-3.5 h-3.5" />}
      {status === 'OVERDUE' && <XCircle className="w-3.5 h-3.5" />}
      {status === 'DUE_SOON' && <AlertTriangle className="w-3.5 h-3.5" />}
      {status === 'UPCOMING' && <Clock className="w-3.5 h-3.5" />}
      {status.replace('_', ' ')}
    </span>
  )
}
