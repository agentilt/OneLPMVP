'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Menu, LogOut, User, Settings, Building2, ChevronDown } from 'lucide-react'
import Link from 'next/link'

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
    <header className="h-16 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm shadow-black/5">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-hover shadow-lg shadow-accent/25 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
                EuroLP
              </h1>
              <span className="hidden sm:block text-[10px] text-foreground/50 font-medium uppercase tracking-wider -mt-0.5">
                Partner Portal
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-accent/50 hover:bg-accent/5 transition-all shadow-sm hover:shadow-md hover:shadow-accent/10"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                <User className="w-4 h-4 text-accent" />
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {session?.user?.name || session?.user?.email?.split('@')[0]}
              </span>
              <ChevronDown className="w-4 h-4 text-foreground/40 group-hover:text-accent transition-colors" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/30 z-50 overflow-hidden">
                  {/* User Info Header */}
                  <div className="px-4 py-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-hover shadow-lg shadow-accent/25 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{session?.user?.name}</p>
                        <p className="text-xs text-foreground/60 truncate">{session?.user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-accent/5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                        <Settings className="w-4 h-4 text-foreground/60 group-hover:text-accent transition-colors" />
                      </div>
                      <span className="group-hover:text-accent transition-colors">Settings</span>
                    </Link>
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4 text-foreground/60 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                      </div>
                      <span className="group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

