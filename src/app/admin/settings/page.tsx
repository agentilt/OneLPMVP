'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { Settings } from 'lucide-react'

export default function AdminSettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>

          <div className="border rounded-lg p-12 text-center">
            <Settings className="w-16 h-16 mx-auto mb-4 text-foreground/40" />
            <h2 className="text-xl font-semibold mb-2">Settings & Configuration</h2>
            <p className="text-foreground/60 max-w-md mx-auto">
              Platform settings, email configuration, and other administrative options will be available here.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

