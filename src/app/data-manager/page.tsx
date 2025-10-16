'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { DataManagerSidebar } from '@/components/DataManagerSidebar'
import Link from 'next/link'
import { Users, TrendingUp, Database } from 'lucide-react'

export default function DataManagerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <DataManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          <div className="max-w-6xl">
            <h1 className="text-3xl font-bold mb-2">Data Manager Dashboard</h1>
            <p className="text-foreground/60 mb-8">
              Manage user data, fund access, and portfolio information
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">User Management</h3>
                    <p className="text-sm text-foreground/60">View & edit user data</p>
                  </div>
                </div>
                <Link
                  href="/data-manager/users"
                  className="block text-center py-2 px-4 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                >
                  Manage Users
                </Link>
              </div>

              <div className="border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Fund Access</h3>
                    <p className="text-sm text-foreground/60">Grant & revoke access</p>
                  </div>
                </div>
                <Link
                  href="/data-manager/users"
                  className="block text-center py-2 px-4 border rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  View Access
                </Link>
              </div>

              <div className="border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Upload Documents</h3>
                    <p className="text-sm text-foreground/60">Add fund documents</p>
                  </div>
                </div>
                <Link
                  href="/admin/documents/upload"
                  className="block text-center py-2 px-4 border rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  Upload
                </Link>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/data-manager/users"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <div>
                    <h3 className="font-medium">View All Users</h3>
                    <p className="text-sm text-foreground/60">See complete user list with fund access</p>
                  </div>
                  <Users className="w-5 h-5 text-foreground/40" />
                </Link>
                <Link
                  href="/admin/documents/upload"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <div>
                    <h3 className="font-medium">Upload Document</h3>
                    <p className="text-sm text-foreground/60">Add capital calls, reports, or other documents</p>
                  </div>
                  <Database className="w-5 h-5 text-foreground/40" />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

