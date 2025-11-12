'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { FundCard } from '@/components/FundCard'
import { FundSnapshotCard } from '@/components/FundSnapshotCard'
import { formatCurrency, formatMultiple } from '@/lib/utils'
import Link from 'next/link'
import { Plus, TrendingUp, Briefcase, DollarSign, AlertCircle, FileText, Users, Building2, ArrowUpRight, Zap } from 'lucide-react'
import { DirectInvestmentCard } from '@/components/DirectInvestmentCard'
import { motion } from 'framer-motion'

interface Fund {
  id: string
  name: string
  domicile: string
  vintage: number
  manager: string
  managerEmail?: string | null
  managerPhone?: string | null
  managerWebsite?: string | null
  commitment: number
  paidIn: number
  nav: number
  tvpi: number
  dpi: number
  lastReportDate: Date
  navHistory: { date: Date; nav: number }[]
}

interface PortfolioSummary {
  combinedCommitment: number
  combinedNav: number
  combinedTvpi: number
  activeCapitalCalls: number
  fundCommitment: number
  fundNav: number
  fundPaidIn: number
  fundTvpi: number
  directInvestmentAmount: number
  directInvestmentValue: number
}

interface DirectInvestment {
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
  documents: { id: string }[]
}

interface DirectInvestmentsSummary {
  totalInvestmentAmount: number
  totalRevenue: number
  totalARR: number
  count: number
}

interface DashboardClientProps {
  funds: Fund[]
  portfolioSummary: PortfolioSummary
  directInvestments: DirectInvestment[]
  directInvestmentsSummary: DirectInvestmentsSummary
  userRole: string
  userFirstName: string
}

export function DashboardClient({
  funds,
  portfolioSummary,
  directInvestments,
  directInvestmentsSummary,
  userRole,
  userFirstName,
}: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Animated Greeting */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
             
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    Welcome back, {userFirstName}
                  </motion.span>
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-sm text-foreground/60 mt-0.5"
                >
                  Here's your portfolio performance summary
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Admin link */}
          {userRole === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-6"
            >
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Building2 className="w-5 h-5" />
                Admin Panel
                <ArrowUpRight className="w-4 h-4 ml-auto" />
              </Link>
            </motion.div>
          )}

          {/* Data Manager link */}
          {userRole === 'DATA_MANAGER' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-6"
            >
              <Link
                href="/data-manager"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Users className="w-5 h-5" />
                Data Manager
                <ArrowUpRight className="w-4 h-4 ml-auto" />
              </Link>
            </motion.div>
          )}

          {/* Portfolio Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-6">Portfolio Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">
                  Total Commitments
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(portfolioSummary.combinedCommitment)}
                </div>
                <div className="text-xs text-foreground/50 mt-2">
                  Funds {formatCurrency(portfolioSummary.fundCommitment)} • Direct{' '}
                  {formatCurrency(portfolioSummary.directInvestmentAmount)}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">
                  Total NAV
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(portfolioSummary.combinedNav)}
                </div>
                <div className="text-xs text-foreground/50 mt-2">
                  Funds {formatCurrency(portfolioSummary.fundNav)} • Direct{' '}
                  {formatCurrency(portfolioSummary.directInvestmentValue)}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  
                </div>
                <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">
                  Portfolio TVPI
                </div>
                <div className="text-2xl font-bold">
                  {formatMultiple(portfolioSummary.combinedTvpi)}
                </div>
                <div className="text-xs text-foreground/50 mt-2">
                  Funds {formatMultiple(portfolioSummary.fundTvpi)}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.4 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  {portfolioSummary.activeCapitalCalls > 0 && (
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  )}
                </div>
                <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">
                  Active Capital Calls
                </div>
                <div className="text-2xl font-bold">
                  {portfolioSummary.activeCapitalCalls}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Funds Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Fund Investments</h2>
              <div className="flex items-center gap-4">
                <Link
                  href="/funds"
                  className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <div className="text-sm text-foreground/60">
                  {funds.length} {funds.length === 1 ? 'Fund' : 'Funds'}
                </div>
              </div>
            </div>
            {funds.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {funds.slice(0, 3).map((fund, index) => (
                  <motion.div
                    key={fund.id}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.2 + index * 0.1, duration: 0.4 }}
                  >
                    <FundCard {...fund} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-12 text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-foreground/80 font-medium mb-2">No Funds Available</p>
                <p className="text-foreground/60 text-sm">
                  You don't have access to any funds yet. Please contact your fund manager.
                </p>
              </div>
            )}
            {funds.length > 3 && (
              <div className="mt-6 text-center">
                <Link
                  href="/funds"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                >
                  View All {funds.length} Funds
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </motion.div>

          {/* Direct Investments Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Direct Investments</h2>
              <div className="flex items-center gap-4">
                <Link
                  href="/direct-investments"
                  className="text-sm text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <div className="text-sm text-foreground/60">
                  {directInvestments.length} {directInvestments.length === 1 ? 'Investment' : 'Investments'}
                </div>
              </div>
            </div>
            {directInvestments.length > 0 ? (
              <>
                {/* Direct Investments Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4, duration: 0.4 }}
                    className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10 rounded-xl border border-purple-200/60 dark:border-purple-800/60 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                        Total Invested
                      </div>
                    </div>
                    <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                      {formatCurrency(directInvestmentsSummary.totalInvestmentAmount)}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.5, duration: 0.4 }}
                    className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl border border-blue-200/60 dark:border-blue-800/60 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                        Total Revenue
                      </div>
                    </div>
                    <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                      {formatCurrency(directInvestmentsSummary.totalRevenue)}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.6, duration: 0.4 }}
                    className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                        Total ARR
                      </div>
                    </div>
                    <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(directInvestmentsSummary.totalARR)}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.7, duration: 0.4 }}
                    className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 rounded-xl border border-amber-200/60 dark:border-amber-800/60 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                        Portfolio Companies
                      </div>
                    </div>
                    <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                      {directInvestmentsSummary.count}
                    </div>
                  </motion.div>
                </div>

                {/* Direct Investments Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {directInvestments.slice(0, 6).map((investment, index) => (
                    <motion.div
                      key={investment.id}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.8 + index * 0.1, duration: 0.4 }}
                    >
                      <DirectInvestmentCard
                        {...investment}
                        documentCount={investment.documents.length}
                      />
                    </motion.div>
                  ))}
                </div>
                
                {directInvestments.length > 6 && (
                  <div className="mt-6 text-center">
                    <Link
                      href="/direct-investments"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
                    >
                      View All {directInvestments.length} Direct Investments
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </>
            {funds.length > 3 && (
              <div className="mt-6 text-center">
                <Link
                  href="/funds"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                >
                  View All {funds.length} Funds
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            )}
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-12 text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-foreground/80 font-medium mb-2">No Direct Investments Available</p>
                <p className="text-foreground/60 text-sm">
                  You don't have any direct investments yet.
                </p>
              </div>
            )}
          </motion.div>


          {/* Quick Actions - Only show for admins */}
          {userRole === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.8, duration: 0.4 }}
                >
                  <Link
                    href="/admin/documents/upload"
                    className="group relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 block overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="font-bold text-lg mb-2 group-hover:text-accent transition-colors">
                        Upload Document
                      </div>
                      <div className="text-sm text-foreground/60 leading-relaxed">
                        Upload capital calls, reports, and other documents
                      </div>
                    </div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.9, duration: 0.4 }}
                >
                  <Link
                    href="/admin/users"
                    className="group relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 block overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full"></div>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="font-bold text-lg mb-2 group-hover:text-accent transition-colors">
                        Manage Users
                      </div>
                      <div className="text-sm text-foreground/60 leading-relaxed">
                        Invite users and manage fund access
                      </div>
                    </div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.0, duration: 0.4 }}
                >
                  <Link
                    href="/admin/funds/new"
                    className="group relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-800/60 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 block overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full"></div>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <div className="font-bold text-lg mb-2 group-hover:text-accent transition-colors">
                        Create Fund
                      </div>
                      <div className="text-sm text-foreground/60 leading-relaxed">
                        Add a new fund to the platform
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}

