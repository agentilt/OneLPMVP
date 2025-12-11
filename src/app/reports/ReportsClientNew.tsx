'use client'

import { useEffect, useMemo, useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import {
  FileText,
  Plus,
  Play,
  Save,
  Download,
  Trash2,
  Edit,
  Clock,
  Folder,
  TrendingUp,
  PieChart,
  DollarSign,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
import { formatCurrency, formatDate, formatMultiple, formatPercent } from '@/lib/utils'
import { DragDropReportBuilder, ReportBuilderConfig } from '@/components/ReportBuilder/DragDropReportBuilder'
import { ChartPreview } from '@/components/ReportBuilder/ChartPreview'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DIMENSION_FIELDS, METRIC_FIELDS, ReportField } from '@/lib/reporting/fields'

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
  assetClass: string
  strategy: string
  sector?: string | null
  baseCurrency: string
  updatedAt: Date
}

interface DirectInvestment {
  id: string
  name: string
  investmentType: string
  industry: string | null
  stage: string | null
  investmentAmount: number | null
  currentValue: number | null
  investmentDate: Date | null
  currency: string | null
  updatedAt: Date
}

interface ReportsClientProps {
  savedReports: SavedReport[]
  funds: Fund[]
  directInvestments: DirectInvestment[]
  userRole: string
  savedReportsError: boolean
}

interface ReportRunResult {
  summary: {
    fundCount: number
    directInvestmentCount: number
    totalCommitment: number
    totalPaidIn: number
    totalNav: number
    avgTvpi: number
    avgDpi: number
    directInvestmentValue: number
  }
  data: any[]
  chartConfig: {
    xAxisField?: string
    yAxisFields?: string[]
    chartType?: 'bar' | 'line' | 'pie' | 'area' | 'table'
    groupDimensions?: string[]
  }
  generatedAt: string
  metadata?: {
    asOfDate?: string
    dataSources?: string[]
    reportingCurrency?: string
    fxRatesUsed?: string[]
    benchmark?: {
      name: string
      source?: string
      tvpi: number
      dpi: number
      irr: number
      currency?: string
    }
    maskedMetrics?: string[]
  }
}

const dimensionMap = DIMENSION_FIELDS.reduce((acc, d) => {
  acc[d.id] = d
  return acc
}, {} as Record<string, ReportField>)

const metricMap = METRIC_FIELDS.reduce((acc, m) => {
  acc[m.id] = m
  return acc
}, {} as Record<string, ReportField>)

const normalizeConfig = (config: any): ReportBuilderConfig => {
  const normalizeDimension = (field: any): ReportField => {
    const resolved = field?.id ? dimensionMap[field.id] : null
    return resolved || {
      id: field?.id || 'unknown',
      name: field?.name || field?.id || 'Unknown',
      type: 'dimension',
      iconId: field?.iconId,
    }
  }

  const normalizeMetric = (field: any): ReportField => {
    const resolved = field?.id ? metricMap[field.id] : null
    if (resolved) return resolved
    return {
      id: field?.id || 'unknown',
      name: field?.name || field?.id || 'Unknown',
      type: 'metric',
      iconId: field?.iconId,
      aggregation: 'sum',
      format: 'number',
    } as ReportField
  }

  return {
    dimensions: Array.isArray(config?.dimensions) ? config.dimensions.map(normalizeDimension) : [],
    metrics: Array.isArray(config?.metrics) ? config.metrics.map(normalizeMetric) : [],
    chartType: config?.chartType || 'bar',
  }
}

const templateColorClasses = {
  blue: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
} as const

type TemplateColor = keyof typeof templateColorClasses

export function ReportsClientNew({ savedReports, funds, directInvestments, userRole, savedReportsError }: ReportsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<'list' | 'builder'>('list')
  const [reportName, setReportName] = useState('New Report')
  const [reportDescription, setReportDescription] = useState('')
  const [builderConfig, setBuilderConfig] = useState<ReportBuilderConfig>(
    normalizeConfig({ dimensions: [], metrics: [], chartType: 'bar' })
  )
  const [baseCurrency, setBaseCurrency] = useState<string>('USD')
  const [reportResult, setReportResult] = useState<ReportRunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'excel' | 'pdf' | null>(null)
  const [selectedFundIds, setSelectedFundIds] = useState<string[]>([])
  const [selectedInvestmentIds, setSelectedInvestmentIds] = useState<string[]>([])
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([])
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [selectedManagers, setSelectedManagers] = useState<string[]>([])
  const [vintageRange, setVintageRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const reportingCurrency = reportResult?.metadata?.reportingCurrency || baseCurrency || 'USD'
  const benchmarkInfo = reportResult?.metadata?.benchmark
  const maskedMetrics = reportResult?.metadata?.maskedMetrics || []

  useEffect(() => {
    setSelectedFundIds(funds.map((f) => f.id))
  }, [funds])

  useEffect(() => {
    setSelectedInvestmentIds([])
  }, [directInvestments])

  const allFundIds = useMemo(() => funds.map((f) => f.id), [funds])
  const directInvestmentOptions = useMemo(() => directInvestments.map((di) => ({
    id: di.id,
    label: di.stage ? `${di.name} (${di.stage})` : di.name,
  })), [directInvestments])
  const strategyOptions = useMemo(
    () => Array.from(new Set(funds.map((f) => f.strategy).filter(Boolean))).sort(),
    [funds]
  )
  const sectorOptions = useMemo(
    () => Array.from(new Set(funds.map((f) => f.sector || 'Unknown'))).sort(),
    [funds]
  )
  const managerOptions = useMemo(
    () => Array.from(new Set(funds.map((f) => f.manager))).sort(),
    [funds]
  )

  const reportTemplates = [
    {
      id: 'portfolio_summary',
      name: 'Portfolio Summary',
      description: 'Complete overview of portfolio performance and metrics',
      icon: PieChart,
      color: 'blue' as TemplateColor,
      config: {
        dimensions: [{ id: 'vintage', name: 'Vintage Year', type: 'dimension' as const }],
        metrics: [
          { id: 'commitment', name: 'Commitment', type: 'metric' as const },
          { id: 'nav', name: 'NAV', type: 'metric' as const },
        ],
        chartType: 'bar' as const,
      },
    },
    {
      id: 'fund_performance',
      name: 'Fund Performance',
      description: 'Detailed performance analysis by fund',
      icon: TrendingUp,
      color: 'green' as TemplateColor,
      config: {
        dimensions: [{ id: 'name', name: 'Fund Name', type: 'dimension' as const }],
        metrics: [
          { id: 'tvpi', name: 'TVPI', type: 'metric' as const },
          { id: 'dpi', name: 'DPI', type: 'metric' as const },
        ],
        chartType: 'bar' as const,
      },
    },
    {
      id: 'geography_analysis',
      name: 'Geography Analysis',
      description: 'Portfolio breakdown by geography',
      icon: DollarSign,
      color: 'purple' as TemplateColor,
      config: {
        dimensions: [{ id: 'domicile', name: 'Geography', type: 'dimension' as const }],
        metrics: [
          { id: 'commitment', name: 'Commitment', type: 'metric' as const },
          { id: 'paidIn', name: 'Paid-In Capital', type: 'metric' as const },
          { id: 'nav', name: 'NAV', type: 'metric' as const },
        ],
        chartType: 'pie' as const,
      },
    },
  ]

  const handleFundSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value)
    setSelectedFundIds(values)
  }

  const handleInvestmentSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value)
    setSelectedInvestmentIds(values)
  }

  const handleRunReport = async () => {
    setRunError(null)
    setIsRunning(true)
    try {
      const response = await fetch('/api/reports/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builderConfig,
          baseCurrency,
          filters: {
            fundIds: selectedFundIds.length ? selectedFundIds : allFundIds,
            investmentIds: selectedInvestmentIds,
            strategy: selectedStrategies,
            sector: selectedSectors,
            manager: selectedManagers,
            vintageRange: {
              start: vintageRange.start,
              end: vintageRange.end,
            },
          },
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        setRunError(errorBody?.error || 'Unable to run report with the current configuration.')
        setReportResult(null)
        return
      }

      const data = await response.json()
      setReportResult(data.result)
    } catch (error) {
      console.error('Failed to run report:', error)
      setRunError('Unexpected error while running the report. Please try again.')
      setReportResult(null)
    } finally {
      setIsRunning(false)
    }
  }

  const handleExportReport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!reportResult) return
    setExportingFormat(format)

    if (format === 'pdf') {
      try {
        const doc = new jsPDF()
        const currency = reportResult.metadata?.reportingCurrency || baseCurrency || 'USD'
        
        // Title
        doc.setFontSize(20)
        doc.text(reportName || 'Report', 14, 22)
        
        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)
        
        // Summary Section
        if (reportResult.summary) {
          doc.setFontSize(14)
          doc.setTextColor(0)
          doc.text('Portfolio Summary', 14, 45)
          
          const summaryData = [
            ['Total Commitment', formatCurrency(reportResult.summary.totalCommitment, currency)],
            ['Paid-In Capital', formatCurrency(reportResult.summary.totalPaidIn, currency)],
            ['Total NAV', formatCurrency(reportResult.summary.totalNav, currency)],
            ['Portfolio TVPI', formatMultiple(reportResult.summary.avgTvpi)],
            ['Portfolio DPI', formatMultiple(reportResult.summary.avgDpi)],
            ['Funds', reportResult.summary.fundCount.toString()],
            ['Direct Investments', reportResult.summary.directInvestmentCount.toString()],
          ]
          
          autoTable(doc, {
            startY: 50,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            headStyles: { fontStyle: 'bold' },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
          })
        }
        
        // Detailed Data Table
        if (reportResult.data && reportResult.data.length > 0) {
          const startY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 60
          
          doc.setFontSize(14)
          doc.text('Detailed Data', 14, startY)
          
          const firstRow = reportResult.data[0]
          const columns = Object.keys(firstRow).map(key => ({
            header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
            dataKey: key
          }))
          
          const rows = reportResult.data.map(row => {
            const newRow: any = { ...row }
            Object.keys(newRow).forEach(key => {
              const lowerKey = key.toLowerCase()
              const value = newRow[key]
              if (typeof value === 'number') {
                if (
                  lowerKey.includes('amount') ||
                  lowerKey.includes('commitment') ||
                  lowerKey.includes('nav') ||
                  lowerKey.includes('value')
                ) {
                  newRow[key] = formatCurrency(value, currency)
                } else if (lowerKey.includes('irr')) {
                  newRow[key] = formatPercent(value * 100, 1)
                } else if (lowerKey.includes('tvpi') || lowerKey.includes('dpi') || lowerKey.includes('rvpi')) {
                  newRow[key] = formatMultiple(value)
                }
              }
            })
            return newRow
          })

          autoTable(doc, {
            startY: startY + 5,
            columns: columns,
            body: rows,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
          })
        }

        doc.save(`${(reportName || 'report').replace(/[^a-z0-9-_]/gi, '_')}.pdf`)
      } catch (error) {
        console.error('Failed to generate PDF:', error)
        alert('Unable to generate PDF. Please try again.')
      } finally {
        setExportingFormat(null)
      }
      return
    }

    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          config: { name: reportName, baseCurrency },
          data: reportResult,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || 'Failed to export report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const baseName = (reportName || 'report').replace(/[^a-z0-9-_]/gi, '_') || 'report'
      const suffix = format === 'excel' ? '-excel' : '-csv'
      const link = document.createElement('a')
      link.href = url
      link.download = `${baseName}${suffix}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export report:', error)
      alert('Unable to export the report. Please try again.')
    } finally {
      setExportingFormat(null)
    }
  }

  const handleSaveReport = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          config: {
            builderConfig,
            baseCurrency,
            type: 'custom',
          },
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        if (response.status === 503) {
          alert(body?.error || 'Saved report migrations are pending. Please contact your administrator.')
          return
        }
        throw new Error(body?.error || 'Failed to save report')
      }

      // Refresh page to show new saved report
      window.location.reload()
    } catch (error) {
      console.error('Failed to save report:', error)
    } finally {
      setIsSaving(false)
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
    setReportName(report.name)
    setReportDescription(report.description || '')
    const incomingConfig = report.config.builderConfig || report.config
    setBuilderConfig(normalizeConfig(incomingConfig))
    if (report.config.baseCurrency) {
      setBaseCurrency(report.config.baseCurrency)
    } else {
      setBaseCurrency('USD')
    }
    setReportResult(null)
    setView('builder')
  }

  const handleLoadTemplate = (template: typeof reportTemplates[0]) => {
    setReportName(template.name)
    setReportDescription(template.description)
    setBuilderConfig(normalizeConfig(template.config))
    setBaseCurrency('USD')
    setReportResult(null)
    setView('builder')
  }

  return (
    <div className="min-h-screen glass-page">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-6 lg:p-8 space-y-8">
          {savedReportsError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Saved Reports temporarily unavailable</p>
                <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
                  The SavedReport table has not been migrated yet. Ask an administrator to run the latest database migrations to enable this feature.
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
            data-animate
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3" data-tilt>
                <div className="w-12 h-12 rounded-xl glass-panel border border-border/70 flex items-center justify-center shadow-lg shadow-accent/20">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Reports & Analytics</h1>
                  <p className="text-sm text-foreground/60 mt-0.5">
                    Build custom reports with drag-and-drop
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                    view === 'list'
                      ? 'bg-accent text-white shadow-md'
                      : 'glass-panel border border-border text-foreground hover:border-accent/50'
                  }`}
                >
                  <Folder className="w-4 h-4 inline mr-2" />
                  My Reports
                </button>
                <button
                  onClick={() => {
                    setView('builder')
                    setReportResult(null)
                    setBuilderConfig(normalizeConfig({ dimensions: [], metrics: [], chartType: 'bar' }))
                    setReportName('New Report')
                    setReportDescription('')
                    setBaseCurrency('USD')
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                    view === 'builder'
                      ? 'bg-accent text-white shadow-md'
                      : 'glass-panel border border-border text-foreground hover:border-accent/50'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  New Report
                </button>
              </div>
            </div>
          </motion.div>

          {view === 'list' && (
            <div className="space-y-6">
              {/* Report Templates */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-semibold text-foreground mb-4">Quick Start Templates</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportTemplates.map((template) => {
                    const Icon = template.icon
                    const colorClasses = templateColorClasses[template.color]
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleLoadTemplate(template)}
                        data-animate data-tilt
                        className="group glass-panel rounded-xl border border-border p-5 text-left hover:shadow-lg hover:border-accent/40 transition-all shadow-2xl shadow-black/10"
                      >
                        <div className="w-12 h-12 rounded-xl glass-panel border border-border/70 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Icon className={`w-6 h-6 ${colorClasses.text}`} />
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
              </motion.div>

              {/* Saved Reports */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-lg font-semibold text-foreground mb-4">Saved Reports</h2>
                {savedReports.length > 0 ? (
                  <div className="space-y-3">
                    {savedReports.map((report) => (
                      <div
                        key={report.id}
                        data-animate data-tilt
                        className="glass-panel rounded-xl border border-border p-5 hover:shadow-lg transition-all shadow-2xl shadow-black/10"
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
                              className="px-3 py-1.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors"
                            >
                              <Play className="w-4 h-4 inline mr-1" />
                              Run
                            </button>
                            <button
                              onClick={() => handleLoadReport(report)}
                              className="px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div data-animate data-tilt className="glass-panel rounded-xl border border-border p-12 text-center shadow-2xl shadow-black/10">
                    <div className="w-16 h-16 rounded-xl glass-panel border border-border/70 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-foreground/50" />
                    </div>
                    <p className="text-foreground font-medium mb-1">No Saved Reports</p>
                    <p className="text-foreground/60 text-sm mb-4">
                      Create your first custom report to get started
                    </p>
                    <button
                      onClick={() => setView('builder')}
                      className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
                    >
                      Create Report
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {view === 'builder' && (
            <div className="space-y-6">
              <div className="glass-panel border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xl shadow-black/10">
                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/60 mb-1">Reports Workspace</p>
                  <h2 className="text-2xl font-bold text-foreground">Enterprise Analytics Builder</h2>
                  <p className="text-sm text-foreground/60">
                    Configure filters, drag fields, and run governed reports with instant visuals.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-full glass-panel border border-border text-xs text-foreground/70">
                    Reporting Currency: {reportingCurrency}
                  </span>
                  <span className="px-3 py-1.5 rounded-full glass-panel border border-border text-xs text-foreground/70">
                    Role: {userRole}
                  </span>
                  {maskedMetrics.length > 0 && (
                    <span className="px-3 py-1.5 rounded-full glass-panel border border-amber-300/80 text-xs text-amber-900">
                      Masked metrics: {maskedMetrics.join(', ')}
                    </span>
                  )}
                </div>
              </div>

            <div className="grid xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1 space-y-6">
                <div className="glass-panel rounded-xl border border-border p-5 shadow-2xl shadow-black/10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Report Details</h3>
                      <span className="text-[11px] text-foreground/50">Required</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-foreground/60 mb-1.5 uppercase tracking-wide">
                          Report Name
                        </label>
                        <input
                          type="text"
                          value={reportName}
                          onChange={(e) => setReportName(e.target.value)}
                          className="w-full px-3 py-2 text-sm glass-panel border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                          placeholder="Portfolio Performance Q4"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground/60 mb-1.5 uppercase tracking-wide">
                          Description
                        </label>
                        <textarea
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          className="w-full px-3 py-2 text-sm glass-panel border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                          rows={3}
                          placeholder="Add context for collaborators and reviewers"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground/60 mb-1.5 uppercase tracking-wide">
                          Reporting Currency (FX placeholder)
                        </label>
                        <select
                          value={baseCurrency}
                          onChange={(e) => setBaseCurrency(e.target.value)}
                          className="w-full px-3 py-2 text-sm glass-panel border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                        <p className="text-[11px] text-foreground/50 mt-1">
                          Converts values into the selected base currency using placeholder rates.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Data Filters</h3>
                      <span className="text-[11px] text-foreground/50">Governed</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-medium text-foreground/60 mb-1.5 uppercase tracking-wide">
                            Funds
                          </label>
                          <span className="text-[11px] text-foreground/50">
                            {selectedFundIds.length === 0 ? 'All funds' : `${selectedFundIds.length} selected`}
                          </span>
                        </div>
                        <select
                          multiple
                          value={selectedFundIds}
                          onChange={handleFundSelectionChange}
                          className="w-full min-h-[96px] px-3 py-2 text-sm border border-border rounded-lg bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        >
                          {funds.map((fund) => (
                            <option key={fund.id} value={fund.id}>
                              {fund.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-foreground/50">
                          <span>Hold Cmd/Ctrl to multi-select</span>
                          <div className="space-x-2">
                            <button type="button" onClick={() => setSelectedFundIds(allFundIds)} className="underline-offset-2 hover:underline">
                              Select all
                            </button>
                            <button type="button" onClick={() => setSelectedFundIds([])} className="underline-offset-2 hover:underline">
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>

                      {directInvestments.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-medium text-foreground/60 mb-1.5 uppercase tracking-wide">
                              Direct Investments
                            </label>
                            <span className="text-[11px] text-foreground/50">
                              {selectedInvestmentIds.length === 0 ? 'None selected' : `${selectedInvestmentIds.length} selected`}
                            </span>
                          </div>
                          <select
                            multiple
                            value={selectedInvestmentIds}
                            onChange={handleInvestmentSelectionChange}
                            className="w-full min-h-[96px] px-3 py-2 text-sm border border-border rounded-lg bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                          >
                            {directInvestmentOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center justify-between mt-1 text-[11px] text-foreground/50">
                            <span>Select any direct investments to include</span>
                            <div className="space-x-2">
                              <button type="button" onClick={() => setSelectedInvestmentIds(directInvestmentOptions.map((di) => di.id))} className="underline-offset-2 hover:underline">
                                Select all
                              </button>
                              <button type="button" onClick={() => setSelectedInvestmentIds([])} className="underline-offset-2 hover:underline">
                                Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Strategy</label>
                          <select
                            multiple
                            value={selectedStrategies}
                            onChange={(e) => setSelectedStrategies(Array.from(e.target.selectedOptions).map((o) => o.value))}
                            className="w-full min-h-[96px] px-3 py-2 text-sm border border-border rounded-lg bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                          >
                            {strategyOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Sector</label>
                          <select
                            multiple
                            value={selectedSectors}
                            onChange={(e) => setSelectedSectors(Array.from(e.target.selectedOptions).map((o) => o.value))}
                            className="w-full min-h-[96px] px-3 py-2 text-sm border border-border rounded-lg bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                          >
                            {sectorOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Manager</label>
                        <select
                          multiple
                          value={selectedManagers}
                          onChange={(e) => setSelectedManagers(Array.from(e.target.selectedOptions).map((o) => o.value))}
                          className="w-full min-h-[96px] px-3 py-2 text-sm border border-border rounded-lg bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        >
                          {managerOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground/60 uppercase tracking-wide mb-1.5">
                          Vintage Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={vintageRange.start}
                            onChange={(e) => setVintageRange({ ...vintageRange, start: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                            placeholder="Start"
                          />
                          <input
                            type="number"
                            value={vintageRange.end}
                            onChange={(e) => setVintageRange({ ...vintageRange, end: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                            placeholder="End"
                          />
                        </div>
                        <div className="flex justify-end mt-1 text-[11px] text-foreground/50">
                          <button type="button" onClick={() => setVintageRange({ start: '', end: '' })} className="underline-offset-2 hover:underline">
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-surface rounded-xl border border-border p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                      Dimensions &amp; Metrics
                    </h3>
                    <p className="text-xs text-foreground/60 mb-4">
                      Drag to build multi-level pivots. First dimension becomes the top-level group.
                    </p>
                    <DragDropReportBuilder onConfigChange={setBuilderConfig} initialConfig={builderConfig} />
                  </div>

                  <div className="bg-white dark:bg-surface rounded-xl border border-border p-5 shadow-sm space-y-3">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Actions</h3>
                    <button
                      onClick={handleRunReport}
                      disabled={isRunning || builderConfig.metrics.length === 0}
                      className="w-full px-4 py-3 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Play className="w-4 h-4" />
                      {isRunning ? 'Running...' : 'Run Report'}
                    </button>
                    {runError && <p className="text-xs text-red-500 text-center">{runError}</p>}

                    <button
                      onClick={handleSaveReport}
                      disabled={isSaving || !reportName}
                      className="w-full px-4 py-3 bg-white dark:bg-surface text-foreground border border-border rounded-lg text-sm font-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save Report'}
                    </button>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleExportReport('csv')}
                        disabled={!reportResult || exportingFormat !== null}
                        className="px-3 py-3 bg-white dark:bg-surface text-foreground border border-border rounded-lg text-sm font-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {exportingFormat === 'csv' ? '...' : 'CSV'}
                      </button>
                      <button
                        onClick={() => handleExportReport('excel')}
                        disabled={!reportResult || exportingFormat !== null}
                        className="px-3 py-3 bg-white dark:bg-surface text-foreground border border-border rounded-lg text-sm font-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {exportingFormat === 'excel' ? '...' : 'Excel'}
                      </button>
                      <button
                        onClick={() => handleExportReport('pdf')}
                        disabled={!reportResult || exportingFormat !== null}
                        className="px-3 py-3 bg-white dark:bg-surface text-foreground border border-border rounded-lg text-sm font-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {exportingFormat === 'pdf' ? '...' : 'PDF'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-surface rounded-xl border border-border p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">{reportName}</h2>
                        {reportDescription && <p className="text-sm text-foreground/60">{reportDescription}</p>}
                        <p className="text-xs text-foreground/50 mt-1">
                          Generated {reportResult ? new Date(reportResult.generatedAt || new Date().toISOString()).toLocaleString() : 'Not yet run'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-lg bg-surface border border-border">Reporting Currency: {reportingCurrency}</span>
                        {reportResult?.metadata?.asOfDate && (
                          <span className="px-2 py-1 rounded-lg bg-surface border border-border">As of {formatDate(reportResult.metadata.asOfDate)}</span>
                        )}
                        {reportResult?.metadata?.dataSources?.length && (
                          <span className="px-2 py-1 rounded-lg bg-surface border border-border">
                            Sources: {reportResult.metadata.dataSources.join(', ')}
                          </span>
                        )}
                        {reportResult?.metadata?.fxRatesUsed?.length && (
                          <span className="px-2 py-1 rounded-lg bg-surface border border-border">
                            FX: {reportResult.metadata.fxRatesUsed.join(', ')}
                          </span>
                        )}
                        {benchmarkInfo && (
                          <span className="px-2 py-1 rounded-lg bg-surface border border-border">
                            Benchmark: {benchmarkInfo.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-surface rounded-xl border border-border p-5 shadow-sm">
                    {reportResult?.summary ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        <SummaryStat label="Funds" value={reportResult.summary.fundCount.toString()} />
                        <SummaryStat label="Direct Investments" value={reportResult.summary.directInvestmentCount.toString()} />
                        <SummaryStat label="Total Commitment" value={formatCurrency(reportResult.summary.totalCommitment, reportingCurrency)} />
                        <SummaryStat label="Paid-In Capital" value={formatCurrency(reportResult.summary.totalPaidIn, reportingCurrency)} />
                        <SummaryStat label="Total NAV" value={formatCurrency(reportResult.summary.totalNav, reportingCurrency)} />
                        <SummaryStat label="Portfolio TVPI" value={formatMultiple(reportResult.summary.avgTvpi)} />
                        <SummaryStat label="Portfolio DPI" value={formatMultiple(reportResult.summary.avgDpi)} />
                        <SummaryStat label="Direct Investment Value" value={formatCurrency(reportResult.summary.directInvestmentValue, reportingCurrency)} />
                        
                      </div>
                    ) : (
                      <p className="text-sm text-foreground/60">Run the report to see portfolio summary.</p>
                    )}
                  </div>

                  <div className="bg-white dark:bg-surface rounded-xl border border-border p-5 shadow-sm">
                    {((reportResult?.chartConfig?.groupDimensions && reportResult.chartConfig.groupDimensions.length > 0) ||
                      builderConfig.dimensions.length > 0) && (
                      <div className="flex items-center gap-2 mb-3 text-xs text-foreground/60">
                        <span className="font-semibold text-foreground/70">Grouped by:</span>
                        <span>
                          {(reportResult?.chartConfig?.groupDimensions?.length
                            ? reportResult.chartConfig.groupDimensions
                            : builderConfig.dimensions.map((d) => d.id)
                          ).join(' / ')}
                        </span>
                      </div>
                    )}
                    <ChartPreview
                      chartType={reportResult?.chartConfig?.chartType || builderConfig.chartType}
                      data={reportResult?.data || []}
                      xAxisField={reportResult?.chartConfig?.xAxisField || 'name'}
                      yAxisFields={reportResult?.chartConfig?.yAxisFields || []}
                      currencyCode={reportingCurrency}
                      maskedMetrics={maskedMetrics}
                    />
                  </div>

                  <div className="bg-white dark:bg-surface rounded-xl border border-border p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Tabular View</h3>
                      <span className="text-[11px] text-foreground/50">
                        {reportResult?.data?.length ? `${reportResult.data.length} rows` : 'No rows'}
                      </span>
                    </div>
                    <DataGridPreview data={reportResult?.data || []} currencyCode={reportingCurrency} maskedMetrics={maskedMetrics} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white/80 dark:bg-surface/60 p-4 shadow-sm">
      <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold text-foreground mt-1">{value}</p>
    </div>
  )
}

function DataGridPreview({ data, currencyCode, maskedMetrics }: { data: any[]; currencyCode: string; maskedMetrics: string[] }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-foreground/60">No data returned yet.</div>
  }

  if (maskedMetrics.length > 0 && Object.keys(data[0] || {}).length === 1) {
    return (
      <div className="text-sm text-foreground/60">
        All selected metrics are masked for your role. Hidden: {maskedMetrics.join(', ')}
      </div>
    )
  }

  const headers = Object.keys(data[0] || {})

  const formatCell = (key: string, value: any) => {
    if (typeof value !== 'number') return value
    const lowerKey = key.toLowerCase()
    if (
      lowerKey.includes('amount') ||
      lowerKey.includes('commitment') ||
      lowerKey.includes('nav') ||
      lowerKey.includes('paid') ||
      lowerKey.includes('value') ||
      lowerKey.includes('distribution') ||
      lowerKey.includes('unfunded')
    ) {
      return formatCurrency(value, currencyCode)
    }
    if (lowerKey.includes('tvpi') || lowerKey.includes('dpi') || lowerKey.includes('rvpi') || lowerKey.includes('pic')) {
      return formatMultiple(value)
    }
    if (lowerKey.includes('irr')) {
      return formatPercent(value * 100, 1)
    }
    return value.toLocaleString()
  }

  return (
    <div className="overflow-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-surface">
          <tr>
            {headers.map((header) => (
              <th key={header} className="text-left px-3 py-2 text-xs font-semibold text-foreground/70 border-b border-border">
                {header.replace(/([A-Z])/g, ' $1').trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 50).map((row, idx) => (
            <tr key={idx} className="odd:bg-surface/60 even:bg-white dark:odd:bg-surface dark:even:bg-surface/70 border-b border-border/60">
              {headers.map((header) => (
                <td key={header} className="px-3 py-2 text-foreground/80">
                  {formatCell(header, row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 50 && (
        <div className="px-3 py-2 text-[11px] text-foreground/60 border-t border-border">
          Showing first 50 rows of {data.length}
        </div>
      )}
    </div>
  )
}
