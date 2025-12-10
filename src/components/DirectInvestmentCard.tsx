'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, ArrowUpRight, Link as LinkIcon } from 'lucide-react'
import { useActivityTracker } from '@/hooks/useActivityTracker'

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
  const { trackDirectInvestmentView, trackClick } = useActivityTracker()

  const handleClick = () => {
    trackClick(`direct-investment-card-${id}`, { investmentId: id, investmentName: name })
    trackDirectInvestmentView(id, { name, industry, stage })
  }

  return (
    <Link href={`/direct-investments/${id}`} onClick={handleClick}>
      <motion.div
        data-tilt
        data-animate
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
        className="glass-panel rounded-2xl border border-border p-6 shadow-xl shadow-black/10 hover:shadow-accent/20 hover:border-accent/40 transition-all cursor-pointer h-full"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-1">{name}</h3>
            <div className="flex items-center gap-2 text-sm text-foreground/60 flex-wrap">
              {industry && <span>{industry}</span>}
              {stage && (
                <>
                  <span>•</span>
                  <span>{stage}</span>
                </>
              )}
              {investmentDate && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(investmentDate)}
                  </span>
                </>
              )}
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-foreground/40 group-hover:text-accent transition-colors" />
        </div>

        <div className="space-y-3">
          {revenue !== null && revenue !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Revenue</span>
              <span className="text-sm font-semibold text-accent">{formatCurrency(revenue)}</span>
            </div>
          )}
          {arr !== null && arr !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">ARR</span>
              <span className="text-sm font-semibold text-foreground">{formatCurrency(arr)}</span>
            </div>
          )}
          {cashBalance !== null && cashBalance !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Cash Balance</span>
              <span className="text-sm font-semibold text-foreground">{formatCurrency(cashBalance)}</span>
            </div>
          )}
          {investmentAmount !== null && investmentAmount !== undefined && (
            <div className="flex justify-between items-center pt-2 border-t border-border/70">
              <span className="text-sm font-medium text-foreground/60">Investment</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(investmentAmount)}</span>
            </div>
          )}
        </div>

        {documentCount > 0 && (
          <div className="mt-4 pt-4 border-t border-border/70 flex items-center gap-2 text-xs text-foreground/60">
            <LinkIcon className="w-3 h-3" />
            <span>
              {documentCount} {documentCount === 1 ? 'document' : 'documents'}
            </span>
          </div>
        )}
      </motion.div>
    </Link>
  )
}

