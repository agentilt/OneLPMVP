'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Briefcase, FileUp, Settings, X, ArrowLeft, Building2 } from 'lucide-react'
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
    name: 'Direct Investments',
    href: '/admin/direct-investments',
    icon: Building2,
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
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[radial-gradient(circle_at_18%_18%,rgba(124,93,255,0.12),transparent_42%),radial-gradient(circle_at_86%_12%,rgba(83,201,255,0.12),transparent_48%),linear-gradient(180deg,#070a16_0%,#0b1124_45%,#070a16_100%)] border-r border-border/60 shadow-[0_24px_80px_rgba(5,10,30,0.5)] backdrop-blur-2xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border/60 bg-gradient-to-r from-white/8 via-white/4 to-transparent backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[radial-gradient(circle_at_35%_35%,rgba(107,220,255,0.22),transparent_55%),linear-gradient(135deg,#7c5bff,#6bdcff_55%,#2cf3c7)] flex items-center justify-center shadow-lg shadow-accent/25 ring-1 ring-white/10">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-foreground">Admin Panel</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-xl border border-border/70 bg-white/5 hover:border-accent/40 transition-all duration-200 hover:scale-105 active:scale-95"
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
                    'group flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-transparent backdrop-blur',
                    isActive
                      ? 'bg-gradient-to-r from-accent/20 via-accent/15 to-accent/10 text-foreground border-accent/40 shadow-lg shadow-accent/25'
                      : 'text-foreground hover:bg-white/5 hover:border-border/60'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110 border border-border/60 bg-surface/80',
                    isActive
                      ? 'bg-white/20 shadow-white/20'
                      : 'group-hover:border-accent/40 group-hover:shadow-accent/15'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5 transition-colors duration-200',
                      isActive ? 'text-accent' : 'text-foreground group-hover:text-accent'
                    )} />
                  </div>
                  <span className="flex-1">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Back to user portal */}
          <div className="p-6 border-t border-border/60 bg-gradient-to-r from-white/8 via-transparent to-white/8 backdrop-blur-xl">
            <Link
              href="/dashboard"
              className="group flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl border border-border/60 hover:border-accent/40 hover:bg-white/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-lg bg-[radial-gradient(circle_at_35%_35%,rgba(107,220,255,0.22),transparent_55%),linear-gradient(135deg,#7c5bff,#6bdcff)] flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
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

