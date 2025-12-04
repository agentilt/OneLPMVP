'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Menu, LogOut, User, Settings, Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface TopbarProps {
  onMenuClick?: () => void
  onOpenAIChat?: () => void
}

export function Topbar({ onMenuClick, onOpenAIChat }: TopbarProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    try {
      // End session before signing out
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Failed to end session:', error)
      // Continue with signout even if session ending fails
    }
    
    // Sign out via NextAuth
    signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="h-16 bg-white dark:bg-surface border-b border-border dark:border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="h-full px-6 lg:px-8 flex items-center justify-between">
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
            <Image
              src="/onelp-logo.png"
              alt="OneLP Logo"
              width={48}
              height={48}
              className="w-12 h-12 object-contain transition-transform duration-300 hover:scale-105 dark:invert"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (typeof window === 'undefined') return
              if (typeof (window as any).__ONE_LP_OPEN_SEARCH__ === 'function') {
                ;(window as any).__ONE_LP_OPEN_SEARCH__()
              } else {
                window.dispatchEvent(new CustomEvent('open-global-search'))
              }
            }}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface dark:bg-slate-800 border border-border dark:border-slate-700 hover:bg-surface-hover dark:hover:bg-slate-700 hover:border-accent/40 transition-all duration-150"
          >
            <Search className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span className="text-sm font-medium text-foreground">Search</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500">⌘K</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface dark:bg-slate-800 border border-border dark:border-slate-700 hover:bg-surface-hover dark:hover:bg-slate-700 hover:border-accent/40 transition-all duration-150"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="hidden sm:inline text-sm font-medium text-foreground">
                {session?.user?.name || session?.user?.email?.split('@')[0]}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border dark:border-slate-800">
                    <p className="text-sm font-semibold text-foreground">{session?.user?.name}</p>
                    <p className="text-xs text-foreground/60">{session?.user?.email}</p>
                  </div>
                  
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-surface-hover dark:hover:bg-slate-800/50 transition-all duration-150 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/15 dark:group-hover:bg-purple-500/25 transition-colors">
                      <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-medium text-foreground">Settings</span>
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-150 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/15 dark:group-hover:bg-red-500/25 transition-colors">
                      <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
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
          {onOpenAIChat ? (
            <button
              onClick={onOpenAIChat}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:brightness-110 transition"
            >
              Chat with AI
            </button>
          ) : null}
