'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import {
  FileText,
  Plus,
  Play,
  Save,
  Download,
  Filter,
  BarChart3,
  Calendar,
  Trash2,
  Copy,
  Edit,
  Clock,
  Folder,
  TrendingUp,
  PieChart,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatMultiple, formatDate } from '@/lib/utils'

interface SavedReport {
  id: string
  name: string
  description: string | null
  config: any
  createdAt: Date
  updatedAt: Date
}

interface Fund {
  id: string
  name: string
  domicile: string
  vintage: number
  manager: string
  commitment: number
  paidIn: number
  nav: number
  tvpi: number
  dpi: number
}

interface DirectInvestment {
  id: string
  name: string
  investmentType: string
  industry: string | null
  stage: string | null
  investmentAmount: number | null
  currentValue: number | null
}

interface ReportsClientProps {
  savedReports: SavedReport[]
  funds: Fund[]
  directInvestments: DirectInvestment[]
  userRole: string
}

type ReportType = 'portfolio_summary' | 'fund_performance' | 'cash_flow' | 'concentration' | 'custom'
type GroupBy = 'none' | 'vintage' | 'domicile' | 'manager' | 'investmentType' | 'industry' | 'stage'
type MetricType = 'commitment' | 'paidIn' | 'nav' | 'tvpi' | 'dpi' | 'investmentAmount' | 'currentValue'

interface ReportConfig {
  type: ReportType
  name: string
  description: string
  dateRange: {
    start: string
    end: string
  }
  filters: {
    fundIds: string[]
    investmentIds: string[]
    vintage?: number[]
    domicile?: string[]
    manager?: string[]
    investmentType?: string[]
  }
  groupBy: GroupBy
  metrics: MetricType[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function ReportsClient({ savedReports, funds, directInvestments, userRole }: ReportsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<'list' | 'builder'>('list')
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'portfolio_summary',
    name: 'New Report',
    description: '',
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    filters: {
      fundIds: [],
      investmentIds: [],
    },
    groupBy: 'none',
    metrics: ['commitment', 'paidIn', 'nav', 'tvpi', 'dpi'],
  })
  const [reportData, setReportData] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const reportTemplates = [
    {
      id: 'portfolio_summary',
      name: 'Portfolio Summary',
      description: 'Complete overview of portfolio performance and metrics',
      icon: PieChart,
      color: 'blue',
    },
    {
      id: 'fund_performance',
      name: 'Fund Performance',
      description: 'Detailed performance analysis by fund',
      icon: TrendingUp,
      color: 'green',
    },
    {
      id: 'cash_flow',
      name: 'Cash Flow Analysis',
      description: 'Capital calls, distributions, and cash flow trends',
      icon: DollarSign,
      color: 'purple',
    },
    {
      id: 'concentration',
      name: 'Concentration Analysis',
      description: 'Portfolio concentration by vintage, geography, and sector',
      icon: BarChart3,
      color: 'orange',
    },
    {
      id: 'custom',
      name: 'Custom Report',
      description: 'Build your own report with custom filters and groupings',
      icon: FileText,
      color: 'slate',
    },
  ]

  const handleRunReport = async () => {
    setIsRunning(true)
    try {
      const response = await fetch('/api/reports/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportConfig),
      })

      if (response.ok) {
        const data = await response.json()
        setReportData(data.result)
      }
    } catch (error) {
      console.error('Failed to run report:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSaveReport = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportConfig.name,
          description: reportConfig.description,
          config: reportConfig,
        }),
      })

      if (response.ok) {
        // Refresh page to show new saved report
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to save report:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/reports/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: reportConfig, data: reportData }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportConfig.name.replace(/\s+/g, '_')}.${format === 'excel' ? 'xlsx' : 'pdf'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to delete report:', error)
    }
  }

  const handleLoadReport = (report: SavedReport) => {
    setReportConfig(report.config)
    setView('builder')
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8" data-animate>
            <div className="flex items-center justify-between mb-4">
              <div data-tilt>
                <h1 className="text-2xl font-semibold text-foreground mb-1">Reports & Analytics</h1>
                <p className="text-sm text-foreground/60">
                  Create custom reports and analyze your portfolio
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    view === 'list'
                      ? 'bg-accent text-white'
                      : 'bg-white dark:bg-surface text-foreground border border-border hover:bg-surface-hover'
                  }`}
                >
                  <Folder className="w-4 h-4 inline mr-2" />
                  My Reports
                </button>
                <button
                  onClick={() => {
                    setView('builder')
                    setReportData(null)
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    view === 'builder'
                      ? 'bg-accent text-white'
                      : 'bg-white dark:bg-surface text-foreground border border-border hover:bg-surface-hover'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  New Report
                </button>
              </div>
            </div>
          </div>

          {view === 'list' && (
            <div className="space-y-6">
              {/* Report Templates */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Report Templates</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportTemplates.map((template) => {
                    const Icon = template.icon
                    return (
                      <button
                        key={template.id}
                        onClick={() => {
                          setReportConfig({
                            ...reportConfig,
                            type: template.id as ReportType,
                            name: template.name,
                            description: template.description,
                          })
                          setView('builder')
                        }}
                        data-animate data-tilt
                        className="group bg-white/85 dark:bg-surface/85 rounded-lg border border-border p-5 text-left hover:shadow-md hover:border-accent/40 transition-all backdrop-blur shadow-[0_18px_55px_rgba(5,10,30,0.28)]"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-${template.color}-500/10 dark:bg-${template.color}-500/20 flex items-center justify-center mb-4`}>
                          <Icon className={`w-5 h-5 text-${template.color}-600 dark:text-${template.color}-400`} />
                        </div>
                        <div className="font-semibold text-base mb-1 group-hover:text-accent transition-colors">
                          {template.name}
                        </div>
                        <div className="text-sm text-foreground/60 leading-relaxed">
                          {template.description}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Saved Reports */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Saved Reports</h2>
                {savedReports.length > 0 ? (
                  <div className="space-y-3">
                    {savedReports.map((report) => (
                      <div
                        key={report.id}
                        data-animate data-tilt
                        className="bg-white/85 dark:bg-surface/85 rounded-lg border border-border p-5 hover:shadow-lg transition-all backdrop-blur shadow-[0_18px_55px_rgba(5,10,30,0.28)]"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base mb-1">{report.name}</h3>
                              {report.description && (
                                <p className="text-sm text-foreground/60 mb-2">{report.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-foreground/50">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Updated {formatDate(new Date(report.updatedAt))}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleLoadReport(report)}
                              className="px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 rounded-md transition-colors"
                            >
                              <Play className="w-4 h-4 inline mr-1" />
                              Run
                            </button>
                            <button
                              onClick={() => handleLoadReport(report)}
                              className="px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover rounded-md transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-surface rounded-lg border border-border p-12 text-center">
                    <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-foreground font-medium mb-1">No Saved Reports</p>
                    <p className="text-foreground/60 text-sm mb-4">
                      Create your first custom report to get started
                    </p>
                    <button
                      onClick={() => setView('builder')}
                      className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent-hover transition-colors"
                    >
                      Create Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'builder' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Report Configuration (Left) */}
              <div className="lg:col-span-1 space-y-6">
                {/* Basic Info */}
                <div className="bg-white dark:bg-surface rounded-lg border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
                    Report Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground/60 mb-1.5 uppercase tracking-wide">
                        Report Name
                      </label>
                      <input
                        type="text"
                        value={reportConfig.name}
                        onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white dark:bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                        placeholder="My Portfolio Report"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground/60 mb-1.5 uppercase tracking-wide">
                        Description
                      </label>
                      <textarea
                        value={reportConfig.description}
                        onChange={(e) => setReportConfig({ ...reportConfig, description: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white dark:bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                        rows={3}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="bg-white dark:bg-surface rounded-lg border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date Range
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground/60 mb-1.5">Start Date</label>
                      <input
                        type="date"
                        value={reportConfig.dateRange.start}
                        onChange={(e) =>
                          setReportConfig({
                            ...reportConfig,
                            dateRange: { ...reportConfig.dateRange, start: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white dark:bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground/60 mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={reportConfig.dateRange.end}
                        onChange={(e) =>
                          setReportConfig({
                            ...reportConfig,
                            dateRange: { ...reportConfig.dateRange, end: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white dark:bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-surface rounded-lg border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground/60 mb-1.5">Funds</label>
                      <select
                        multiple
                        value={reportConfig.filters.fundIds}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                          setReportConfig({
                            ...reportConfig,
                            filters: { ...reportConfig.filters, fundIds: selected },
                          })
                        }}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white dark:bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                        size={4}
                      >
                        <option value="">All Funds</option>
                        {funds.map((fund) => (
                          <option key={fund.id} value={fund.id}>
                            {fund.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-foreground/50 mt-1">Hold Cmd/Ctrl to select multiple</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground/60 mb-1.5">Group By</label>
                      <select
                        value={reportConfig.groupBy}
                        onChange={(e) => setReportConfig({ ...reportConfig, groupBy: e.target.value as GroupBy })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white dark:bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                      >
                        <option value="none">No Grouping</option>
                        <option value="vintage">Vintage Year</option>
                        <option value="domicile">Geography</option>
                        <option value="manager">Manager</option>
                        <option value="investmentType">Investment Type</option>
                        <option value="industry">Industry</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleRunReport}
                    disabled={isRunning}
                    className="w-full px-4 py-3 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {isRunning ? 'Running...' : 'Run Report'}
                  </button>

                  <button
                    onClick={handleSaveReport}
                    disabled={isSaving || !reportConfig.name}
                    className="w-full px-4 py-3 bg-white dark:bg-surface text-foreground border border-border rounded-md text-sm font-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Report'}
                  </button>

                  {reportData && (
                    <>
                      <button
                        onClick={() => handleExportReport('excel')}
                        className="w-full px-4 py-3 bg-white dark:bg-surface text-foreground border border-border rounded-md text-sm font-medium hover:bg-surface-hover transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export to Excel
                      </button>
                      <button
                        onClick={() => handleExportReport('pdf')}
                        className="w-full px-4 py-3 bg-white dark:bg-surface text-foreground border border-border rounded-md text-sm font-medium hover:bg-surface-hover transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export to PDF
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Report Preview (Right) */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-surface rounded-lg border border-border p-6 min-h-[600px]">
                  {reportData ? (
                    <div>
                      <div className="mb-6 pb-6 border-b border-border">
                        <h2 className="text-xl font-semibold text-foreground mb-1">{reportConfig.name}</h2>
                        {reportConfig.description && (
                          <p className="text-sm text-foreground/60">{reportConfig.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-foreground/50">
                          <span>
                            {new Date(reportConfig.dateRange.start).toLocaleDateString()} -{' '}
                            {new Date(reportConfig.dateRange.end).toLocaleDateString()}
                          </span>
                          <span>Generated {new Date().toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Report Data Visualization */}
                      <div className="space-y-6">
                        {reportData.summary && (
                          <div>
                            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
                              Summary
                            </h3>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {Object.entries(reportData.summary).map(([key, value]) => (
                                <div key={key} className="bg-surface rounded-lg p-4">
                                  <div className="text-xs font-medium text-foreground/60 mb-1 uppercase tracking-wide">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </div>
                                  <div className="text-lg font-semibold">
                                    {typeof value === 'number' && key.toLowerCase().includes('amount')
                                      ? formatCurrency(value)
                                      : typeof value === 'number' && (key.toLowerCase().includes('tvpi') || key.toLowerCase().includes('dpi'))
                                      ? formatMultiple(value)
                                      : String(value)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {reportData.data && reportData.data.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
                              Details
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-surface border-b border-border">
                                  <tr>
                                    {Object.keys(reportData.data[0]).map((key) => (
                                      <th
                                        key={key}
                                        className="px-4 py-3 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wide"
                                      >
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {reportData.data.map((row: any, index: number) => (
                                    <tr key={index} className="hover:bg-surface transition-colors">
                                      {Object.entries(row).map(([key, value], cellIndex) => (
                                        <td key={cellIndex} className="px-4 py-3 text-foreground">
                                          {typeof value === 'number' && key.toLowerCase().includes('amount')
                                            ? formatCurrency(value)
                                            : typeof value === 'number' && (key.toLowerCase().includes('tvpi') || key.toLowerCase().includes('dpi'))
                                            ? formatMultiple(value)
                                            : String(value)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-foreground font-medium mb-2">Ready to Generate Report</p>
                        <p className="text-sm text-foreground/60 mb-6">
                          Configure your report settings and click "Run Report" to see results
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

