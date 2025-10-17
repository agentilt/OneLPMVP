'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatPercent, formatMultiple, formatDate } from '@/lib/utils'
import { FileText, Calendar, DollarSign, TrendingUp, Briefcase, MapPin, Download, ExternalLink } from 'lucide-react'

interface NavHistory {
  id: string
  date: Date
  nav: number
}

interface Document {
  id: string
  type: string
  title: string
  uploadDate: Date
  dueDate: Date | null
  callAmount: number | null
  paymentStatus: string | null
  url: string
  parsedData: any
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
  lastReportDate: Date
  navHistory: NavHistory[]
  documents: Document[]
}

interface FundDetailClientProps {
  fund: Fund
}

export function FundDetailClient({ fund }: FundDetailClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(
    fund.documents.length > 0 ? fund.documents[0] : null
  )

  // Prepare chart data
  const chartData = fund.navHistory.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
    nav: item.nav,
  }))

  // Get capital calls
  const capitalCalls = fund.documents.filter(
    (doc) => doc.type === 'CAPITAL_CALL'
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
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
              {/* Documents List */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
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

              {/* Document Viewer */}
              {selectedDoc && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                    <h3 className="font-bold text-lg">{selectedDoc.title}</h3>
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
                        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
                          <a
                            href={selectedDoc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Full Document
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-foreground/40" />
                        <p className="text-foreground/60 mb-4">
                          Document preview not available
                        </p>
                        <a
                          href={selectedDoc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200"
                        >
                          <Download className="w-4 h-4" />
                          Download Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Charts and Metrics (1/3) */}
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6">
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
                      {formatMultiple(fund.tvpi)}
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

              {/* NAV Chart */}
              {chartData.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <DollarSign className="w-5 h-5 text-accent" />
                    <h3 className="font-bold text-lg">NAV Over Time</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        stroke="currentColor"
                        opacity={0.5}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="currentColor"
                        opacity={0.5}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Line
                        type="monotone"
                        dataKey="nav"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent Capital Calls */}
              {capitalCalls.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6">
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
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

