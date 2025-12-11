'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId?: string
  description: string
  oldValues?: string
  newValues?: string
  metadata?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  User: {
    id: string
    email: string
    name: string
    role: string
  }
}

interface AuditLogsResponse {
  auditLogs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const chipTone = (strength: number) =>
  `bg-[color-mix(in_srgb,var(--accent-color) ${strength}%,var(--surface))] border border-border text-foreground shadow-[0_6px_18px_-10px_rgba(0,0,0,0.4)]`

const neutralChip = 'bg-[color-mix(in_srgb,var(--foreground) 12%,var(--surface))] border border-border text-foreground shadow-[0_6px_18px_-10px_rgba(0,0,0,0.35)]'

const resourceTone = (resource: string) => {
  switch (resource) {
    case 'USER':
      return chipTone(16)
    case 'FUND':
      return chipTone(18)
    case 'DOCUMENT':
      return chipTone(14)
    case 'FUND_ACCESS':
      return chipTone(12)
    case 'INVITATION':
      return chipTone(15)
    case 'SYSTEM':
      return neutralChip
    default:
      return neutralChip
  }
}

const actionTone = (action: string) => {
  switch (action) {
    case 'CREATE':
      return chipTone(20)
    case 'UPDATE':
      return chipTone(18)
    case 'DELETE':
      return chipTone(24)
    case 'LOGIN':
    case 'LOGOUT':
      return chipTone(14)
    case 'UPLOAD':
    case 'DOWNLOAD':
      return chipTone(12)
    case 'RESET_PASSWORD':
    case 'CHANGE_PASSWORD':
      return chipTone(16)
    case 'GRANT_ACCESS':
    case 'REVOKE_ACCESS':
      return chipTone(22)
    default:
      return neutralChip
  }
}

export default function AuditLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resource: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || !['ADMIN', 'DATA_MANAGER'].includes(session.user.role)) {
      router.push('/dashboard')
      return
    }
    
    fetchAuditLogs()
  }, [session, status, pagination.page, filters])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      
      const response = await fetch(`/api/admin/audit-logs?${params}`)
      const data: AuditLogsResponse = await response.json()
      
      setAuditLogs(data.auditLogs)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString()

  if (status === 'loading' || loading) {
    return (
      <div className="glass-page min-h-screen flex items-center justify-center p-6">
        <div className="glass-panel rounded-2xl p-8 shadow-xl shadow-black/15 border border-border flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <div className="text-foreground/80 font-medium">Loading audit logs...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-page min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">Audit Logs</h1>
          <p className="text-foreground/70">Track all administrative actions and changes</p>
      </div>

      {/* Filters */}
        <div className="glass-panel rounded-2xl border border-border shadow-xl shadow-black/15 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">User</label>
            <input
              type="text"
              placeholder="User email"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-[var(--surface)] text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-[var(--surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="UPLOAD">Upload</option>
              <option value="DOWNLOAD">Download</option>
              <option value="RESET_PASSWORD">Reset Password</option>
              <option value="CHANGE_PASSWORD">Change Password</option>
              <option value="GRANT_ACCESS">Grant Access</option>
              <option value="REVOKE_ACCESS">Revoke Access</option>
            </select>
          </div>
          <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Resource</label>
            <select
              value={filters.resource}
              onChange={(e) => handleFilterChange('resource', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-[var(--surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            >
              <option value="">All Resources</option>
              <option value="USER">User</option>
              <option value="FUND">Fund</option>
              <option value="DOCUMENT">Document</option>
              <option value="FUND_ACCESS">Fund Access</option>
              <option value="INVITATION">Invitation</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>
          <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-[var(--surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-[var(--surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
        <div className="glass-panel rounded-2xl border border-border shadow-2xl shadow-black/15 overflow-hidden">
          <div className="glass-header px-6 py-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground/80">Recent activity</h3>
          </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/70">
              <thead className="bg-transparent">
              <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wide">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wide">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wide">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wide">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wide">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-border/60">
              {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[color-mix(in_srgb,var(--surface) 92%,var(--foreground) 8%)]/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-foreground">{log.User.name || log.User.email}</div>
                      <div className="text-sm text-foreground/70">{log.User.email}</div>
                      <div className="text-xs text-foreground/50">{log.User.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${actionTone(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${resourceTone(log.resource)}`}>
                      {log.resource}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                      <div className="text-sm text-foreground/90">{log.description}</div>
                      {log.resourceId && <div className="text-xs text-foreground/60">ID: {log.resourceId}</div>}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">
                    {log.ipAddress || '-'}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">
                    {formatDate(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
          <div className="glass-header border-t border-border px-4 py-3 flex items-center justify-between sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden gap-3">
            <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
                className="inline-flex items-center px-4 py-2 rounded-lg border border-border bg-[var(--surface)] text-foreground/80 hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages || 1, prev.page + 1) }))}
                disabled={!pagination.totalPages || pagination.page === pagination.totalPages}
                className="inline-flex items-center px-4 py-2 rounded-lg border border-border bg-[var(--surface)] text-foreground/80 hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <p className="text-sm text-foreground/70">
                Showing <span className="font-semibold text-foreground">{(pagination.page - 1) * pagination.limit + 1}</span>{' '}
                to <span className="font-semibold text-foreground">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>{' '}
                of <span className="font-semibold text-foreground">{pagination.total}</span> results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="inline-flex items-center px-3 py-2 rounded-lg border border-border bg-[var(--surface)] text-foreground/80 hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages || 1, prev.page + 1) }))}
                  disabled={!pagination.totalPages || pagination.page === pagination.totalPages}
                  className="inline-flex items-center px-3 py-2 rounded-lg border border-border bg-[var(--surface)] text-foreground/80 hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
