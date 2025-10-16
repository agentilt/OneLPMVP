'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Menu, LogOut, User } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface TopbarProps {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="h-16 border-b bg-background sticky top-0 z-40">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">EuroLP</h1>
            <span className="hidden sm:inline text-sm text-foreground/60">
              Limited Partner Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">
                {session?.user?.name || session?.user?.email}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-background border rounded-lg shadow-lg z-50 py-1">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-foreground/60">{session?.user?.email}</p>
                    <p className="text-xs text-foreground/60 mt-1">
                      Role: {session?.user?.role}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

