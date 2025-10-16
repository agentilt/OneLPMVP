'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { Bitcoin } from 'lucide-react'

export default function CryptoPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6">Crypto Holdings</h1>

          <div className="border rounded-lg p-12 text-center">
            <Bitcoin className="w-16 h-16 mx-auto mb-4 text-foreground/40" />
            <h2 className="text-xl font-semibold mb-2">Cryptocurrency Portfolio</h2>
            <p className="text-foreground/60 max-w-md mx-auto">
              View and manage your cryptocurrency holdings. Your crypto portfolio will be displayed here.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

