'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { 
  Search, 
  LayoutDashboard, 
  Briefcase, 
  Building2, 
  FileText, 
  Settings, 
  LogOut,
  Users,
  Activity,
  Plus,
  Upload,
  Moon,
  Sun,
  BarChart3
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import './command-palette.css'

interface CommandPaletteProps {
  userRole?: string
}

export function CommandPalette({ userRole }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Navigate and close
  const navigate = useCallback((path: string) => {
    setOpen(false)
    setSearch('')
    router.push(path)
  }, [router])

  // Theme toggle
  const toggleTheme = useCallback(() => {
    const html = document.documentElement
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light'
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    
    if (newTheme === 'dark') {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    
    setOpen(false)
  }, [])

  // Sign out
  const handleSignOut = useCallback(async () => {
    setOpen(false)
    await signOut({ callbackUrl: '/login' })
  }, [])

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', keywords: 'home overview' },
    { icon: Briefcase, label: 'Funds', path: '/funds', keywords: 'investments portfolio' },
    { icon: Building2, label: 'Direct Investments', path: '/direct-investments', keywords: 'private equity companies' },
    { icon: Activity, label: 'Cash Flow', path: '/cash-flow', keywords: 'transactions payments' },
    { icon: BarChart3, label: 'Reports & Analytics', path: '/reports', keywords: 'reporting data analysis charts' },
    { icon: FileText, label: 'Compliance & Regulatory', path: '/compliance', keywords: 'documents legal reports' },
    { icon: Settings, label: 'Settings', path: '/settings', keywords: 'preferences account profile' },
  ]

  const adminItems = userRole === 'ADMIN' ? [
    { icon: Users, label: 'Admin Panel', path: '/admin', keywords: 'manage users control' },
    { icon: Upload, label: 'Upload Document', path: '/admin/documents/upload', keywords: 'files capital calls' },
    { icon: Users, label: 'Manage Users', path: '/admin/users', keywords: 'invite access permissions' },
    { icon: Plus, label: 'Create Fund', path: '/admin/funds/new', keywords: 'add new fund' },
  ] : []

  const dataManagerItems = userRole === 'DATA_MANAGER' ? [
    { icon: Users, label: 'Data Manager', path: '/data-manager', keywords: 'manage data' },
  ] : []

  const actionItems = [
    { icon: Moon, label: 'Toggle Dark Mode', action: toggleTheme, keywords: 'theme appearance light' },
    { icon: LogOut, label: 'Sign Out', action: handleSignOut, keywords: 'logout exit' },
  ]

  return (
    <>
      {/* Trigger Button (optional - can be placed in Topbar) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-surface dark:bg-slate-800 border border-border dark:border-slate-700 text-sm text-foreground/60 hover:text-foreground hover:bg-surface-hover dark:hover:bg-slate-700 transition-all duration-150"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-auto px-2 py-0.5 text-xs font-semibold text-foreground/50 bg-white dark:bg-slate-900 border border-border dark:border-slate-700 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Command Palette Modal */}
      <Command.Dialog 
        open={open} 
        onOpenChange={setOpen}
        label="Global Command Menu"
        className="command-palette"
      >
        <div className="command-palette-content" data-animate data-tilt data-delay="0.05s">
          {/* Search Input */}
          <div className="command-search-wrapper">
            <Search className="command-search-icon" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="command-input"
            />
          </div>

          {/* Results */}
          <Command.List className="command-list">
            <Command.Empty className="command-empty">
              No results found for "{search}"
            </Command.Empty>

            {/* Navigation Section */}
            <Command.Group heading="Navigation" className="command-group">
              {navigationItems.map((item) => (
                <Command.Item
                  data-tilt
                  key={item.path}
                  value={`${item.label} ${item.keywords}`}
                  onSelect={() => navigate(item.path)}
                  className="command-item"
                >
                  <item.icon className="command-item-icon" />
                  <span className="command-item-label">{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Admin Actions */}
            {adminItems.length > 0 && (
              <Command.Group heading="Admin" className="command-group">
                {adminItems.map((item) => (
                  <Command.Item
                    data-tilt
                    key={item.path}
                    value={`${item.label} ${item.keywords}`}
                    onSelect={() => navigate(item.path)}
                    className="command-item"
                  >
                    <item.icon className="command-item-icon" />
                    <span className="command-item-label">{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Data Manager Actions */}
            {dataManagerItems.length > 0 && (
              <Command.Group heading="Data Manager" className="command-group">
                {dataManagerItems.map((item) => (
                  <Command.Item
                    data-tilt
                    key={item.path}
                    value={`${item.label} ${item.keywords}`}
                    onSelect={() => navigate(item.path)}
                    className="command-item"
                  >
                    <item.icon className="command-item-icon" />
                    <span className="command-item-label">{item.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Actions */}
            <Command.Group heading="Actions" className="command-group">
              {actionItems.map((item) => (
                <Command.Item
                  data-tilt
                  key={item.label}
                  value={`${item.label} ${item.keywords}`}
                  onSelect={() => item.action()}
                  className="command-item"
                >
                  <item.icon className="command-item-icon" />
                  <span className="command-item-label">{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer with shortcuts */}
          <div className="command-footer">
            <div className="command-footer-shortcuts">
              <span className="command-footer-hint">
                <kbd>↑↓</kbd> Navigate
              </span>
              <span className="command-footer-hint">
                <kbd>↵</kbd> Select
              </span>
              <span className="command-footer-hint">
                <kbd>esc</kbd> Close
              </span>
            </div>
          </div>
        </div>
      </Command.Dialog>
    </>
  )
}

