'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Menu, LogOut, User, Settings, Search, Sparkles, Command } from 'lucide-react'
import Link from 'next/link'

interface TopbarProps {
  onMenuClick?: () => void
  onOpenAIChat?: () => void
}

const NAV_LINKS = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Portfolio', href: '/funds' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Operations', href: '/cash-flow' },
  { label: 'Search', href: '/search' },
]

export function Topbar({ onMenuClick, onOpenAIChat }: TopbarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
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
    <header className="sticky top-0 z-50">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_10%_20%,rgba(124,93,255,0.16),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(83,201,255,0.12),transparent_38%),linear-gradient(90deg,rgba(107,220,255,0.08),transparent,rgba(124,93,255,0.08))] blur-2xl" />
      <div className="relative h-20 px-4 sm:px-6 lg:px-10 flex items-center justify-between border-b border-border/60 bg-white/85 dark:bg-surface/85 backdrop-blur-2xl shadow-[0_22px_70px_rgba(5,10,30,0.32)] rounded-b-2xl">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-2xl bg-white/70 dark:bg-white/5 border border-border/70 hover:border-accent/50 transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          )}
          <Link href="/dashboard" className="group flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(107,220,255,0.22),transparent_55%),linear-gradient(135deg,#7c5bff,#6bdcff_55%,#2cf3c7)] shadow-lg shadow-accent/30 flex items-center justify-center text-white ring-1 ring-white/10">
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
          <div className="hidden lg:flex items-center gap-1 ml-4">
            {NAV_LINKS.map((link, idx) => {
              const isActive = pathname?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-all border ${
                    isActive
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/30'
                      : 'bg-white/60 dark:bg-white/5 border-border/70 text-foreground/70 hover:text-foreground hover:border-accent/40'
                  } ${idx === 0 ? '' : 'ml-1'}`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/80 dark:bg-surface/80 border border-border/70 shadow-sm hover:shadow-lg hover:border-accent/50 transition-all backdrop-blur">
            <Search className="w-4 h-4 text-foreground/60" />
            <input
              onFocus={openSearch}
              placeholder="Search across OneLP... ⌘K"
              className="bg-transparent outline-none text-sm text-foreground placeholder:text-foreground/50 w-40"
              readOnly
            />
          </div>

          <button
            onClick={openCopilot}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-accent to-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/30 hover:-translate-y-0.5 transition-all ring-1 ring-white/10"
          >
            <Command className="w-4 h-4" />
            Copilot
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-white/80 dark:bg-surface/80 border border-border hover:border-accent/60 transition-all duration-150 shadow-sm hover:shadow-md backdrop-blur"
            >
              <div className="w-9 h-9 rounded-xl bg-[radial-gradient(circle_at_35%_35%,rgba(107,220,255,0.25),transparent_60%),linear-gradient(135deg,#7c5bff,#6bdcff)] flex items-center justify-center ring-1 ring-white/15">
                <User className="w-4 h-4 text-accent" />
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-foreground">
                {session?.user?.name || session?.user?.email?.split('@')[0]}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white/90 dark:bg-surface/95 backdrop-blur-xl border border-border dark:border-white/10 rounded-2xl shadow-[0_30px_90px_rgba(5,10,30,0.55)] z-50 py-2 overflow-hidden">
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
