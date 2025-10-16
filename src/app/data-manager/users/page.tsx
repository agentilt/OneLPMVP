'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { DataManagerSidebar } from '@/components/DataManagerSidebar'
import Link from 'next/link'
import { Search, ChevronRight } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  fundAccess: {
    fund: {
      id: string
      name: string
    }
  }[]
}

export default function DataManagerUsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/data-manager/users')
      const data = await response.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    )
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
      case 'DATA_MANAGER':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <DataManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-6">
          <div className="max-w-6xl">
            <h1 className="text-3xl font-bold mb-6">Manage Users</h1>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email, name, or role..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-foreground/60">Loading users...</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-black/5 dark:bg-white/5">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">User</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Role</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Fund Access</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Joined</th>
                      <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-foreground/60">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{user.name || 'No name'}</p>
                              <p className="text-sm text-foreground/60">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                              {user.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-foreground/60">
                              {user.fundAccess.length} {user.fundAccess.length === 1 ? 'fund' : 'funds'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-foreground/60">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/data-manager/users/${user.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                            >
                              Manage
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

