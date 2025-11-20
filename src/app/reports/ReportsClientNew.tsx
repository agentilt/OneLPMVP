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
  Trash2,
  Edit,
  Clock,
  Folder,
  TrendingUp,
  PieChart,
  DollarSign,
  Sparkles,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { DragDropReportBuilder, ReportBuilderConfig } from '@/components/ReportBuilder/DragDropReportBuilder'
import { ChartPreview } from '@/components/ReportBuilder/ChartPreview'
import { motion } from 'framer-motion'

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

export function ReportsClientNew({ savedReports, funds, directInvestments, userRole }: ReportsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<'list' | 'builder'>('list')
  const [reportName, setReportName] = useState('New Report')
  const [reportDescription, setReportDescription] = useState('')
  const [builderConfig, setBuilderConfig] = useState<ReportBuilderConfig>({
    dimensions: [],
    metrics: [],
    chartType: 'bar',
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
      color: 'green',
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
      color: 'purple',
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

  const handleRunReport = async () => {
    setIsRunning(true)
    try {
      const response = await fetch('/api/reports/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builderConfig,
          filters: {
            fundIds: funds.map(f => f.id), // Include all accessible funds
            investmentIds: [],
          },
        }),
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
          name: reportName,
          description: reportDescription,
          config: {
            builderConfig,
            type: 'custom',
          },
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
    if (report.config.builderConfig) {
      setBuilderConfig(report.config.builderConfig)
    }
    setView('builder')
  }

  const handleLoadTemplate = (template: typeof reportTemplates[0]) => {
    setReportName(template.name)
    setReportDescription(template.description)
    setBuilderConfig(template.config)
    setReportData(null)
    setView('builder')
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
                  <Sparkles className="w-6 h-6 text-white" />
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
                      : 'bg-white dark:bg-surface text-foreground border border-border hover:border-accent/50'
                  }`}
                >
                  <Folder className="w-4 h-4 inline mr-2" />
                  My Reports
                </button>
                <button
                  onClick={() => {
                    setView('builder')
                    setReportData(null)
                    setBuilderConfig({ dimensions: [], metrics: [], chartType: 'bar' })
                    setReportName('New Report')
                    setReportDescription('')
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                    view === 'builder'
                      ? 'bg-accent text-white shadow-md'
                      : 'bg-white dark:bg-surface text-foreground border border-border hover:border-accent/50'
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
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleLoadTemplate(template)}
                        className="group bg-white dark:bg-surface rounded-xl border border-border p-5 text-left hover:shadow-lg hover:border-accent/40 transition-all"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-${template.color}-500/10 dark:bg-${template.color}-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-6 h-6 text-${template.color}-600 dark:text-${template.color}-400`} />
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
                        className="bg-white dark:bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-all"
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
                  <div className="bg-white dark:bg-surface rounded-xl border border-border p-12 text-center">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
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
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Report Configuration (Left) */}
              <div className="lg:col-span-1 space-y-6">
                {/* Basic Info */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-surface rounded-xl border border-border p-5"
                >
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
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        placeholder="My Portfolio Report"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground/60 mb-1.5 uppercase tracking-wide">
                        Description
                      </label>
                      <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        rows={3}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Drag-Drop Builder */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <DragDropReportBuilder
                    onConfigChange={setBuilderConfig}
                    initialConfig={builderConfig}
                  />
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  <button
                    onClick={handleRunReport}
                    disabled={isRunning || builderConfig.metrics.length === 0}
                    className="w-full px-4 py-3 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Play className="w-4 h-4" />
                    {isRunning ? 'Running...' : 'Run Report'}
                  </button>

                  <button
                    onClick={handleSaveReport}
                    disabled={isSaving || !reportName}
                    className="w-full px-4 py-3 bg-white dark:bg-surface text-foreground border border-border rounded-lg text-sm font-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Report'}
                  </button>

                  {reportData && (
                    <button
                      onClick={() => {
                        /* Export functionality */
                      }}
                      className="w-full px-4 py-3 bg-white dark:bg-surface text-foreground border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  )}
                </motion.div>
              </div>

              {/* Report Preview (Right) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2"
              >
                <div className="bg-white dark:bg-surface rounded-xl border border-border p-6 min-h-[700px]">
                  {reportData ? (
                    <div>
                      <div className="mb-6 pb-6 border-b border-border">
                        <h2 className="text-2xl font-bold text-foreground mb-1">{reportName}</h2>
                        {reportDescription && (
                          <p className="text-sm text-foreground/60">{reportDescription}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-foreground/50">
                          <span>Generated {new Date().toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Chart Visualization */}
                      <div>
                        <ChartPreview
                          chartType={builderConfig.chartType}
                          data={reportData.data || []}
                          xAxisField={reportData.chartConfig?.xAxisField || 'name'}
                          yAxisFields={reportData.chartConfig?.yAxisFields || []}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center max-w-md">
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="w-10 h-10 text-accent" />
                        </div>
                        <p className="text-lg font-semibold text-foreground mb-2">Ready to Build</p>
                        <p className="text-sm text-foreground/60 mb-6">
                          Drag dimensions and metrics from the left panel to build your report, then click "Run Report" to visualize your data.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg text-sm text-accent">
                          <Sparkles className="w-4 h-4" />
                          <span>Drag and drop to get started</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

