'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { formatDate } from '@/lib/utils'
import { Users, Briefcase, FileText, Mail } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  totalFunds: number
  totalDocuments: number
  pendingInvitations: number
}

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: Date
}

interface Document {
  id: string
  title: string
  type: string
  uploadDate: Date
  fund: {
    name: string
  }
}

interface AdminDashboardClientProps {
  stats: Stats
  recentUsers: User[]
  recentDocuments: Document[]
}

export function AdminDashboardClient({
  stats,
  recentUsers,
  recentDocuments,
}: AdminDashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link href="/admin/users" className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </div>
              <div className="text-sm text-foreground/60">Total Users</div>
            </Link>

            <Link href="/admin/funds" className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold">{stats.totalFunds}</div>
              </div>
              <div className="text-sm text-foreground/60">Total Funds</div>
            </Link>

            <Link href="/admin/documents" className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              </div>
              <div className="text-sm text-foreground/60">Documents</div>
            </Link>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Mail className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-2xl font-bold">{stats.pendingInvitations}</div>
              </div>
              <div className="text-sm text-foreground/60">Pending Invites</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-foreground/5 px-4 py-3 border-b flex items-center justify-between">
                <h2 className="font-semibold">Recent Users</h2>
                <Link
                  href="/admin/users"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="divide-y">
                {recentUsers.map((user) => (
                  <div key={user.id} className="px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{user.name || 'No name'}</div>
                        <div className="text-sm text-foreground/60">{user.email}</div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-foreground/10 rounded">
                        {user.role}
                      </span>
                    </div>
                    <div className="text-xs text-foreground/60 mt-1">
                      Joined {formatDate(user.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Documents */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-foreground/5 px-4 py-3 border-b flex items-center justify-between">
                <h2 className="font-semibold">Recent Documents</h2>
                <Link
                  href="/admin/documents"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="divide-y">
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-foreground/60 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-sm text-foreground/60">{doc.fund.name}</div>
                        <div className="text-xs text-foreground/60 mt-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-foreground/10 rounded">
                            {doc.type.replace('_', ' ')}
                          </span>
                          <span>{formatDate(doc.uploadDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/users"
                className="border rounded-lg p-4 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <Users className="w-6 h-6 mb-2 text-foreground/60" />
                <div className="font-medium mb-1">Invite User</div>
                <div className="text-sm text-foreground/60">
                  Send invitation to new LP
                </div>
              </Link>
              <Link
                href="/admin/funds/new"
                className="border rounded-lg p-4 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <Briefcase className="w-6 h-6 mb-2 text-foreground/60" />
                <div className="font-medium mb-1">Create Fund</div>
                <div className="text-sm text-foreground/60">
                  Add new fund to platform
                </div>
              </Link>
              <Link
                href="/admin/documents/upload"
                className="border rounded-lg p-4 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <FileText className="w-6 h-6 mb-2 text-foreground/60" />
                <div className="font-medium mb-1">Upload Document</div>
                <div className="text-sm text-foreground/60">
                  Add capital calls & reports
                </div>
              </Link>
              <Link
                href="/dashboard"
                className="border rounded-lg p-4 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <Users className="w-6 h-6 mb-2 text-foreground/60" />
                <div className="font-medium mb-1">User View</div>
                <div className="text-sm text-foreground/60">
                  Switch to LP portal
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

