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
          className="fixed inset-0 bg-surface/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 lg:top-[4.5rem] left-0 z-40 h-screen lg:h-[calc(100vh-4.5rem)] w-72 glass-panel-soft border border-border shadow-2xl shadow-black/15 transition-transform duration-300 overflow-hidden backdrop-blur',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full relative z-10">
          <div className="px-5 pt-4 pb-2 border-b border-border/80 flex items-center justify-end bg-[var(--surface)]/70 backdrop-blur">
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-2xl bg-[var(--surface)] border border-border/70 hover:border-accent/60 transition-all duration-200 shadow-sm hover:shadow-lg"
                aria-label="Close menu"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            )}
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
                      (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/')) ||
                      (item.href === '/analytics' && (
                        pathname?.startsWith('/risk') ||
                        pathname?.startsWith('/forecasting') ||
                        pathname?.startsWith('/portfolio-builder')
                      ))
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'group flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 border backdrop-blur',
                          isActive
                            ? 'bg-accent/12 border-accent/20 text-foreground shadow-md shadow-accent/18'
                            : 'border-border bg-[var(--surface)]/90 hover:border-accent/12 hover:bg-[var(--surface-hover)]/90 hover:shadow-sm text-foreground'
                        )}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 glass-panel border border-border/60">
                          <Icon
                            className={cn(
                              'w-4 h-4 transition-colors duration-150 drop-shadow',
                              isActive ? 'text-accent' : 'text-foreground/85 group-hover:text-accent'
                            )}
                          />
                        </div>
                        <span className="flex-1">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4" />
        </div>
      </aside>
    </>
  )
}
