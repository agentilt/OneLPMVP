'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Menu, LogOut, User, Settings, Search, Sparkles, ShieldCheck, Activity, Cpu } from 'lucide-react'
import Link from 'next/link'

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
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface/90 backdrop-blur-2xl border-b border-white/70 dark:border-white/10 shadow-[0_16px_60px_rgba(12,26,75,0.12)]">
      <div className="h-20 px-4 sm:px-6 lg:px-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-2xl bg-white/70 dark:bg-white/5 border border-border/80 hover:border-accent/50 transition-all duration-200 shadow-sm hover:shadow-md"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          )}
          <Link href="/dashboard" className="group flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent via-accent-hover to-accent shadow-lg shadow-accent/30 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
                OneLP OS
              </p>
              <p className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
                Command Center
              </p>
            </div>
          </Link>
          <div className="hidden xl:flex items-center gap-2 pl-4 ml-2 border-l border-border/80">
            {[
              { label: 'AI copilot ready', Icon: Cpu },
              { label: 'Signals live', Icon: Activity },
              { label: 'Secure sync', Icon: ShieldCheck },
            ].map(({ label, Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/90 border border-border/70 text-xs font-semibold text-foreground/80 shadow-sm"
              >
                <Icon className="w-4 h-4 text-accent" />
                {label}
              </span>
            ))}
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
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface border border-border hover:border-accent/60 hover:shadow-lg hover:shadow-accent/15 transition-all duration-150"
          >
            <Search className="w-4 h-4 text-foreground/70" />
            <span className="text-sm font-semibold text-foreground">Search & Navigate</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/5 text-foreground/70 border border-border">
              ⌘K
            </span>
          </button>

          <button
            onClick={() => {
              if (onOpenAIChat) {
                onOpenAIChat()
              } else if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-global-ai-chat'))
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-accent to-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/30 hover:translate-y-[-1px] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Launch Copilot
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-surface border border-border hover:border-accent/60 transition-all duration-150 shadow-sm hover:shadow-md"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/10 via-accent/15 to-accent-hover/20 flex items-center justify-center">
                <User className="w-4 h-4 text-accent" />
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
                <div className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-surface backdrop-blur-xl border border-border dark:border-white/10 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/80 dark:border-white/10">
                    <p className="text-sm font-semibold text-foreground">{session?.user?.name}</p>
                    <p className="text-xs text-foreground/60">{session?.user?.email}</p>
                  </div>
                  
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-surface-hover/80 dark:hover:bg-white/5 transition-all duration-150 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                      <Settings className="w-4 h-4 text-accent" />
                    </div>
                    <span className="font-medium text-foreground">Workspace settings</span>
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-150 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/15 transition-colors">
                      <LogOut className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="font-semibold text-red-600 dark:text-red-400">Sign out</span>
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
