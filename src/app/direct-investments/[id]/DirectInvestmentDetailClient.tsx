'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { PDFViewer } from '@/components/PDFViewer'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import { FileText, Calendar, DollarSign, Building2, TrendingUp, Download, ExternalLink, Eye, BarChart3, Users, Zap, LineChart as LineChartIcon, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useActivityTracker } from '@/hooks/useActivityTracker'

interface DirectInvestmentDocument {
  id: string
  type: string
  title: string
  uploadDate: Date
  dueDate: Date | null
  url: string | null
  parsedData: any
}

interface DirectInvestment {
  id: string
  name: string
  investmentType: string
  industry: string | null
  stage: string | null
  investmentDate: Date | null
  investmentAmount: number | null
  
  // Private Debt/Credit fields
  principalAmount: number | null
  interestRate: number | null
  couponRate: number | null
  maturityDate: Date | null
  creditRating: string | null
  defaultStatus: string | null
  currentValue: number | null
  yield: number | null
  
  // Public Equity fields
  tickerSymbol: string | null
  shares: number | null
  purchasePrice: number | null
  currentPrice: number | null
  dividends: number | null
  marketValue: number | null
  
  // Real Estate fields
  propertyType: string | null
  propertyAddress: string | null
  squareFootage: number | null
  purchaseDate: Date | null
  purchaseValue: number | null
  currentAppraisal: number | null
  rentalIncome: number | null
  occupancyRate: number | null
  propertyTax: number | null
  maintenanceCost: number | null
  netOperatingIncome: number | null
  
  // Real Assets fields
  assetType: string | null
  assetDescription: string | null
  assetLocation: string | null
  acquisitionDate: Date | null
  acquisitionValue: number | null
  assetCurrentValue: number | null
  assetIncome: number | null
  holdingCost: number | null
  
  // Cash fields
  accountType: string | null
  accountName: string | null
  cashInterestRate: number | null
  balance: number | null
  currency: string | null
  cashMaturityDate: Date | null
  
  // Executive Summary
  period: string | null
  periodDate: Date | null
  highlights: string | null
  lowlights: string | null
  milestones: string | null
  recentRounds: string | null
  capTableChanges: string | null
  
  // Private Equity metrics
  revenue: number | null
  arr: number | null
  mrr: number | null
  grossMargin: number | null
  runRate: number | null
  burn: number | null
  runway: number | null
  headcount: number | null
  cac: number | null
  ltv: number | null
  nrr: number | null
  cashBalance: number | null
  
  lastReportDate: Date | null
  documents: DirectInvestmentDocument[]
}

interface DirectInvestmentDetailClientProps {
  directInvestment: DirectInvestment
}

interface HistoricalMetric {
  date: Date
  periodDate: Date | null
  period: string | null
  documentTitle: string
  documentId: string
  metrics: {
    revenue: number | null
    arr: number | null
    mrr: number | null
    grossMargin: number | null
    runRate: number | null
    burn: number | null
    runway: number | null
    headcount: number | null
    cac: number | null
    ltv: number | null
    nrr: number | null
    cashBalance: number | null
  }
}

export function DirectInvestmentDetailClient({ directInvestment }: DirectInvestmentDetailClientProps) {
  const { trackDirectInvestmentView, trackDocumentView, trackDownload, trackClick } = useActivityTracker()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<DirectInvestmentDocument | null>(
    directInvestment.documents.length > 0 ? directInvestment.documents[0] : null
  )
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [historicalMetrics, setHistoricalMetrics] = useState<HistoricalMetric[]>([])
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue')
  const hasSelectedDocLink = Boolean(selectedDoc?.url)

  // Track direct investment view on mount
  useEffect(() => {
    trackDirectInvestmentView(directInvestment.id, {
      name: directInvestment.name,
      industry: directInvestment.industry,
      stage: directInvestment.stage
    })
  }, [directInvestment.id, directInvestment.name, directInvestment.industry, directInvestment.stage, trackDirectInvestmentView])

  // Track document selection
  useEffect(() => {
    if (selectedDoc) {
      trackDocumentView(selectedDoc.id, selectedDoc.type, {
        title: selectedDoc.title,
        investmentId: directInvestment.id,
        investmentName: directInvestment.name
      })
    }
  }, [selectedDoc, directInvestment.id, directInvestment.name, trackDocumentView])

  const handleViewPDF = () => {
    if (!selectedDoc?.url) return

      trackClick('view-pdf-button', { documentId: selectedDoc.id, documentTitle: selectedDoc.title })
      trackDocumentView(selectedDoc.id, selectedDoc.type, {
        title: selectedDoc.title,
        investmentId: directInvestment.id,
        action: 'view_pdf'
      })
    setShowPDFViewer(true)
  }

  const handleDownloadDocument = (doc: DirectInvestmentDocument) => {
    if (!doc.url) return

    trackDownload(doc.id, 'DIRECT_INVESTMENT_DOCUMENT', {
      title: doc.title,
      type: doc.type,
      investmentId: directInvestment.id,
      investmentName: directInvestment.name
    })
  }

  useEffect(() => {
    // Fetch historical metrics
    const fetchHistoricalMetrics = async () => {
      try {
        setLoadingMetrics(true)
        const response = await fetch(`/api/direct-investments/${directInvestment.id}/historical-metrics`)
        if (response.ok) {
          const data = await response.json()
          setHistoricalMetrics(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch historical metrics:', error)
      } finally {
        setLoadingMetrics(false)
      }
    }

    fetchHistoricalMetrics()
  }, [directInvestment.id])

  // Prepare chart data
  const chartData = historicalMetrics
    .filter((item) => item.metrics[selectedMetric as keyof typeof item.metrics] !== null)
    .map((item) => ({
      date: formatDate(item.date),
      fullDate: new Date(item.date).getTime(),
      value: item.metrics[selectedMetric as keyof typeof item.metrics] as number,
      period: item.period || 'N/A',
      documentTitle: item.documentTitle,
    }))
    .sort((a, b) => a.fullDate - b.fullDate)

  // Available metrics for selection
  const availableMetrics = [
    { key: 'revenue', label: 'Revenue', color: '#3b82f6' },
    { key: 'arr', label: 'ARR', color: '#10b981' },
    { key: 'mrr', label: 'MRR', color: '#8b5cf6' },
    { key: 'cashBalance', label: 'Cash Balance', color: '#f59e0b' },
    { key: 'headcount', label: 'Headcount', color: '#ec4899' },
    { key: 'burn', label: 'Burn', color: '#ef4444' },
    { key: 'runway', label: 'Runway (Months)', color: '#06b6d4' },
  ]

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Investment Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {directInvestment.name}
                </h1>
                <div className="flex items-center gap-3 text-sm text-foreground/60 mt-1">
                  {directInvestment.industry && (
                    <>
                      <span>{directInvestment.industry}</span>
                      <span>•</span>
                    </>
                  )}
                  {directInvestment.stage && (
                    <>
                      <span>{directInvestment.stage}</span>
                      {directInvestment.investmentDate && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(directInvestment.investmentDate)}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Executive Summary & Documents (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Historical Metrics Charts */}
              {historicalMetrics.length > 0 && (
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
                      {availableMetrics.map((metric) => {
                        const hasData = historicalMetrics.some(
                          (item) => item.metrics[metric.key as keyof typeof item.metrics] !== null
                        )
                        if (!hasData) return null
                        
                        return (
                          <button
                            key={metric.key}
                            onClick={() => setSelectedMetric(metric.key)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              selectedMetric === metric.key
                                ? 'bg-accent text-white shadow-lg'
                                : 'bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {metric.label}
                          </button>
                        )
                      })}
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
                              if (selectedMetric === 'headcount' || selectedMetric === 'runway') {
                                return value.toString()
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
                              if (selectedMetric === 'headcount') return value.toString()
                              if (selectedMetric === 'runway') return `${value.toFixed(1)} months`
                              return formatCurrency(value)
                            }}
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                return `${payload[0].payload.documentTitle} - ${label}`
                              }
                              return label
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
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

              {/* Metrics Timeline */}
              {historicalMetrics.length > 0 && (
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-500" />
                      <h2 className="font-bold text-lg">Metrics Timeline</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {historicalMetrics
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((item, index) => (
                          <div key={item.documentId} className="relative">
                            {index !== historicalMetrics.length - 1 && (
                              <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                            )}
                            <div className="relative flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg z-10">
                                <Calendar className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 pb-6">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-foreground">{item.documentTitle}</h4>
                                    <p className="text-sm text-foreground/60">
                                      {formatDate(item.date)}
                                      {item.period && item.periodDate && (
                                        <span> • {item.period} - {formatDate(item.periodDate)}</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
                                  {item.metrics.revenue !== null && (
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Revenue</div>
                                      <div className="text-sm font-bold">{formatCurrency(item.metrics.revenue)}</div>
                                    </div>
                                  )}
                                  {item.metrics.arr !== null && (
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">ARR</div>
                                      <div className="text-sm font-bold">{formatCurrency(item.metrics.arr)}</div>
                                    </div>
                                  )}
                                  {item.metrics.mrr !== null && (
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">MRR</div>
                                      <div className="text-sm font-bold">{formatCurrency(item.metrics.mrr)}</div>
                                    </div>
                                  )}
                                  {item.metrics.cashBalance !== null && (
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Cash Balance</div>
                                      <div className="text-sm font-bold">{formatCurrency(item.metrics.cashBalance)}</div>
                                    </div>
                                  )}
                                  {item.metrics.headcount !== null && (
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Headcount</div>
                                      <div className="text-sm font-bold">{item.metrics.headcount}</div>
                                    </div>
                                  )}
                                  {item.metrics.burn !== null && (
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Burn</div>
                                      <div className="text-sm font-bold">{formatCurrency(item.metrics.burn)}</div>
                                    </div>
                                  )}
                                  {item.metrics.runway !== null && (
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Runway</div>
                                      <div className="text-sm font-bold">{item.metrics.runway.toFixed(1)} mo</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 overflow-hidden">
                <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <h2 className="font-bold text-lg">Executive Summary</h2>
                    {directInvestment.period && directInvestment.periodDate && (
                      <span className="ml-auto text-sm text-foreground/60">
                        {directInvestment.period} - {formatDate(directInvestment.periodDate)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {directInvestment.highlights && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Highlights
                      </h3>
                      <p className="text-foreground/70 whitespace-pre-wrap">{directInvestment.highlights}</p>
                    </div>
                  )}
                  {directInvestment.lowlights && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-500 rotate-180" />
                        Lowlights
                      </h3>
                      <p className="text-foreground/70 whitespace-pre-wrap">{directInvestment.lowlights}</p>
                    </div>
                  )}
                  {directInvestment.milestones && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        Major Milestones
                      </h3>
                      <p className="text-foreground/70 whitespace-pre-wrap">{directInvestment.milestones}</p>
                    </div>
                  )}
                  {directInvestment.recentRounds && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Recent Round Summaries</h3>
                      <p className="text-foreground/70 whitespace-pre-wrap">{directInvestment.recentRounds}</p>
                    </div>
                  )}
                  {directInvestment.capTableChanges && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Cap Table Changes</h3>
                      <p className="text-foreground/70 whitespace-pre-wrap">{directInvestment.capTableChanges}</p>
                    </div>
                  )}
                  {!directInvestment.highlights && !directInvestment.lowlights && !directInvestment.milestones && 
                   !directInvestment.recentRounds && !directInvestment.capTableChanges && (
                    <div className="text-center py-8 text-foreground/60">
                      No executive summary data available
                    </div>
                  )}
                </div>
              </div>

              {/* Documents List */}
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 overflow-hidden">
                <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <h2 className="font-bold text-lg">Documents</h2>
                  </div>
                </div>
                <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60 max-h-96 overflow-y-auto">
                  {directInvestment.documents.length > 0 ? (
                    directInvestment.documents.map((doc) => (
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
                            </div>
                          </div>
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
                          href={`/api/direct-investment-documents/${selectedDoc.id}/proxy`}
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
                              href={`/api/direct-investment-documents/${selectedDoc.id}/proxy`}
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
                            href={`/api/direct-investment-documents/${selectedDoc.id}/proxy`}
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

            {/* Right: Metrics Snapshot (1/3) */}
            <div className="space-y-6">
              {/* Investment Info */}
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <DollarSign className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-lg">Investment Details</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Investment Type</div>
                    <div className="text-lg font-medium">
                      {directInvestment.investmentType?.replace('_', ' ') || 'Private Equity'}
                    </div>
                  </div>
                  {directInvestment.investmentAmount && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Investment Amount</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(directInvestment.investmentAmount)}
                      </div>
                    </div>
                  )}
                  {directInvestment.investmentDate && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Investment Date</div>
                      <div className="text-lg font-medium">
                        {formatDate(directInvestment.investmentDate)}
                      </div>
                    </div>
                  )}
                  {directInvestment.stage && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Stage</div>
                      <div className="text-lg font-medium">{directInvestment.stage}</div>
                    </div>
                  )}
                  {directInvestment.industry && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Industry</div>
                      <div className="text-lg font-medium">{directInvestment.industry}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Private Debt/Credit Details */}
              {(directInvestment.investmentType === 'PRIVATE_DEBT' || directInvestment.investmentType === 'PRIVATE_CREDIT') && (
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg">Debt/Credit Details</h3>
                  </div>
                  <div className="space-y-4">
                    {directInvestment.principalAmount !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Principal Amount</div>
                        <div className="text-xl font-bold">{formatCurrency(directInvestment.principalAmount)}</div>
                      </div>
                    )}
                    {directInvestment.interestRate !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Interest Rate</div>
                        <div className="text-xl font-bold">{formatPercent(directInvestment.interestRate)}</div>
                      </div>
                    )}
                    {directInvestment.couponRate !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Coupon Rate</div>
                        <div className="text-xl font-bold">{formatPercent(directInvestment.couponRate)}</div>
                      </div>
                    )}
                    {directInvestment.maturityDate && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Maturity Date</div>
                        <div className="text-lg font-medium">{formatDate(directInvestment.maturityDate)}</div>
                      </div>
                    )}
                    {directInvestment.creditRating && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Credit Rating</div>
                        <div className="text-lg font-medium">{directInvestment.creditRating}</div>
                      </div>
                    )}
                    {directInvestment.defaultStatus && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Status</div>
                        <div className="text-lg font-medium">{directInvestment.defaultStatus}</div>
                      </div>
                    )}
                    {directInvestment.currentValue !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Current Value</div>
                        <div className="text-xl font-bold text-accent">{formatCurrency(directInvestment.currentValue)}</div>
                      </div>
                    )}
                    {directInvestment.yield !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Yield</div>
                        <div className="text-xl font-bold">{formatPercent(directInvestment.yield)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Public Equity Details */}
              {directInvestment.investmentType === 'PUBLIC_EQUITY' && (
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg">Equity Details</h3>
                  </div>
                  <div className="space-y-4">
                    {directInvestment.tickerSymbol && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Ticker Symbol</div>
                        <div className="text-xl font-bold">{directInvestment.tickerSymbol}</div>
                      </div>
                    )}
                    {directInvestment.shares !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Shares</div>
                        <div className="text-xl font-bold">{directInvestment.shares.toLocaleString()}</div>
                      </div>
                    )}
                    {directInvestment.purchasePrice !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Purchase Price</div>
                        <div className="text-xl font-bold">{formatCurrency(directInvestment.purchasePrice)}</div>
                      </div>
                    )}
                    {directInvestment.currentPrice !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Current Price</div>
                        <div className="text-xl font-bold text-accent">{formatCurrency(directInvestment.currentPrice)}</div>
                      </div>
                    )}
                    {directInvestment.marketValue !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Market Value</div>
                        <div className="text-xl font-bold text-accent">{formatCurrency(directInvestment.marketValue)}</div>
                      </div>
                    )}
                    {directInvestment.dividends !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Total Dividends</div>
                        <div className="text-xl font-bold">{formatCurrency(directInvestment.dividends)}</div>
                      </div>
                    )}
                    {directInvestment.purchasePrice !== null && directInvestment.currentPrice !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Gain/Loss</div>
                        <div className={`text-xl font-bold ${(directInvestment.currentPrice - directInvestment.purchasePrice) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatPercent((directInvestment.currentPrice - directInvestment.purchasePrice) / directInvestment.purchasePrice)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Real Estate Details */}
              {directInvestment.investmentType === 'REAL_ESTATE' && (
                <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg">Property Details</h3>
                  </div>
                  <div className="space-y-4">
                    {directInvestment.propertyType && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Property Type</div>
                        <div className="text-lg font-medium">{directInvestment.propertyType}</div>
                      </div>
                    )}
                    {directInvestment.propertyAddress && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Address</div>
                        <div className="text-lg font-medium">{directInvestment.propertyAddress}</div>
                      </div>
                    )}
                    {directInvestment.squareFootage !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Square Footage</div>
                        <div className="text-xl font-bold">{directInvestment.squareFootage.toLocaleString()} sq ft</div>
                      </div>
                    )}
                    {directInvestment.purchaseDate && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Purchase Date</div>
                        <div className="text-lg font-medium">{formatDate(directInvestment.purchaseDate)}</div>
                      </div>
                    )}
                    {directInvestment.purchaseValue !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Purchase Value</div>
                        <div className="text-xl font-bold">{formatCurrency(directInvestment.purchaseValue)}</div>
                      </div>
                    )}
                    {directInvestment.currentAppraisal !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Current Appraisal</div>
                        <div className="text-xl font-bold text-accent">{formatCurrency(directInvestment.currentAppraisal)}</div>
                      </div>
                    )}
                    {directInvestment.rentalIncome !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Annual Rental Income</div>
                        <div className="text-xl font-bold">{formatCurrency(directInvestment.rentalIncome)}</div>
                      </div>
                    )}
                    {directInvestment.occupancyRate !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Occupancy Rate</div>
                        <div className="text-xl font-bold">{formatPercent(directInvestment.occupancyRate)}</div>
                      </div>
                    )}
                    {directInvestment.propertyTax !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Annual Property Tax</div>
                        <div className="text-xl font-bold">{formatCurrency(directInvestment.propertyTax)}</div>
                      </div>
                    )}
                    {directInvestment.maintenanceCost !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Annual Maintenance</div>
                        <div className="text-xl font-bold">{formatCurrency(directInvestment.maintenanceCost)}</div>
                      </div>
                    )}
                    {directInvestment.netOperatingIncome !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Net Operating Income (NOI)</div>
                        <div className="text-xl font-bold text-accent">{formatCurrency(directInvestment.netOperatingIncome)}</div>
                      </div>
                    )}
                    {directInvestment.purchaseValue !== null && directInvestment.currentAppraisal !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Appreciation</div>
                        <div className={`text-xl font-bold ${(directInvestment.currentAppraisal - directInvestment.purchaseValue) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatPercent((directInvestment.currentAppraisal - directInvestment.purchaseValue) / directInvestment.purchaseValue)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cash Details */}
              {directInvestment.investmentType === 'CASH' && (
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg">Cash Account Details</h3>
                  </div>
                  <div className="space-y-4">
                    {directInvestment.accountType && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Account Type</div>
                        <div className="text-lg font-medium">{directInvestment.accountType}</div>
                      </div>
                    )}
                    {directInvestment.accountName && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Account Name</div>
                        <div className="text-lg font-medium">{directInvestment.accountName}</div>
                      </div>
                    )}
                    {directInvestment.balance !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Balance</div>
                        <div className="text-xl font-bold text-accent">{formatCurrency(directInvestment.balance)}</div>
                      </div>
                    )}
                    {directInvestment.cashInterestRate !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Interest Rate</div>
                        <div className="text-xl font-bold">{formatPercent(directInvestment.cashInterestRate)}</div>
                      </div>
                    )}
                    {directInvestment.currency && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Currency</div>
                        <div className="text-lg font-medium">{directInvestment.currency}</div>
                      </div>
                    )}
                    {directInvestment.cashMaturityDate && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Maturity Date</div>
                        <div className="text-lg font-medium">{formatDate(directInvestment.cashMaturityDate)}</div>
                      </div>
                    )}
                    {directInvestment.balance !== null && directInvestment.cashInterestRate !== null && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Annual Interest</div>
                        <div className="text-xl font-bold">{formatCurrency(directInvestment.balance * directInvestment.cashInterestRate)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metrics Snapshot - Private Equity Only */}
              {directInvestment.investmentType === 'PRIVATE_EQUITY' && (
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-slate-800/60 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-lg">Metrics Snapshot</h3>
                </div>
                <div className="space-y-4">
                  {directInvestment.revenue !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Revenue</div>
                      <div className="text-xl font-bold text-accent">
                        {formatCurrency(directInvestment.revenue)}
                      </div>
                    </div>
                  )}
                  {directInvestment.arr !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">ARR</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(directInvestment.arr)}
                      </div>
                    </div>
                  )}
                  {directInvestment.mrr !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">MRR</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(directInvestment.mrr)}
                      </div>
                    </div>
                  )}
                  {directInvestment.grossMargin !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Gross Margin</div>
                      <div className="text-xl font-bold">
                        {formatPercent(directInvestment.grossMargin)}
                      </div>
                    </div>
                  )}
                  {directInvestment.runRate !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Run Rate</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(directInvestment.runRate)}
                      </div>
                    </div>
                  )}
                  {directInvestment.burn !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Burn (Monthly)</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(directInvestment.burn)}
                      </div>
                    </div>
                  )}
                  {directInvestment.runway !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Runway (Months)</div>
                      <div className="text-xl font-bold">
                        {directInvestment.runway.toFixed(1)} months
                      </div>
                    </div>
                  )}
                  {directInvestment.headcount !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Headcount
                      </div>
                      <div className="text-xl font-bold">
                        {directInvestment.headcount}
                      </div>
                    </div>
                  )}
                  {directInvestment.cac !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">CAC</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(directInvestment.cac)}
                      </div>
                    </div>
                  )}
                  {directInvestment.ltv !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">LTV</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(directInvestment.ltv)}
                      </div>
                    </div>
                  )}
                  {directInvestment.nrr !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">NRR</div>
                      <div className="text-xl font-bold">
                        {formatPercent(directInvestment.nrr)}
                      </div>
                    </div>
                  )}
                  {directInvestment.cashBalance !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">Cash Balance</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(directInvestment.cashBalance)}
                      </div>
                    </div>
                  )}
                  {directInvestment.revenue === null && directInvestment.arr === null && directInvestment.mrr === null &&
                   directInvestment.grossMargin === null && directInvestment.runRate === null && directInvestment.burn === null &&
                   directInvestment.runway === null && directInvestment.headcount === null && directInvestment.cac === null &&
                   directInvestment.ltv === null && directInvestment.nrr === null && directInvestment.cashBalance === null && (
                    <div className="text-center py-8 text-foreground/60">
                      No metrics available
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
          documentType="direct-investment"
          onClose={() => setShowPDFViewer(false)}
        />
      )}
    </div>
  )
}

