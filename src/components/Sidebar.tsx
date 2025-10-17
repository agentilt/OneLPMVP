'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Bitcoin, FileText, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview'
  },
  {
    name: 'Funds',
    href: '/funds',
    icon: Briefcase,
    description: 'Portfolio'
  },
  {
    name: 'Crypto',
    href: '/crypto',
    icon: Bitcoin,
    description: 'Digital Assets'
  },
  {
    name: 'Compliance',
    href: '/compliance',
    icon: FileText,
    description: 'Documents'
  },
]

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-72 border-r border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition-transform duration-300 shadow-xl lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          {onClose && (
            <div className="lg:hidden h-16 flex items-center justify-between px-6 border-b border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <span className="font-bold text-foreground">Navigation</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="px-3 mb-4">
              <h2 className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Portfolio</h2>
            </div>
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-accent to-accent-hover text-white shadow-lg shadow-accent/25'
                      : 'text-foreground/70 hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                  )}
                  
                  {/* Icon */}
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                    isActive 
                      ? 'bg-white/20 shadow-lg' 
                      : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-accent/10 group-hover:scale-110'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-white' : 'text-foreground/60 group-hover:text-accent'
                    )} />
                  </div>
                  
                  {/* Text */}
                  <div className="flex-1">
                    <div className={cn(
                      'font-semibold',
                      isActive ? 'text-white' : 'group-hover:text-accent'
                    )}>
                      {item.name}
                    </div>
                    <div className={cn(
                      'text-xs',
                      isActive ? 'text-white/80' : 'text-foreground/40'
                    )}>
                      {item.description}
                    </div>
                  </div>

                  {/* Arrow indicator for active */}
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer decorative element */}
          <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="px-3 py-4 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover shadow-lg shadow-accent/25 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">EuroLP Portal</p>
                  <p className="text-[10px] text-foreground/50">v1.0.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

