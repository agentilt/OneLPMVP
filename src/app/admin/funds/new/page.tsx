'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/Topbar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { toast } from 'sonner'

export default function NewFundPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    domicile: '',
    vintage: new Date().getFullYear(),
    manager: '',
    commitment: '',
    paidIn: '',
    nav: '',
    irr: '',
    tvpi: '',
    dpi: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          commitment: parseFloat(formData.commitment),
          paidIn: parseFloat(formData.paidIn),
          nav: parseFloat(formData.nav),
          irr: parseFloat(formData.irr),
          tvpi: parseFloat(formData.tvpi),
          dpi: parseFloat(formData.dpi),
          vintage: parseInt(String(formData.vintage)),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create fund')
      }

      toast.success('Fund created successfully')
      router.push('/admin/funds')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create fund')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6">Create New Fund</h1>

          <form onSubmit={handleSubmit} className="max-w-2xl">
            <div className="border rounded-lg p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fund Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="European Ventures Fund I"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Domicile *
                  </label>
                  <input
                    type="text"
                    value={formData.domicile}
                    onChange={(e) => setFormData({ ...formData, domicile: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="Luxembourg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vintage Year *
                  </label>
                  <input
                    type="number"
                    value={formData.vintage}
                    onChange={(e) => setFormData({ ...formData, vintage: parseInt(e.target.value) })}
                    required
                    min="2000"
                    max="2100"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Manager *
                  </label>
                  <input
                    type="text"
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="EuroVC Partners"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Commitment (€) *
                  </label>
                  <input
                    type="number"
                    value={formData.commitment}
                    onChange={(e) => setFormData({ ...formData, commitment: e.target.value })}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="5000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Paid-in Capital (€) *
                  </label>
                  <input
                    type="number"
                    value={formData.paidIn}
                    onChange={(e) => setFormData({ ...formData, paidIn: e.target.value })}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="3500000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Current NAV (€) *
                  </label>
                  <input
                    type="number"
                    value={formData.nav}
                    onChange={(e) => setFormData({ ...formData, nav: e.target.value })}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="4200000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    IRR (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.irr}
                    onChange={(e) => setFormData({ ...formData, irr: e.target.value })}
                    required
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="18.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    TVPI (x) *
                  </label>
                  <input
                    type="number"
                    value={formData.tvpi}
                    onChange={(e) => setFormData({ ...formData, tvpi: e.target.value })}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="1.20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    DPI (x) *
                  </label>
                  <input
                    type="number"
                    value={formData.dpi}
                    onChange={(e) => setFormData({ ...formData, dpi: e.target.value })}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    placeholder="0.15"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading ? 'Creating...' : 'Create Fund'}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}

