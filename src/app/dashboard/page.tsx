'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { TrendingUp, BarChart3, FileText, Shield } from 'lucide-react'

const cards = [
  {
    title: 'Portfolio Snapshot',
    metric: '$24.3M',
    subtitle: 'Total NAV across funds and directs',
    icon: BarChart3,
    href: '/analytics',
    pill: 'Live',
  },
  {
    title: 'Capital Calls Due',
    metric: '$1.2M',
    subtitle: 'Next 30 days across all funds',
    icon: FileText,
    href: '/capital-calls',
    pill: 'Upcoming',
  },
  {
    title: 'Distributions YTD',
    metric: '$4.8M',
    subtitle: 'Cash returned to date',
    icon: TrendingUp,
    href: '/cash-flow',
    pill: 'YTD',
  },
  {
    title: 'Risk Flags',
    metric: '2 open',
    subtitle: 'Policy and liquidity alerts',
    icon: Shield,
    href: '/risk',
    pill: 'Attention',
  },
]

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-6 lg:p-8 space-y-8">
          <header className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground/60 uppercase tracking-wide">
              Overview
            </p>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-foreground/60 mt-1">
                  Quick view of portfolio health, liquidity, and open items.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/analytics"
                  className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:border-accent/50 hover:text-accent transition-colors"
                >
                  Analytics Hub
                </Link>
                <Link
                  href="/reports"
                  className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:brightness-110 transition"
                >
                  Generate Report
                </Link>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group bg-white dark:bg-surface border border-border dark:border-slate-800 rounded-2xl p-5 hover:border-accent/40 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-foreground/70">
                      {card.pill}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">{card.title}</h3>
                  <p className="text-2xl font-bold text-foreground">{card.metric}</p>
                  <p className="text-sm text-foreground/60 mt-1">{card.subtitle}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    View details
                  </span>
                </Link>
              )
            })}
          </section>
        </main>
      </div>
    </div>
  )
}
