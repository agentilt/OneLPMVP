'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { AdminSidebar } from '@/components/AdminSidebar'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Mail, Check, X, Clock } from 'lucide-react'

interface Fund {
  id: string
  name: string
}

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: Date
  fundAccess: {
    fund: Fund
  }[]
}

interface Invitation {
  id: string
  email: string
  token: string
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
  creator: {
    name: string | null
    email: string
  }
}

interface AdminUsersClientProps {
  users: User[]
  allFunds: Fund[]
  invitations: Invitation[]
}

export function AdminUsersClient({
  users: initialUsers,
  allFunds,
  invitations: initialInvitations,
}: AdminUsersClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setShowInviteModal(false)
      
      // Refresh page
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation')
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">User Management</h1>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Invite User
            </button>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg overflow-hidden mb-8">
            <div className="bg-foreground/5 px-4 py-3 border-b">
              <h2 className="font-semibold">All Users ({initialUsers.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-foreground/5 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Fund Access</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {initialUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-black/5 dark:hover:bg-white/10">
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.name || 'No name'}</div>
                        <div className="text-sm text-foreground/60">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs bg-foreground/10 rounded">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {user.fundAccess.length > 0 ? (
                            <div className="space-y-1">
                              {user.fundAccess.map((access) => (
                                <div key={access.fund.id} className="text-foreground/80">
                                  {access.fund.name}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-foreground/60">No access</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground/60">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invitations Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-foreground/5 px-4 py-3 border-b">
              <h2 className="font-semibold">Invitations ({initialInvitations.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-foreground/5 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Sent By</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Created</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {initialInvitations.map((invitation) => {
                    const isExpired = invitation.expiresAt < new Date()
                    const isUsed = !!invitation.usedAt
                    const isPending = !isUsed && !isExpired

                    return (
                      <tr key={invitation.id} className="hover:bg-black/5 dark:hover:bg-white/10">
                        <td className="px-4 py-3 font-medium">{invitation.email}</td>
                        <td className="px-4 py-3">
                          {isUsed ? (
                            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              Used
                            </span>
                          ) : isExpired ? (
                            <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                              <X className="w-4 h-4" />
                              Expired
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
                              <Clock className="w-4 h-4" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {invitation.creator.name || invitation.creator.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground/60">
                          {formatDate(invitation.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground/60">
                          {formatDate(invitation.expiresAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Invite User</h2>
            
            <form onSubmit={handleSendInvitation}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="investor@example.com"
                />
                <p className="mt-2 text-xs text-foreground/60">
                  An invitation email will be sent with a registration link valid for 48 hours.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
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
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

