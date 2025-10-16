'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { FileText, Upload } from 'lucide-react'

export default function KYCPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6">KYC Documents</h1>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">KYC Status</h3>
                  <p className="text-sm text-foreground/60">Verified</p>
                </div>
              </div>
              <p className="text-sm text-foreground/60">
                Your KYC documentation has been verified and is up to date.
              </p>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Upload Documents</h3>
                  <p className="text-sm text-foreground/60">Update your information</p>
                </div>
              </div>
              <button className="w-full px-4 py-2 border rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                Upload New Documents
              </button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-foreground/5 px-4 py-3 border-b">
              <h2 className="font-semibold">Your Documents</h2>
            </div>
            <div className="p-8 text-center text-foreground/60">
              <FileText className="w-12 h-12 mx-auto mb-3 text-foreground/40" />
              <p>No documents uploaded yet</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

