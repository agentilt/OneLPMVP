'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { formatCurrency, formatMultiple, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Edit2, Trash2, X } from 'lucide-react'
import Link from 'next/link'

interface Fund {
  id: string
  name: string
  domicile: string
  vintage: number
  manager: string
  commitment: number
  paidIn: number
  nav: number
  tvpi: number
  dpi: number
  lastReportDate: Date
}

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: Date
  funds: Fund[]
}

interface UserFundsClientProps {
  user: User
}

export function UserFundsClient({ user: initialUser }: UserFundsClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingFund, setEditingFund] = useState<Fund | null>(null)
  const [loading, setLoading] = useState(false)
  const [funds, setFunds] = useState(initialUser.funds)

  const [formData, setFormData] = useState({
    name: '',
    domicile: '',
    vintage: new Date().getFullYear(),
    manager: '',
    commitment: '',
    paidIn: '',
    nav: '',
    tvpi: '',
    dpi: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      domicile: '',
      vintage: new Date().getFullYear(),
      manager: '',
      commitment: '',
      paidIn: '',
      nav: '',
      tvpi: '',
      dpi: '',
    })
    setEditingFund(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const handleOpenEdit = (fund: Fund) => {
    setEditingFund(fund)
    setFormData({
      name: fund.name,
      domicile: fund.domicile,
      vintage: fund.vintage,
      manager: fund.manager,
      commitment: fund.commitment.toString(),
      paidIn: fund.paidIn.toString(),
      nav: fund.nav.toString(),
      tvpi: fund.tvpi.toString(),
      dpi: fund.dpi.toString(),
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingFund
        ? `/api/admin/users/${initialUser.id}/funds/${editingFund.id}`
        : `/api/admin/users/${initialUser.id}/funds`

      const method = editingFund ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: initialUser.id,
          ...formData,
          commitment: parseFloat(formData.commitment),
          paidIn: parseFloat(formData.paidIn),
          nav: parseFloat(formData.nav),
          tvpi: parseFloat(formData.tvpi),
          dpi: parseFloat(formData.dpi),
          vintage: parseInt(String(formData.vintage)),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save fund')
      }

      toast.success(editingFund ? 'Fund updated successfully' : 'Fund created successfully')
      setShowModal(false)
      resetForm()

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save fund')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (fundId: string) => {
    if (!confirm('Are you sure you want to delete this fund? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${initialUser.id}/funds/${fundId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete fund')
      }

      toast.success('Fund deleted successfully')
      setFunds(funds.filter((f) => f.id !== fundId))
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete fund')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Users
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{initialUser.name || 'User'}</h1>
                <p className="text-foreground/60 mt-1">{initialUser.email}</p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add Fund
              </button>
            </div>
          </div>

          {/* User Info Card */}
          <div className="border rounded-lg p-6 mb-6">
            <h2 className="font-semibold mb-4">User Information</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-foreground/60">Role</div>
                <div className="font-medium">{initialUser.role}</div>
              </div>
              <div>
                <div className="text-sm text-foreground/60">Member Since</div>
                <div className="font-medium">{formatDate(initialUser.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-foreground/60">Total Funds</div>
                <div className="font-medium">{funds.length}</div>
              </div>
            </div>
          </div>

          {/* Funds List */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-foreground/5 px-4 py-3 border-b">
              <h2 className="font-semibold">Funds ({funds.length})</h2>
            </div>

            {funds.length > 0 ? (
              <div className="divide-y">
                {funds.map((fund) => (
                  <div key={fund.id} className="p-4 hover:bg-black/5 dark:hover:bg-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{fund.name}</h3>
                        <div className="text-sm text-foreground/60 mt-1">
                          {fund.domicile} • Vintage {fund.vintage} • {fund.manager}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(fund)}
                          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit fund"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fund.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                          title="Delete fund"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <div className="text-xs text-foreground/60">Commitment</div>
                        <div className="font-semibold">{formatCurrency(fund.commitment)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-foreground/60">Paid-in</div>
                        <div className="font-semibold">{formatCurrency(fund.paidIn)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-foreground/60">NAV</div>
                        <div className="font-semibold">{formatCurrency(fund.nav)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-foreground/60">TVPI</div>
                        <div className="font-semibold">{formatMultiple(fund.tvpi)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-foreground/60">DPI</div>
                        <div className="font-semibold">{formatMultiple(fund.dpi)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-foreground/60 mb-4">This user has no funds yet.</p>
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  Add First Fund
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create/Edit Fund Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingFund ? 'Edit Fund' : 'Add New Fund'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Fund Name *</label>
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
                  <label className="block text-sm font-medium mb-2">Domicile *</label>
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
                  <label className="block text-sm font-medium mb-2">Vintage Year *</label>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Manager *</label>
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
                  <label className="block text-sm font-medium mb-2">Commitment (€) *</label>
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
                  <label className="block text-sm font-medium mb-2">Paid-in Capital (€) *</label>
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
                  <label className="block text-sm font-medium mb-2">Current NAV (€) *</label>
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
                  <label className="block text-sm font-medium mb-2">TVPI (x) *</label>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">DPI (x) *</label>
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
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading ? 'Saving...' : editingFund ? 'Update Fund' : 'Create Fund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

