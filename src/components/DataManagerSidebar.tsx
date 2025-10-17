'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, X, ArrowLeft, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataManagerSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navigation = [
  {
    name: 'Overview',
    href: '/data-manager',
    icon: LayoutDashboard,
    description: 'Dashboard'
  },
  {
    name: 'Manage Users',
    href: '/data-manager/users',
    icon: Users,
    description: 'User Access'
  },
]

export function DataManagerSidebar({ isOpen = true, onClose }: DataManagerSidebarProps) {
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
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-foreground">Data Manager</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="px-3 mb-4">
              <h2 className="text-xs font-bold text-foreground/40 uppercase tracking-wider">Operations</h2>
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
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
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
                      : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-500/10 group-hover:scale-110'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-white' : 'text-foreground/60 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    )} />
                  </div>
                  
                  {/* Text */}
                  <div className="flex-1">
                    <div className={cn(
                      'font-semibold',
                      isActive ? 'text-white' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
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

          {/* Back to user portal */}
          <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-accent/10 transition-all">
                <ArrowLeft className="w-5 h-5 text-foreground/60 group-hover:text-accent transition-colors" />
              </div>
              <span className="group-hover:text-accent transition-colors">Back to Portal</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}

