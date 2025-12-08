'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Menu, LogOut, User, Settings, Search, Sparkles, Command, ShieldCheck, Wifi } from 'lucide-react'
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
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
    } catch (error) {
      console.error('Failed to end session:', error)
    }
    signOut({ callbackUrl: '/login' })
  }

  const openSearch = () => {
    if (typeof window === 'undefined') return
    if (typeof (window as any).__ONE_LP_OPEN_SEARCH__ === 'function') {
      ;(window as any).__ONE_LP_OPEN_SEARCH__()
    } else {
      window.dispatchEvent(new CustomEvent('open-global-search'))
    }
  }

  const openCopilot = () => {
    if (onOpenAIChat) {
      onOpenAIChat()
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-global-ai-chat'))
    }
  }

  return (
    <header className="sticky top-0 z-50 relative">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_12%_20%,rgba(124,93,255,0.12),transparent_42%),radial-gradient(circle_at_82%_12%,rgba(83,201,255,0.1),transparent_42%),linear-gradient(90deg,rgba(107,220,255,0.06),transparent,rgba(124,93,255,0.06))] blur-2xl" />
      <div className="relative h-18 sm:h-20 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4 shell-surface rounded-none lg:rounded-br-[28px]">
        <div className="flex items-center gap-3 min-w-0">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-2xl bg-white/75 dark:bg-white/5 border border-border/70 hover:border-accent/50 transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          )}
          <Link href="/dashboard" className="group flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/90 dark:bg-surface/80 shadow-lg shadow-accent/20 ring-1 ring-border flex items-center justify-center overflow-hidden">
              <Image
                src="/onelp-logo.png"
                alt="OneLP logo"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </div>
            <div className="leading-tight truncate">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">OneLP OS</p>
              <p className="text-lg font-bold text-foreground group-hover:text-accent transition-colors truncate">Command Center</p>
            </div>
          </Link>
        </div>

          <div className="flex-1 hidden md:flex items-center gap-3 max-w-3xl">
          <button
            onClick={openSearch}
            className="group flex-1 inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/92 dark:bg-surface/92 border border-border/70 shadow-[0_12px_40px_rgba(5,10,30,0.18)] hover:border-accent/50 hover:shadow-[0_16px_50px_rgba(34,211,238,0.22)] transition-all backdrop-blur text-left"
            aria-label="Open global search (⌘K)"
          >
            <div className="w-9 h-9 rounded-xl bg-[radial-gradient(circle_at_35%_35%,rgba(107,220,255,0.22),transparent_55%),linear-gradient(135deg,#7c5bff,#6bdcff)] flex items-center justify-center ring-1 ring-white/10">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="flex-1 text-sm text-foreground truncate">
              Search funds, directs, docs, signals...
            </span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-foreground/5 text-foreground/80 border border-border/80">
              ⌘K
            </span>
          </button>
          <button
            onClick={openCopilot}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/30 hover:-translate-y-0.5 transition-all ring-1 ring-white/10"
          >
            <Command className="w-4 h-4" />
            Copilot
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <button
              onClick={openSearch}
              className="p-2 rounded-xl bg-white/80 dark:bg-surface/80 border border-border/70 shadow-sm hover:shadow-md transition"
              aria-label="Open search"
            >
              <Search className="w-4 h-4 text-foreground/70" />
            </button>
          </div>
          <button
            onClick={openCopilot}
            className="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/30"
          >
            <Command className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-surface/90 border border-border hover:border-accent/60 transition-all duration-150 shadow-sm hover:shadow-md backdrop-blur text-foreground"
            >
              <div className="w-9 h-9 rounded-xl bg-[radial-gradient(circle_at_35%_35%,rgba(107,220,255,0.18),transparent_60%),linear-gradient(135deg,#0f172a,#334155)] flex items-center justify-center ring-1 ring-white/10">
                <User className="w-4 h-4 text-accent" />
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-foreground">
                {session?.user?.name || session?.user?.email?.split('@')[0]}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white/92 dark:bg-surface/95 backdrop-blur-xl border border-border dark:border-white/10 rounded-2xl shadow-[0_30px_90px_rgba(5,10,30,0.55)] z-50 py-2 overflow-hidden">
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
