'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { formatCurrency, formatPercent, formatMultiple, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Users, FileText } from 'lucide-react'

interface Fund {
  id: string
  name: string
  domicile: string
  vintage: number
  manager: string
  commitment: number
  nav: number
  irr: number
  tvpi: number
  lastReportDate: Date
  _count: {
    documents: number
    fundAccess: number
  }
}

interface AdminFundsClientProps {
  funds: Fund[]
}

export function AdminFundsClient({ funds }: AdminFundsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Fund Management</h1>
            <Link
              href="/admin/funds/new"
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Create Fund
            </Link>
          </div>

          {/* Funds List */}
          <div className="space-y-4">
            {funds.map((fund) => (
              <div key={fund.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{fund.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-foreground/60">
                      <span>{fund.domicile}</span>
                      <span>•</span>
                      <span>Vintage {fund.vintage}</span>
                      <span>•</span>
                      <span>{fund.manager}</span>
                    </div>
                  </div>
                  <Link
                    href={`/funds/${fund.id}`}
                    className="px-4 py-2 border rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    View Details
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">Commitment</div>
                    <div className="font-semibold">{formatCurrency(fund.commitment)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">NAV</div>
                    <div className="font-semibold">{formatCurrency(fund.nav)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">IRR</div>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {formatPercent(fund.irr)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60 mb-1">TVPI</div>
                    <div className="font-semibold">{formatMultiple(fund.tvpi)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-foreground/60">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{fund._count.fundAccess} investors</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>{fund._count.documents} documents</span>
                  </div>
                  <div>Last report: {formatDate(fund.lastReportDate)}</div>
                </div>
              </div>
            ))}

            {funds.length === 0 && (
              <div className="border rounded-lg p-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-foreground/40" />
                <p className="text-foreground/60 mb-4">No funds created yet</p>
                <Link
                  href="/admin/funds/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  Create First Fund
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function Briefcase({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

