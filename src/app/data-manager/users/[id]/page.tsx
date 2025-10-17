'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { DataManagerSidebar } from '@/components/DataManagerSidebar'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, TrendingUp, Euro } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Fund {
  id: string
  name: string
  commitment: number
  paidIn: number
  nav: number
  tvpi: number
  dpi: number
}

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  fundAccess: {
    id: string
    fund: Fund
  }[]
  cryptoHoldings: {
    id: string
    symbol: string
    name: string
    amount: number
    valueUsd: number
  }[]
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [userId, setUserId] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [availableFunds, setAvailableFunds] = useState<{ id: string; name: string }[]>([])
  const [selectedFundId, setSelectedFundId] = useState('')
  const [showAddFund, setShowAddFund] = useState(false)

  useEffect(() => {
    params.then((p) => {
      setUserId(p.id)
      fetchUser(p.id)
    })
    fetchAvailableFunds()
  }, [])

  const fetchUser = async (id: string) => {
    try {
      const response = await fetch(`/api/data-manager/users/${id}`)
      const data = await response.json()
      if (data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableFunds = async () => {
    try {
      const response = await fetch('/api/admin/funds/list')
      const data = await response.json()
      if (data.funds) {
        setAvailableFunds(data.funds)
      }
    } catch (error) {
      console.error('Failed to fetch funds:', error)
    }
  }

  const handleAddFundAccess = async () => {
    if (!selectedFundId || !userId) return

    try {
      const response = await fetch('/api/data-manager/fund-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fundId: selectedFundId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grant access')
      }

      toast.success('Fund access granted')
      setShowAddFund(false)
      setSelectedFundId('')
      fetchUser(userId)
    } catch (error: any) {
      toast.error(error.message || 'Failed to grant fund access')
    }
  }

  const handleRemoveFundAccess = async (fundId: string) => {
    if (!confirm('Are you sure you want to revoke access to this fund?')) return

    try {
      const response = await fetch(`/api/data-manager/fund-access?userId=${userId}&fundId=${fundId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke access')
      }

      toast.success('Fund access revoked')
      fetchUser(userId)
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke fund access')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/60">Loading user data...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/60">User not found</p>
      </div>
    )
  }

  const userFundIds = user.fundAccess.map((fa) => fa.fund.id)
  const fundsToAdd = availableFunds.filter((f) => !userFundIds.includes(f.id))

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <DataManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          <div className="max-w-6xl">
            {/* Header */}
            <div className="mb-6">
              <Link
                href="/data-manager/users"
                className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Users
              </Link>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{user.name || 'No name'}</h1>
                  <p className="text-foreground/60">{user.email}</p>
                </div>
                <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Fund Access */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Fund Access</h2>
                {fundsToAdd.length > 0 && (
                  <button
                    onClick={() => setShowAddFund(!showAddFund)}
                    className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Grant Access
                  </button>
                )}
              </div>

              {/* Add Fund Form */}
              {showAddFund && (
                <div className="border rounded-lg p-4 mb-4 bg-blue-50 dark:bg-blue-950/20">
                  <h3 className="font-medium mb-3">Grant Fund Access</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedFundId}
                      onChange={(e) => setSelectedFundId(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    >
                      <option value="">Select a fund</option>
                      {fundsToAdd.map((fund) => (
                        <option key={fund.id} value={fund.id}>
                          {fund.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddFundAccess}
                      disabled={!selectedFundId}
                      className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddFund(false)
                        setSelectedFundId('')
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Fund List */}
              {user.fundAccess.length === 0 ? (
                <div className="border rounded-lg p-8 text-center">
                  <p className="text-foreground/60 mb-4">No fund access granted</p>
                  {fundsToAdd.length > 0 && (
                    <button
                      onClick={() => setShowAddFund(true)}
                      className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Grant Access to First Fund
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {user.fundAccess.map(({ id, fund }) => (
                    <div key={id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{fund.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-foreground/60">TVPI: {fund.tvpi}x</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFundAccess(fund.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Revoke access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-foreground/60">Commitment</p>
                          <p className="font-medium">€{fund.commitment.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-foreground/60">NAV</p>
                          <p className="font-medium">€{fund.nav.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-foreground/60">TVPI</p>
                          <p className="font-medium">{fund.tvpi.toFixed(2)}x</p>
                        </div>
                        <div>
                          <p className="text-foreground/60">DPI</p>
                          <p className="font-medium">{fund.dpi.toFixed(2)}x</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Crypto Holdings */}
            {user.cryptoHoldings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Crypto Holdings</h2>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-black/5 dark:bg-white/5">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium">Asset</th>
                        <th className="text-right px-4 py-3 text-sm font-medium">Amount</th>
                        <th className="text-right px-4 py-3 text-sm font-medium">Value (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {user.cryptoHoldings.map((holding) => (
                        <tr key={holding.id}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{holding.name}</p>
                              <p className="text-sm text-foreground/60">{holding.symbol}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {holding.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            ${holding.valueUsd.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

