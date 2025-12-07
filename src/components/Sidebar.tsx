'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, FileText, X, Building2, Activity, BarChart3, Shield, TrendingUp, Target, ChevronDown, ChevronRight, Calendar, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Funds',
    href: '/funds',
    icon: Briefcase,
  },
  {
    name: 'Direct Investments',
    href: '/direct-investments',
    icon: Building2,
  },
  {
    name: 'Cash Flow',
    href: '/cash-flow',
    icon: Activity,
  },
  {
    name: 'Capital Calls',
    href: '/capital-calls',
    icon: Calendar,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    children: [
      {
        name: 'Overview',
        href: '/analytics',
        icon: BarChart3,
      },
      {
        name: 'Risk Management',
        href: '/risk',
        icon: Shield,
      },
      {
        name: 'Forecasting',
        href: '/forecasting',
        icon: TrendingUp,
      },
      {
        name: 'Portfolio Builder',
        href: '/portfolio-builder',
        icon: Target,
      },
    ],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    name: 'Compliance',
    href: '/compliance',
    icon: FileText,
  },
  {
    name: 'Advanced Search',
    href: '/search',
    icon: Search,
  },
]

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Analytics'])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  // Auto-expand Analytics if on any child page
  const isAnalyticsChild = pathname?.startsWith('/risk') || 
    pathname?.startsWith('/forecasting') || 
    pathname?.startsWith('/portfolio-builder')
  
  useEffect(() => {
    if (isAnalyticsChild && !expandedItems.includes('Analytics')) {
      setExpandedItems(prev => [...prev, 'Analytics'])
    }
  }, [isAnalyticsChild, expandedItems])

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
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white/80 dark:bg-surface/90 backdrop-blur-2xl border-r border-white/70 dark:border-white/10 shadow-[0_30px_90px_rgba(12,26,75,0.16)] transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="px-5 pt-5 pb-3 border-b border-border/70 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent via-accent-hover to-accent shadow-lg shadow-accent/25 flex items-center justify-center text-white">
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
                  className="lg:hidden p-2 rounded-2xl bg-white/70 dark:bg-white/5 border border-border/80 hover:border-accent/60 transition-all duration-200 shadow-sm"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-[11px] font-semibold text-foreground/80">
                <Sparkles className="w-4 h-4 text-accent" />
                AI briefs on
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-[11px] font-semibold text-foreground/80">
                <Search className="w-4 h-4 text-foreground/60" />
                Cmd/Ctrl + K
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/analytics' && pathname?.startsWith(item.href + '/'))
              const Icon = item.icon
              const hasChildren = item.children && item.children.length > 0
              const isExpanded = expandedItems.includes(item.name)

              return (
                <div key={item.name} className="space-y-1">
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.name)}
                        className={cn(
                          'w-full group flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 border',
                          isActive || isAnalyticsChild
                            ? 'bg-gradient-to-r from-accent/15 via-accent/10 to-accent/5 border-accent/40 shadow-lg shadow-accent/20 text-foreground'
                            : 'border-transparent bg-white/70 dark:bg-white/5 hover:border-border hover:shadow-md'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 border',
                          isActive || isAnalyticsChild
                            ? 'bg-white/60 dark:bg-white/10 border-white/40'
                            : 'bg-surface border-border group-hover:border-accent/40'
                        )}>
                          <Icon className={cn(
                            'w-4 h-4 transition-colors duration-150',
                            isActive || isAnalyticsChild ? 'text-accent' : 'text-foreground/70 group-hover:text-accent'
                          )} />
                        </div>
                        <span className="flex-1 text-left">{item.name}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="mt-1 ml-4 pl-4 border-l border-border/60 dark:border-white/10 space-y-1">
                          {item.children?.map((child) => {
                            const isChildActive = pathname === child.href || pathname?.startsWith(child.href + '/')
                            const ChildIcon = child.icon

                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={onClose}
                                className={cn(
                                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border',
                                  isChildActive
                                    ? 'bg-accent/10 border-accent/30 text-accent shadow-sm'
                                    : 'border-transparent hover:border-border hover:bg-surface'
                                )}
                              >
                                <ChildIcon className={cn(
                                  'w-4 h-4 transition-colors duration-150',
                                  isChildActive ? 'text-accent' : 'text-foreground/50 group-hover:text-foreground/80'
                                )} />
                                <span className="flex-1">{child.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'group flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 border',
                        isActive
                          ? 'bg-gradient-to-r from-accent/15 via-accent/10 to-accent/5 border-accent/40 shadow-lg shadow-accent/20 text-foreground'
                          : 'border-transparent bg-white/70 dark:bg-white/5 hover:border-border hover:shadow-md'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 border',
                        isActive
                          ? 'bg-white/60 dark:bg-white/10 border-white/40'
                          : 'bg-surface border-border group-hover:border-accent/40'
                      )}>
                        <Icon className={cn(
                          'w-4 h-4 transition-colors duration-150',
                          isActive ? 'text-accent' : 'text-foreground/70 group-hover:text-accent'
                        )} />
                      </div>
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="p-4">
            <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/20 via-accent/10 to-accent-hover/20 text-foreground shadow-lg shadow-accent/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-accent" />
                AI Signal Desk
              </div>
              <p className="text-xs text-foreground/70 mt-2">
                Get proactive calls to action from copilot across risk, cash, and allocations.
              </p>
              <Link
                href="/analytics"
                onClick={onClose}
                className="mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/80 text-sm font-semibold text-foreground border border-white/60 shadow-sm hover:shadow-lg transition-all"
              >
                Open analytics
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
