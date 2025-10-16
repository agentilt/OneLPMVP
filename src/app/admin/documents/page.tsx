'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { AdminSidebar } from '@/components/AdminSidebar'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'

export default function AdminDocumentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Document Management</h1>
            <Link
              href="/admin/documents/upload"
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Upload Document
            </Link>
          </div>

          <div className="border rounded-lg p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-foreground/40" />
            <h2 className="text-xl font-semibold mb-2">Document Library</h2>
            <p className="text-foreground/60 mb-6 max-w-md mx-auto">
              Upload and manage capital calls, quarterly reports, annual reports, and other documents.
            </p>
            <Link
              href="/admin/documents/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Upload First Document
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}

