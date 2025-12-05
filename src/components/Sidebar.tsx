'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, FileText, X, Building2, Activity, BarChart3, Shield, TrendingUp, Target, ChevronDown, ChevronRight, Calendar, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

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
  
  if (isAnalyticsChild && !expandedItems.includes('Analytics')) {
    setExpandedItems(prev => [...prev, 'Analytics'])
  }

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
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-surface border-r border-border dark:border-slate-800 shadow-sm transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          {onClose && (
            <div className="lg:hidden h-16 flex items-center justify-between px-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-r from-accent/5 via-accent/2 to-transparent">
              <span className="font-bold text-foreground">Menu</span>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/analytics' && pathname?.startsWith(item.href + '/'))
              const Icon = item.icon
              const hasChildren = item.children && item.children.length > 0
              const isExpanded = expandedItems.includes(item.name)

              return (
                <div key={item.name}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.name)}
                        className={cn(
                          'w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                          isActive || isAnalyticsChild
                            ? 'bg-accent text-white shadow-sm'
                            : 'text-foreground hover:bg-surface-hover dark:hover:bg-slate-800/50'
                        )}
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150',
                          isActive || isAnalyticsChild
                            ? 'bg-white/15'
                            : 'bg-slate-500/10 dark:bg-slate-500/20 group-hover:bg-accent/10'
                        )}>
                          <Icon className={cn(
                            'w-4 h-4 transition-colors duration-150',
                            isActive || isAnalyticsChild ? 'text-white' : 'text-foreground/70 group-hover:text-accent'
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
                        <div className="mt-1 ml-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-1">
                          {item.children?.map((child) => {
                            const isChildActive = pathname === child.href || pathname?.startsWith(child.href + '/')
                            const ChildIcon = child.icon

                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={onClose}
                                className={cn(
                                  'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                                  isChildActive
                                    ? 'bg-accent/10 text-accent dark:text-accent'
                                    : 'text-foreground/70 hover:bg-surface-hover dark:hover:bg-slate-800/50 hover:text-foreground'
                                )}
                              >
                                <ChildIcon className={cn(
                                  'w-4 h-4 transition-colors duration-150',
                                  isChildActive ? 'text-accent' : 'text-foreground/50 group-hover:text-foreground/70'
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
                        'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-accent text-white shadow-sm'
                          : 'text-foreground hover:bg-surface-hover dark:hover:bg-slate-800/50'
                      )}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150',
                        isActive
                          ? 'bg-white/15'
                          : 'bg-slate-500/10 dark:bg-slate-500/20 group-hover:bg-accent/10'
                      )}>
                        <Icon className={cn(
                          'w-4 h-4 transition-colors duration-150',
                          isActive ? 'text-white' : 'text-foreground/70 group-hover:text-accent'
                        )} />
                      </div>
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
