'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Menu, LogOut, User, Settings } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
    <header className="h-16 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/60 dark:border-slate-800/60 sticky top-0 z-40 shadow-lg shadow-black/5 dark:shadow-black/20">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6 text-foreground" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-xl shadow-accent/25 hover:shadow-accent/40 transition-all duration-300 hover:scale-105">
              <Image
                src="/onelp-logo.png"
                alt="OneLP Logo"
                width={40}
                height={40}
                className="w-10 h-10 filter brightness-0 invert"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-accent/30 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-foreground">
                {session?.user?.name || session?.user?.email?.split('@')[0]}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 z-50 py-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-r from-accent/5 via-accent/2 to-transparent">
                    <p className="text-sm font-semibold text-foreground">{session?.user?.name}</p>
                    <p className="text-xs text-foreground/60">{session?.user?.email}</p>
                  </div>
                  
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                      <Settings className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-foreground">Settings</span>
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
                      <LogOut className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-red-600 dark:text-red-400">Sign Out</span>
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

