'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Briefcase, FileUp, Settings, X, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Funds',
    href: '/admin/funds',
    icon: Briefcase,
  },
  {
    name: 'Documents',
    href: '/admin/documents',
    icon: FileUp,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

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
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-r border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-black/5 dark:shadow-black/20 transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-foreground">Admin Panel</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-8 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                    isActive
                      ? 'bg-gradient-to-r from-accent to-accent/90 text-white shadow-lg shadow-accent/25'
                      : 'text-foreground hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-accent/30'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110',
                    isActive
                      ? 'bg-white/20 shadow-white/20'
                      : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20 group-hover:from-accent group-hover:to-accent/80 group-hover:shadow-accent/20'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5 transition-colors duration-200',
                      isActive ? 'text-white' : 'text-white group-hover:text-white'
                    )} />
                  </div>
                  <span className="flex-1">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Back to user portal */}
          <div className="p-6 border-t border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50 dark:from-slate-800/50 dark:via-transparent dark:to-slate-800/50">
            <Link
              href="/dashboard"
              className="group flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
              <span className="text-foreground">Back to Portal</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}

