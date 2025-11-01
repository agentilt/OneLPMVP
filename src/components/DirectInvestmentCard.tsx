'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import { TrendingUp, Building2, Calendar, ArrowUpRight, Tag } from 'lucide-react'

interface DirectInvestmentCardProps {
  id: string
  name: string
  industry?: string | null
  stage?: string | null
  investmentDate?: Date | string | null
  investmentAmount?: number | null
  revenue?: number | null
  arr?: number | null
  mrr?: number | null
  cashBalance?: number | null
  lastReportDate?: Date | string | null
  documentCount?: number
}

export function DirectInvestmentCard({
  id,
  name,
  industry,
  stage,
  investmentDate,
  investmentAmount,
  revenue,
  arr,
  mrr,
  cashBalance,
  lastReportDate,
  documentCount = 0,
}: DirectInvestmentCardProps) {
  return (
    <Link href={`/direct-investments/${id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
        className="group relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-2xl hover:border-accent/30 transition-all duration-200 cursor-pointer overflow-hidden"
      >
        {/* Background Gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        {/* Header */}
        <div className="relative mb-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-bold text-lg group-hover:text-accent transition-colors flex-1">{name}</h3>
            <ArrowUpRight className="w-5 h-5 text-foreground/40 group-hover:text-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
          </div>
          
          <div className="flex items-center gap-3 text-xs text-foreground/60 mb-2 flex-wrap">
            {industry && (
              <>
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span className="font-medium">{industry}</span>
                </div>
                <span className="text-foreground/30">•</span>
              </>
            )}
            {stage && (
              <>
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span className="font-medium">{stage}</span>
                </div>
                {investmentDate && <span className="text-foreground/30">•</span>}
              </>
            )}
            {investmentDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span className="font-medium">{formatDate(investmentDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        {investmentAmount && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-bold">{formatCurrency(investmentAmount)} Invested</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {revenue !== null && revenue !== undefined && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Revenue</div>
              <div className="text-base font-bold">{formatCurrency(revenue)}</div>
            </div>
          )}
          {arr !== null && arr !== undefined && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">ARR</div>
              <div className="text-base font-bold">{formatCurrency(arr)}</div>
            </div>
          )}
          {mrr !== null && mrr !== undefined && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">MRR</div>
              <div className="text-base font-bold">{formatCurrency(mrr)}</div>
            </div>
          )}
          {cashBalance !== null && cashBalance !== undefined && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Cash Balance</div>
              <div className="text-base font-bold text-accent">{formatCurrency(cashBalance)}</div>
            </div>
          )}
        </div>

        {/* If no metrics, show placeholder */}
        {!revenue && !arr && !mrr && !cashBalance && (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
            <p className="text-sm text-foreground/60">No metrics available</p>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-4"></div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-foreground/60 font-medium">
            {documentCount} {documentCount === 1 ? 'Document' : 'Documents'}
          </div>
          {lastReportDate && (
            <div className="text-foreground/50">
              Updated {formatDate(lastReportDate)}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}

