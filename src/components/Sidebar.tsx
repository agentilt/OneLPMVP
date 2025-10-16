'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Bitcoin, FileText, X } from 'lucide-react'
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
  },
  {
    name: 'Funds',
    href: '/funds',
    icon: Briefcase,
  },
  {
    name: 'Crypto',
    href: '/crypto',
    icon: Bitcoin,
  },
  {
    name: 'KYC Documents',
    href: '/kyc',
    icon: FileText,
  },
]

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
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
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 border-r bg-background transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          {onClose && (
            <div className="lg:hidden h-16 flex items-center justify-between px-4 border-b">
              <span className="font-bold">Menu</span>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-foreground text-background'
                      : 'text-foreground hover:bg-black/5 dark:hover:bg-white/10'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}

