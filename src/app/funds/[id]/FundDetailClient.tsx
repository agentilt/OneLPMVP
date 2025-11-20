'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { PDFViewer } from '@/components/PDFViewer'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Bar } from 'recharts'
import { formatCurrency, formatPercent, formatMultiple, formatDate } from '@/lib/utils'
import { FileText, Calendar, DollarSign, TrendingUp, Briefcase, MapPin, Download, ExternalLink, Eye, Mail, Phone, Globe, Zap, LineChart as LineChartIcon, Activity } from 'lucide-react'
import { useActivityTracker } from '@/hooks/useActivityTracker'

interface NavHistory {
  id: string
  date: Date
  nav: number
}

interface Distribution {
  id: string
  distributionDate: Date
  amount: number
  distributionType: string
  description?: string | null
}

interface Document {
  id: string
  type: string
  title: string
  uploadDate: Date
  dueDate: Date | null
  callAmount: number | null
  paymentStatus: string | null
  url: string | null
  parsedData: any
}

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
  period?: string | null
  periodDate?: Date | null
  highlights?: string | null
  lowlights?: string | null
  milestones?: string | null
  recentRounds?: string | null
  capTableChanges?: string | null
  navHistory: NavHistory[]
  distributions: Distribution[]
  documents: Document[]
}

interface FundDetailClientProps {
  fund: Fund
}

export function FundDetailClient({ fund }: FundDetailClientProps) {
  const { trackFundView, trackDocumentView, trackDownload, trackClick } = useActivityTracker()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(
    fund.documents.length > 0 ? fund.documents[0] : null
  )
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<'nav' | 'tvpi' | 'dpi' | 'paidIn' | 'distributions'>('nav')
  const hasSelectedDocLink = Boolean(selectedDoc?.url)

  // Track fund view on mount
  useEffect(() => {
    trackFundView(fund.id, {
      name: fund.name,
      domicile: fund.domicile,
      vintage: fund.vintage,
      manager: fund.manager
    })
  }, [fund.id, fund.name, fund.domicile, fund.vintage, fund.manager, trackFundView])

  // Track document selection
  useEffect(() => {
    if (selectedDoc) {
      trackDocumentView(selectedDoc.id, selectedDoc.type, {
        title: selectedDoc.title,
        fundId: fund.id,
        fundName: fund.name
      })
    }
  }, [selectedDoc, fund.id, fund.name, trackDocumentView])

  const handleViewPDF = () => {
    if (!selectedDoc?.url) return

      trackClick('view-pdf-button', { documentId: selectedDoc.id, documentTitle: selectedDoc.title })
      trackDocumentView(selectedDoc.id, selectedDoc.type, {
        title: selectedDoc.title,
        fundId: fund.id,
        action: 'view_pdf'
      })
    setShowPDFViewer(true)
  }

  const handleDownloadDocument = (doc: Document) => {
    if (!doc.url) return

    trackDownload(doc.id, 'DOCUMENT', {
      title: doc.title,
      type: doc.type,
      fundId: fund.id,
      fundName: fund.name
    })
  }

  // Get capital calls
  const capitalCalls = fund.documents.filter(
    (doc) => doc.type === 'CAPITAL_CALL'
  )

  // Calculate historical metrics over time
  // Combine all events (NAV updates, distributions, capital calls) and calculate metrics at each point
  interface HistoricalPoint {
    date: Date
    nav: number
    cumulativePaidIn: number
    cumulativeDistributions: number
    tvpi: number
    dpi: number
    distributions: number
  }

  const historicalPoints: HistoricalPoint[] = []
  
  // Start with fund vintage date
  const startDate = new Date(fund.vintage, 0, 1)
  let cumulativePaidIn = 0
  let cumulativeDistributions = 0

  // Process capital calls chronologically to build paid-in timeline
  const sortedCapitalCalls = [...capitalCalls].sort((a, b) => {
    const dateA = a.dueDate || a.uploadDate
    const dateB = b.dueDate || b.uploadDate
    return new Date(dateA).getTime() - new Date(dateB).getTime()
  })

  // Process distributions chronologically
  const sortedDistributions = [...fund.distributions].sort((a, b) => 
    new Date(a.distributionDate).getTime() - new Date(b.distributionDate).getTime()
  )

  // Create a map of dates to events
  const dateMap = new Map<string, { nav?: number; paidIn?: number; distribution?: number }>()

  // Add NAV history points
  fund.navHistory.forEach((nav) => {
    const dateKey = new Date(nav.date).toISOString().split('T')[0]
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {})
    }
    dateMap.get(dateKey)!.nav = nav.nav
  })

  // Add capital call points (accumulate paid-in)
  sortedCapitalCalls.forEach((call) => {
    const dateKey = new Date(call.dueDate || call.uploadDate).toISOString().split('T')[0]
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {})
    }
    const existing = dateMap.get(dateKey)!
    existing.paidIn = (existing.paidIn || 0) + (call.callAmount || 0)
  })

  // Add distribution points
  sortedDistributions.forEach((dist) => {
    const dateKey = new Date(dist.distributionDate).toISOString().split('T')[0]
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {})
    }
    const existing = dateMap.get(dateKey)!
    existing.distribution = (existing.distribution || 0) + dist.amount
  })

  // Build historical points chronologically
  const sortedDates = Array.from(dateMap.keys()).sort()
  let lastNav = 0
  let lastPaidIn = 0

  sortedDates.forEach((dateKey) => {
    const events = dateMap.get(dateKey)!
    const date = new Date(dateKey)

    // Update cumulative values
    if (events.paidIn) {
      cumulativePaidIn += events.paidIn
      lastPaidIn = cumulativePaidIn
    }
    if (events.distribution) {
      cumulativeDistributions += events.distribution
    }
    if (events.nav !== undefined) {
      lastNav = events.nav
    }

    // Calculate metrics at this point
    const tvpi = lastPaidIn > 0 ? (lastNav + cumulativeDistributions) / lastPaidIn : 0
    const dpi = lastPaidIn > 0 ? cumulativeDistributions / lastPaidIn : 0

    historicalPoints.push({
      date,
      nav: lastNav,
      cumulativePaidIn: lastPaidIn || fund.paidIn, // Fallback to current paid-in if no history
      cumulativeDistributions,
      tvpi,
      dpi,
      distributions: events.distribution || 0,
    })
  })

  // If no historical data, use current values
  if (historicalPoints.length === 0) {
    historicalPoints.push({
      date: new Date(),
      nav: fund.nav,
      cumulativePaidIn: fund.paidIn,
      cumulativeDistributions: fund.dpi * fund.paidIn,
      tvpi: fund.tvpi,
      dpi: fund.dpi,
      distributions: 0,
    })
  }

  // Prepare chart data based on selected metric
  const chartData = historicalPoints.map((point) => ({
    date: formatDate(point.date),
    fullDate: point.date.getTime(),
    nav: point.nav,
    tvpi: point.tvpi,
    dpi: point.dpi,
    paidIn: point.cumulativePaidIn,
    distributions: point.distributions,
    cumulativeDistributions: point.cumulativeDistributions,
  })).sort((a, b) => a.fullDate - b.fullDate)

  // Calculate TVPI correctly: (NAV + Distributions) / Paid-in
  const calculatedTvpi = fund.paidIn > 0 ? (fund.nav / fund.paidIn) + fund.dpi : 0

  // Available metrics for selection
  const availableMetrics = [
    { key: 'nav', label: 'NAV', color: '#3b82f6' },
    { key: 'tvpi', label: 'TVPI', color: '#10b981' },
    { key: 'dpi', label: 'DPI', color: '#8b5cf6' },
    { key: 'paidIn', label: 'Paid-in Capital', color: '#f59e0b' },
    { key: 'distributions', label: 'Distributions', color: '#ec4899' },
  ]

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Fund Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {fund.name}
                </h1>
                <div className="flex items-center gap-3 text-sm text-foreground/60 mt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{fund.domicile}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Vintage {fund.vintage}</span>
                  </div>
                  <span>•</span>
                  <span>{fund.manager}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Document Viewer (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Historical Metrics Charts */}
              {historicalPoints.length > 0 && (
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 overflow-hidden">
                  <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="w-5 h-5 text-accent" />
                      <h2 className="font-bold text-lg">Historical Metrics</h2>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Metric Selector */}
                    <div className="flex flex-wrap gap-2">
                      {availableMetrics.map((metric) => (
                        <button
                          key={metric.key}
                          onClick={() => setSelectedMetric(metric.key as any)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            selectedMetric === metric.key
                              ? 'bg-accent text-white shadow-lg'
                              : 'bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {metric.label}
                        </button>
                      ))}
                    </div>

                    {/* Chart */}
                    {chartData.length > 0 && (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            stroke="currentColor"
                            opacity={0.5}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            stroke="currentColor"
                            opacity={0.5}
                            tickFormatter={(value) => {
                              if (selectedMetric === 'tvpi' || selectedMetric === 'dpi') {
                                return value.toFixed(2)
                              }
                              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
                              if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
                              return `$${value.toFixed(0)}`
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--background)',
                              border: '1px solid rgba(0,0,0,0.1)',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => {
                              if (selectedMetric === 'tvpi' || selectedMetric === 'dpi') {
                                return value.toFixed(3)
                              }
                              return formatCurrency(value)
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey={selectedMetric}
                            stroke={availableMetrics.find(m => m.key === selectedMetric)?.color || '#3b82f6'}
                            strokeWidth={2}
                            dot={{ fill: availableMetrics.find(m => m.key === selectedMetric)?.color || '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}

              {/* Documents List */}
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 overflow-hidden">
                <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <h2 className="font-bold text-lg">Fund Documents</h2>
                  </div>
                </div>
                <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60 max-h-96 overflow-y-auto">
                  {fund.documents.length > 0 ? (
                    fund.documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className={`w-full px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all ${
                          selectedDoc?.id === doc.id ? 'bg-accent/5 border-l-4 border-l-accent' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 mt-0.5 text-foreground/60" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium mb-1">{doc.title}</div>
                            <div className="text-xs text-foreground/60 flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 bg-foreground/10 rounded">
                                {doc.type.replace('_', ' ')}
                              </span>
                              <span>Uploaded: {formatDate(doc.uploadDate)}</span>
                              {doc.dueDate && (
                                <span>Due: {formatDate(doc.dueDate)}</span>
                              )}
                              {doc.paymentStatus && (
                                <span
                                  className={`px-2 py-0.5 rounded ${
                                    doc.paymentStatus === 'PAID'
                                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                      : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                  }`}
                                >
                                  {doc.paymentStatus}
                                </span>
                              )}
                            </div>
                          </div>
                          {doc.callAmount && (
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {formatCurrency(doc.callAmount)}
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-foreground/60">
                      No documents available
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics Timeline */}
              {historicalPoints.length > 0 && (
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 overflow-hidden">
                  <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-accent" />
                      <h2 className="font-bold text-lg">Metrics Timeline</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {historicalPoints
                        .sort((a, b) => b.date.getTime() - a.date.getTime())
                        .map((point, index) => {
                          // Find related events for this date
                          const dateKey = point.date.toISOString().split('T')[0]
                          const navUpdate = fund.navHistory.find(nav => 
                            new Date(nav.date).toISOString().split('T')[0] === dateKey
                          )
                          const capitalCall = capitalCalls.find(call => {
                            const callDate = call.dueDate || call.uploadDate
                            return callDate && new Date(callDate).toISOString().split('T')[0] === dateKey
                          })
                          const distribution = fund.distributions.find(dist => 
                            new Date(dist.distributionDate).toISOString().split('T')[0] === dateKey
                          )

                          // Determine event type and title
                          let eventTitle = 'NAV Update'
                          let eventIcon = <TrendingUp className="w-4 h-4 text-white" />
                          if (capitalCall) {
                            eventTitle = capitalCall.title
                            eventIcon = <DollarSign className="w-4 h-4 text-white" />
                          } else if (distribution) {
                            eventTitle = `Distribution - ${distribution.distributionType || 'CASH'}`
                            eventIcon = <TrendingUp className="w-4 h-4 text-white" />
                          } else if (navUpdate) {
                            eventTitle = 'NAV Update'
                            eventIcon = <LineChartIcon className="w-4 h-4 text-white" />
                          }

                          return (
                            <div key={`${dateKey}-${index}`} className="relative">
                              {index !== historicalPoints.length - 1 && (
                                <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                              )}
                              <div className="relative flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20 z-10">
                                  {eventIcon}
                                </div>
                                <div className="flex-1 pb-6">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className="font-semibold text-foreground">{eventTitle}</h4>
                                      <p className="text-sm text-foreground/60">
                                        {formatDate(point.date)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">NAV</div>
                                      <div className="text-sm font-bold">{formatCurrency(point.nav)}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">TVPI</div>
                                      <div className="text-sm font-bold">{formatMultiple(point.tvpi)}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">DPI</div>
                                      <div className="text-sm font-bold">{formatMultiple(point.dpi)}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Paid-in</div>
                                      <div className="text-sm font-bold">{formatCurrency(point.cumulativePaidIn)}</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Distributions</div>
                                      <div className="text-sm font-bold">{formatCurrency(point.cumulativeDistributions)}</div>
                                    </div>
                                  </div>
                                  {/* Show event-specific details */}
                                  {(capitalCall || distribution) && (
                                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                                      {capitalCall && capitalCall.callAmount && (
                                        <div className="text-xs text-foreground/60">
                                          <span className="font-medium">Capital Call:</span> {formatCurrency(capitalCall.callAmount)}
                                          {capitalCall.paymentStatus && (
                                            <span className={`ml-2 px-2 py-0.5 rounded ${
                                              capitalCall.paymentStatus === 'PAID'
                                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                            }`}>
                                              {capitalCall.paymentStatus}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {distribution && (
                                        <div className="text-xs text-foreground/60">
                                          <span className="font-medium">Distribution:</span> {formatCurrency(distribution.amount)}
                                          {distribution.distributionType && (
                                            <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                                              {distribution.distributionType}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              {(fund.highlights || fund.lowlights || fund.milestones || fund.recentRounds || fund.capTableChanges) && (
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 overflow-hidden">
                  <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-accent" />
                      <h2 className="font-bold text-lg">Executive Summary</h2>
                      {fund.period && fund.periodDate && (
                        <span className="ml-auto text-sm text-foreground/60">
                          {fund.period} - {formatDate(fund.periodDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    {fund.highlights && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          Highlights
                        </h3>
                        <p className="text-foreground/70 whitespace-pre-wrap">{fund.highlights}</p>
                      </div>
                    )}
                    {fund.lowlights && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-amber-500 rotate-180" />
                          Lowlights
                        </h3>
                        <p className="text-foreground/70 whitespace-pre-wrap">{fund.lowlights}</p>
                      </div>
                    )}
                    {fund.milestones && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-500" />
                          Major Milestones
                        </h3>
                        <p className="text-foreground/70 whitespace-pre-wrap">{fund.milestones}</p>
                      </div>
                    )}
                    {fund.recentRounds && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Portfolio Updates</h3>
                        <p className="text-foreground/70 whitespace-pre-wrap">{fund.recentRounds}</p>
                      </div>
                    )}
                    {fund.capTableChanges && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Fund Structure Changes</h3>
                        <p className="text-foreground/70 whitespace-pre-wrap">{fund.capTableChanges}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Document Viewer */}
              {selectedDoc && (
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">{selectedDoc.title}</h3>
                    {hasSelectedDocLink && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleViewPDF}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                        >
                          <Eye className="w-4 h-4" />
                          View PDF
                        </button>
                        <a
                          href={`/api/documents/${selectedDoc.id}/proxy`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleDownloadDocument(selectedDoc)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-lg font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open
                        </a>
                      </div>
                    )}
                    </div>
                  </div>
                  <div className="p-6">
                    {selectedDoc.parsedData ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(selectedDoc.parsedData).map(([key, value]) => (
                            <div key={key}>
                              <div className="text-xs text-foreground/60 mb-1 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                              <div className="font-medium">{String(value)}</div>
                            </div>
                          ))}
                        </div>
                        {hasSelectedDocLink && (
                        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleViewPDF}
                              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                            >
                              <Eye className="w-4 h-4" />
                              View PDF Document
                            </button>
                            <a
                              href={`/api/documents/${selectedDoc.id}/proxy`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleDownloadDocument(selectedDoc)}
                              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200"
                            >
                              <Download className="w-4 h-4" />
                              Download Document
                            </a>
                          </div>
                        </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-foreground/40" />
                        <p className="text-foreground/60 mb-4">
                          {hasSelectedDocLink
                            ? 'Document preview not available'
                            : 'Document file is not available yet.'}
                        </p>
                        {hasSelectedDocLink && (
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={handleViewPDF}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                          >
                            <Eye className="w-4 h-4" />
                            View PDF
                          </button>
                          <a
                            href={`/api/documents/${selectedDoc.id}/proxy`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleDownloadDocument(selectedDoc)}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200"
                          >
                            <Download className="w-4 h-4" />
                            Download Document
                          </a>
                        </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Charts and Metrics (1/3) */}
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-lg">Key Metrics</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Commitment</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(fund.commitment)}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Paid-in Capital</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(fund.paidIn)}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">NAV</div>
                    <div className="text-xl font-bold text-accent">
                      {formatCurrency(fund.nav)}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">TVPI</div>
                    <div className="text-xl font-bold">
                      {formatMultiple(calculatedTvpi)}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">DPI</div>
                    <div className="text-xl font-bold">
                      {formatMultiple(fund.dpi)}
                    </div>
                  </div>
                </div>
              </div>


              {/* Recent Capital Calls */}
              {capitalCalls.length > 0 && (
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Calendar className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg">Recent Capital Calls</h3>
                  </div>
                  <div className="space-y-4">
                    {capitalCalls.slice(0, 3).map((call) => (
                      <div key={call.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="font-semibold text-base">{call.title}</div>
                          {call.callAmount && (
                            <div className="font-bold text-lg text-accent">
                              {formatCurrency(call.callAmount)}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-foreground/60 flex items-center gap-2 flex-wrap">
                          {call.dueDate && (
                            <>
                              <Calendar className="w-3 h-3" />
                              <span>Due: {formatDate(call.dueDate)}</span>
                            </>
                          )}
                          {call.paymentStatus && (
                            <span
                              className={`px-2 py-0.5 rounded ${
                                call.paymentStatus === 'PAID'
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                              }`}
                            >
                              {call.paymentStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manager Contact */}
              {(fund.managerEmail || fund.managerPhone || fund.managerWebsite) && (
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Briefcase className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg">Manager Contact</h3>
                  </div>
                  <div className="space-y-3">
                    {fund.managerEmail && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <Mail className="w-5 h-5 text-foreground/60 flex-shrink-0" />
                        <a 
                          href={`mailto:${fund.managerEmail}`}
                          className="text-accent hover:text-accent-hover transition-colors truncate text-sm font-medium"
                        >
                          {fund.managerEmail}
                        </a>
                      </div>
                    )}
                    {fund.managerPhone && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <Phone className="w-5 h-5 text-foreground/60 flex-shrink-0" />
                        <a 
                          href={`tel:${fund.managerPhone}`}
                          className="text-foreground hover:text-accent transition-colors text-sm font-medium"
                        >
                          {fund.managerPhone}
                        </a>
                      </div>
                    )}
                    {fund.managerWebsite && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <Globe className="w-5 h-5 text-foreground/60 flex-shrink-0" />
                        <a 
                          href={fund.managerWebsite.startsWith('http') ? fund.managerWebsite : `https://${fund.managerWebsite}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent-hover transition-colors truncate text-sm font-medium"
                        >
                          {fund.managerWebsite}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* PDF Viewer Modal */}
      {showPDFViewer && selectedDoc && selectedDoc.url && (
        <PDFViewer
          url={selectedDoc.url}
          title={selectedDoc.title}
          documentId={selectedDoc.id}
          documentType="fund"
          onClose={() => setShowPDFViewer(false)}
        />
      )}
    </div>
  )
}

