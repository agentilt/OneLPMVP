'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatPercent, formatMultiple, formatDate } from '@/lib/utils'
import { FileText, Calendar, DollarSign } from 'lucide-react'

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
  irr: number
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
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          {/* Fund Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{fund.name}</h1>
            <div className="flex items-center gap-3 text-sm text-foreground/60">
              <span>{fund.domicile}</span>
              <span>•</span>
              <span>Vintage {fund.vintage}</span>
              <span>•</span>
              <span>{fund.manager}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Document Viewer (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Documents List */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-foreground/5 px-4 py-3 border-b">
                  <h2 className="font-semibold">Documents</h2>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {fund.documents.length > 0 ? (
                    fund.documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className={`w-full px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                          selectedDoc?.id === doc.id ? 'bg-blue-50 dark:bg-blue-950/20' : ''
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
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-foreground/5 px-4 py-3 border-b">
                    <h3 className="font-semibold">{selectedDoc.title}</h3>
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
                        <div className="pt-4 border-t">
                          <a
                            href={selectedDoc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                          >
                            <FileText className="w-4 h-4" />
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
                          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                        >
                          <FileText className="w-4 h-4" />
                          View Document
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
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Key Metrics</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">Commitment</div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(fund.commitment)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">Paid-in Capital</div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(fund.paidIn)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">NAV</div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(fund.nav)}
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-xs text-foreground/60 mb-1">IRR</div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatPercent(fund.irr)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">TVPI</div>
                    <div className="text-lg font-semibold">
                      {formatMultiple(fund.tvpi)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">DPI</div>
                    <div className="text-lg font-semibold">
                      {formatMultiple(fund.dpi)}
                    </div>
                  </div>
                </div>
              </div>

              {/* NAV Chart */}
              {chartData.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">NAV Over Time</h3>
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
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Recent Capital Calls</h3>
                  <div className="space-y-3">
                    {capitalCalls.slice(0, 3).map((call) => (
                      <div key={call.id} className="text-sm">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="font-medium">{call.title}</div>
                          {call.callAmount && (
                            <div className="font-semibold text-blue-600 dark:text-blue-400">
                              {formatCurrency(call.callAmount)}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-foreground/60 flex items-center gap-2">
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

