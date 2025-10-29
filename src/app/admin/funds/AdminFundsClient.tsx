'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { formatCurrency, formatMultiple, formatDate } from '@/lib/utils'
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
  tvpi: number
  lastReportDate: Date
  user: {
    id: string
    name: string | null
    email: string
  } | null
  _count: {
    documents: number
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">All Funds Overview</h1>
            <p className="text-foreground/60">
              View all funds in the system. To create or manage funds, go to a user's profile.
            </p>
          </div>

          {/* Funds List */}
          {funds.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-foreground/5 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">Fund</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Owner</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Metrics</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Last Report</th>
                      <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {funds.map((fund) => (
                      <tr key={fund.id} className="hover:bg-black/5 dark:hover:bg-white/10">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{fund.name}</div>
                          <div className="text-sm text-foreground/60">
                            {fund.domicile} • Vintage {fund.vintage}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {fund.user ? (
                            <Link
                              href={`/admin/users/${fund.user.id}`}
                              className="text-sm hover:text-accent hover:underline"
                            >
                              {fund.user.name || fund.user.email}
                            </Link>
                          ) : (
                            <span className="text-sm text-foreground/60">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm space-y-1">
                            <div>NAV: {formatCurrency(fund.nav)}</div>
                            <div className="text-foreground/60">TVPI: {formatMultiple(fund.tvpi)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground/60">
                          {formatDate(fund.lastReportDate)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {fund.user ? (
                            <Link
                              href={`/admin/users/${fund.user.id}`}
                              className="text-sm font-medium hover:text-accent transition-colors"
                            >
                              Manage
                            </Link>
                          ) : (
                            <span className="text-sm text-foreground/60">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-foreground/40" />
              <p className="text-foreground/60 mb-4">No funds in the system yet</p>
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90"
              >
                <Users className="w-4 h-4" />
                Go to Users
              </Link>
            </div>
          )}
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

