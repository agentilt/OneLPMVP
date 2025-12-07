'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, FileText, X, Building2, Activity, BarChart3, Shield, Target, Calendar, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()

  const sections = useMemo(() => [
    {
      title: 'Overview',
      items: [{ name: 'Home', href: '/dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Portfolio',
      items: [
        { name: 'Funds', href: '/funds', icon: Briefcase },
        { name: 'Direct Investments', href: '/direct-investments', icon: Building2 },
      ],
    },
    {
      title: 'Operations',
      items: [
        { name: 'Cash Flow', href: '/cash-flow', icon: Activity },
        { name: 'Capital Calls', href: '/capital-calls', icon: Calendar },
      ],
    },
    {
      title: 'Analytics & Reports',
      items: [
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Risk', href: '/risk', icon: Shield },
        { name: 'Portfolio Builder', href: '/portfolio-builder', icon: Target },
        { name: 'Reports', href: '/reports', icon: FileText },
      ],
    },
    {
      title: 'Explore',
      items: [{ name: 'Search', href: '/search', icon: Search }],
    },
  ], [])

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-[radial-gradient(circle_at_20%_18%,rgba(124,93,255,0.16),transparent_42%),radial-gradient(circle_at_82%_14%,rgba(83,201,255,0.16),transparent_46%),linear-gradient(185deg,#070a16_0%,#0b1124_50%,#070a16_100%)] border-r border-border/60 shadow-[0_32px_90px_rgba(5,10,30,0.55)] backdrop-blur-2xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="px-5 pt-5 pb-3 border-b border-border/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[radial-gradient(circle_at_35%_35%,rgba(107,220,255,0.22),transparent_55%),linear-gradient(135deg,#7c5bff,#6bdcff_55%,#2cf3c7)] shadow-lg shadow-accent/25 flex items-center justify-center text-white ring-1 ring-white/10">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/60">
                    LP Operating System
                  </p>
                  <p className="text-lg font-bold text-foreground">Navigation</p>
                </div>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="lg:hidden p-2 rounded-2xl bg-white/10 border border-border/70 hover:border-accent/60 transition-all duration-200 shadow-sm hover:shadow-lg"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/80 border border-border text-[11px] font-semibold text-foreground/80 backdrop-blur">
                <Sparkles className="w-4 h-4 text-accent" />
                Copilot ready
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/80 border border-border text-[11px] font-semibold text-foreground/80 backdrop-blur">
                <Search className="w-4 h-4 text-foreground/60" />
                Cmd/Ctrl + K
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5 space-y-4 overflow-y-auto">
            {sections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="px-1 text-[11px] uppercase tracking-[0.16em] text-foreground/50 font-semibold">
                  {section.title}
                </p>
                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'))
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'group flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 border backdrop-blur',
                          isActive
                            ? 'bg-gradient-to-r from-accent/20 via-accent/12 to-accent/8 border-accent/50 text-foreground shadow-lg shadow-accent/25'
                            : 'border-transparent bg-white/5 hover:border-border/60 hover:shadow-md text-foreground/80'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 border bg-surface/80 backdrop-blur',
                          isActive ? 'border-white/50' : 'border-border group-hover:border-accent/40'
                        )}>
                          <Icon className={cn(
                            'w-4 h-4 transition-colors duration-150',
                            isActive ? 'text-accent' : 'text-foreground/70 group-hover:text-accent'
                          )} />
                        </div>
                        <span className="flex-1">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4">
            <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/18 via-accent/10 to-accent-hover/18 text-foreground shadow-lg shadow-accent/25 p-4 backdrop-blur space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-accent" />
                Copilot
              </div>
              <p className="text-xs text-foreground/70">
                Ask for signals, cash actions, allocations, or docs.
              </p>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-global-ai-chat'))
                  }
                  onClose?.()
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/85 text-sm font-semibold text-foreground border border-white/60 shadow-sm hover:shadow-lg transition-all"
              >
                Launch copilot
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
