'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Bookmark,
  Save,
  Trash2,
  Settings,
  X,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { ExportButton } from '@/components/ExportButton'
import { formatCurrency, formatPercent } from '@/lib/utils'
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  formatCurrencyForExport,
  formatDateForExport,
} from '@/lib/exportUtils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type LegendProps,
} from 'recharts'

interface Fund {
  id: string
  name: string
  manager: string
  vintage: number
  commitment: number
  paidIn: number
  nav: number
  dpi: number
  irr: number
  assetClass: string
}

interface Distribution {
  id: string
  amount: number
  distributionDate: Date
  distributionType: string
  createdAt: Date
  fund: {
    id: string
    name: string
  }
}

interface CapitalCall {
  id: string
  callAmount: number | null
  dueDate: Date | null
  uploadDate: Date
  fund: {
    id: string
    name: string
    vintage: number
  }
}

interface PortfolioMetrics {
  totalCommitment: number
  totalPaidIn: number
  totalNav: number
  unfundedCommitments: number
  totalDistributions: number
}

interface ForecastingClientProps {
  funds: Fund[]
  distributions: Distribution[]
  capitalCalls: CapitalCall[]
  assetClasses: string[]
  savedForecasts: SavedForecast[]
  savedForecastsError?: boolean
  portfolioMetrics: PortfolioMetrics
}

interface SavedForecast {
  id: string
  name: string
  description: string | null
  config: any
  updatedAt: string
}

type ScenarioType = 'base' | 'best' | 'worst'
type TimeHorizon = '1year' | '3years' | '5years'
type FilterMode = 'portfolio' | 'fund' | 'vintage' | 'assetClass'

interface QuarterlyAggregate {
  key: string
  label: string
  amount: number
}

const AGGREGATION_WINDOW = 8
const HISTORY_DISPLAY_WINDOW = 8

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
    const parsed = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const aggregateQuarterlyTotals = <T,>(
  items: T[],
  getAmount: (item: T) => number,
  getDate: (item: T) => Date | null
): QuarterlyAggregate[] => {
  const totals = new Map<string, { label: string; amount: number; sortValue: number }>()

  items.forEach((item) => {
    const date = getDate(item)
    const amount = getAmount(item)
    if (!date || !isFinite(amount)) return

    const year = date.getFullYear()
    const quarter = Math.floor(date.getMonth() / 3) + 1
    const key = `${year}-Q${quarter}`
    const label = `Q${quarter} ${year}`
    const existing = totals.get(key)
    if (existing) {
      existing.amount += amount
    } else {
      totals.set(key, {
        label,
        amount,
        sortValue: year * 4 + quarter,
      })
    }
  })

  return Array.from(totals.entries())
    .sort((a, b) => a[1].sortValue - b[1].sortValue)
    .map(([key, value]) => ({ key, label: value.label, amount: value.amount }))
}

const getPeriodOrder = (period: string) => {
  const [quarterPart, yearPart] = period.split(' ')
  const quarter = Number(quarterPart?.replace('Q', '')) || 0
  const year = Number(yearPart) || 0
  return year * 4 + quarter
}

const getPeriodLabelFromOrder = (order: number) => {
  const quarter = order % 4 || 4
  const year = (order - quarter) / 4
  return `Q${quarter} ${year}`
}

const getCurrentQuarterOrder = () => {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3) + 1
  return now.getFullYear() * 4 + quarter
}

export function ForecastingClient({
  funds,
  distributions,
  capitalCalls,
  assetClasses,
  savedForecasts,
  savedForecastsError = false,
  portfolioMetrics,
}: ForecastingClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [scenario, setScenario] = useState<ScenarioType>('base')
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('3years')
  const [activeTab, setActiveTab] = useState<'capital' | 'distributions' | 'net' | 'liquidity'>('capital')
  const [filterMode, setFilterMode] = useState<FilterMode>('portfolio')
  const [selectedFundId, setSelectedFundId] = useState<string>('all')
  const [selectedVintage, setSelectedVintage] = useState<number | 'all'>('all')
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>('all')
  const [customDeploymentMultiplier, setCustomDeploymentMultiplier] = useState(1)
  const [customDistributionMultiplier, setCustomDistributionMultiplier] = useState(1)
  const [customDpiGrowth, setCustomDpiGrowth] = useState(0)
  const [navShock, setNavShock] = useState(0)
  const [forecastName, setForecastName] = useState('New Scenario')
  const [forecastDescription, setForecastDescription] = useState('')
  const [isSavingForecast, setIsSavingForecast] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deletingForecastId, setDeletingForecastId] = useState<string | null>(null)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)

  useEffect(() => {
    if (filterMode !== 'fund') {
      setSelectedFundId('all')
    }
    if (filterMode !== 'vintage') {
      setSelectedVintage('all')
    }
    if (filterMode !== 'assetClass') {
      setSelectedAssetClass('all')
    }
  }, [filterMode])

  const filteredFundIds = useMemo(() => {
    if (filterMode === 'fund' && selectedFundId !== 'all') {
      return new Set([selectedFundId])
    }

    if (filterMode === 'vintage' && selectedVintage !== 'all') {
      return new Set(funds.filter((fund) => fund.vintage === selectedVintage).map((fund) => fund.id))
    }

    if (filterMode === 'assetClass' && selectedAssetClass !== 'all') {
      return new Set(funds.filter((fund) => fund.assetClass === selectedAssetClass).map((fund) => fund.id))
    }

    return null
  }, [filterMode, selectedFundId, selectedVintage, selectedAssetClass, funds])

  const filteredFunds = useMemo(() => {
    if (!filteredFundIds) return funds
    return funds.filter((fund) => filteredFundIds.has(fund.id))
  }, [filteredFundIds, funds])

  const filteredCapitalCalls = useMemo(() => {
    if (!filteredFundIds) return capitalCalls
    return capitalCalls.filter((call) => filteredFundIds.has(call.fund.id))
  }, [capitalCalls, filteredFundIds])

  const filteredDistributions = useMemo(() => {
    if (!filteredFundIds) return distributions
    return distributions.filter((dist) => filteredFundIds.has(dist.fund.id))
  }, [distributions, filteredFundIds])

  const filteredPortfolioMetrics = useMemo(() => {
    if (!filteredFundIds) return portfolioMetrics
    const totalCommitment = filteredFunds.reduce((sum, fund) => sum + fund.commitment, 0)
    const totalPaidIn = filteredFunds.reduce((sum, fund) => sum + fund.paidIn, 0)
    const totalNav = filteredFunds.reduce((sum, fund) => sum + fund.nav, 0)
    const totalDistributions = filteredDistributions.reduce((sum, dist) => sum + dist.amount, 0)
    const unfundedCommitments = totalCommitment - totalPaidIn
    return {
      totalCommitment,
      totalPaidIn,
      totalNav,
      unfundedCommitments,
      totalDistributions,
    }
  }, [filteredFundIds, filteredFunds, filteredDistributions, portfolioMetrics])

  const metrics = filteredPortfolioMetrics

  const focusLabel = useMemo(() => {
    if (filterMode === 'fund') {
      if (selectedFundId === 'all') return 'Portfolio – All Funds'
      const fund = funds.find((f) => f.id === selectedFundId)
      return `Fund – ${fund?.name ?? 'Unknown'}`
    }

    if (filterMode === 'vintage') {
      if (selectedVintage === 'all') return 'Portfolio – All Vintages'
      return `Vintage – ${selectedVintage}`
    }

    if (filterMode === 'assetClass') {
      if (selectedAssetClass === 'all') return 'Portfolio – All Asset Classes'
      return `Asset Class – ${selectedAssetClass}`
    }

    return 'Portfolio – All Funds'
  }, [filterMode, selectedFundId, selectedVintage, selectedAssetClass, funds])

  const capitalCallHistory = useMemo(() => {
    return aggregateQuarterlyTotals(
      filteredCapitalCalls,
    (call) => Math.abs(toNumber(call.callAmount)),
      (call) => {
        const dateSource = call.dueDate ?? call.uploadDate ?? null
        return dateSource ? new Date(dateSource) : null
      }
    )
  }, [filteredCapitalCalls])

  const distributionHistory = useMemo(() => {
    return aggregateQuarterlyTotals(
      filteredDistributions,
    (dist) => toNumber(dist.amount),
      (dist) => {
        const dateSource = dist.distributionDate ?? dist.createdAt ?? null
        return dateSource ? new Date(dateSource) : null
      }
    )
  }, [filteredDistributions])

  const averageQuarterlyCapitalCalls = useMemo(() => {
    const window = capitalCallHistory.slice(-AGGREGATION_WINDOW)
    if (!window.length) return null
    const total = window.reduce((sum, entry) => sum + entry.amount, 0)
    return total / window.length
  }, [capitalCallHistory])

  const averageQuarterlyDistributions = useMemo(() => {
    const window = distributionHistory.slice(-AGGREGATION_WINDOW)
    if (!window.length) return null
    const total = window.reduce((sum, entry) => sum + entry.amount, 0)
    return total / window.length
  }, [distributionHistory])

  const currentQuarterOrder = useMemo(() => getCurrentQuarterOrder(), [])

  const historyMaxOrder = useMemo(() => {
    const capitalOrder = capitalCallHistory.length ? Math.max(...capitalCallHistory.map((entry) => getPeriodOrder(entry.label))) : null
    const distributionOrder = distributionHistory.length ? Math.max(...distributionHistory.map((entry) => getPeriodOrder(entry.label))) : null
    if (capitalOrder === null && distributionOrder === null) return null
    return Math.max(capitalOrder ?? Number.NEGATIVE_INFINITY, distributionOrder ?? Number.NEGATIVE_INFINITY)
  }, [capitalCallHistory, distributionHistory])

  const projectionStartOrder = useMemo(() => {
    if (historyMaxOrder !== null) {
      return historyMaxOrder + 1
    }
    return currentQuarterOrder
  }, [historyMaxOrder, currentQuarterOrder])

  // Calculate quarterly projection periods based on time horizon
  const quarters = useMemo(() => {
    const numQuarters = timeHorizon === '1year' ? 4 : timeHorizon === '3years' ? 12 : 20
    const result: string[] = []
    for (let i = 0; i < numQuarters; i++) {
      const order = projectionStartOrder + i
      result.push(getPeriodLabelFromOrder(order))
    }
    return result
  }, [timeHorizon, projectionStartOrder])

  const historicalDeploymentRate = useMemo(() => {
    if (!averageQuarterlyCapitalCalls || metrics.unfundedCommitments <= 0) return null
    return Math.min(
      Math.max(averageQuarterlyCapitalCalls / metrics.unfundedCommitments, 0.03),
      0.5
    )
  }, [averageQuarterlyCapitalCalls, metrics.unfundedCommitments])

  const historicalDistributionRate = useMemo(() => {
    if (!averageQuarterlyDistributions || metrics.totalNav <= 0) return null
    return Math.min(
      Math.max(averageQuarterlyDistributions / metrics.totalNav, 0.02),
      0.5
    )
  }, [averageQuarterlyDistributions, metrics.totalNav])

  const scenarioDeploymentFactor = {
    best: 1.2,
    base: 1,
    worst: 0.7,
  }[scenario]

  const scenarioDistributionFactor = {
    best: 1.5,
    base: 1,
    worst: 0.5,
  }[scenario]

  // Project capital calls based on unfunded commitments and pace
  const capitalCallProjections = useMemo(() => {
    const { unfundedCommitments } = metrics
    const numQuarters = quarters.length
    
    // Calculate deployment pace based on scenario
    const basePace = historicalDeploymentRate ?? 0.15
    const scenarioPace = basePace * scenarioDeploymentFactor * customDeploymentMultiplier

    let remaining = unfundedCommitments
    const projections = quarters.map((quarter, index) => {
      // Decrease pace over time (J-curve effect)
      const timeFactor = Math.max(0.3, 1 - (index / numQuarters) * 0.7)
      const amount = Math.min(remaining, remaining * scenarioPace * timeFactor)
      remaining -= amount
      
      return {
        period: quarter,
        amount: Math.round(amount),
        cumulative: unfundedCommitments - remaining,
      }
    })

    return projections
  }, [quarters, metrics, scenarioDeploymentFactor, customDeploymentMultiplier, scenario])

  // Project distributions based on NAV and DPI trends
  const distributionProjections = useMemo(() => {
    const { totalNav } = metrics
    const avgDPI = filteredFunds.length > 0 ? filteredFunds.reduce((sum, f) => sum + f.dpi, 0) / filteredFunds.length : 0
    
    // Calculate distribution pace based on scenario and portfolio maturity
    const baseDistRate = historicalDistributionRate ?? 0.08
    const scenarioRate = baseDistRate * scenarioDistributionFactor * customDistributionMultiplier
    const growthAdjustment = 1 + customDpiGrowth

    const adjustedNav = totalNav * (1 + navShock)

    let cumulativeTotal = 0
    const projections = quarters.map((quarter, index) => {
      // Increase distributions over time as funds mature
      const maturityFactor = 1 + (index / quarters.length) * 0.5
      const amount = adjustedNav * scenarioRate * maturityFactor * growthAdjustment
      cumulativeTotal += amount
      
      return {
        period: quarter,
        amount: Math.round(amount),
        cumulative: Math.round(cumulativeTotal),
      }
    })

    return projections
  }, [quarters, metrics, filteredFunds, scenarioDistributionFactor, customDistributionMultiplier, customDpiGrowth, navShock, scenario])

  const capitalHistorySeries = useMemo(() => {
    const historicalEntries = capitalCallHistory.filter(
      (entry) => getPeriodOrder(entry.label) < projectionStartOrder
    )
    let cumulative = 0
    const entries = historicalEntries
      .map((entry) => ({
        ...entry,
        order: getPeriodOrder(entry.label),
      }))
      .sort((a, b) => a.order - b.order)

    const historyPoints = entries.map((entry) => {
      cumulative += entry.amount
      return {
        period: entry.label,
        order: entry.order,
        historicalCapital: entry.amount,
        historicalCumulative: cumulative,
      }
    })

    if (historyPoints.length > HISTORY_DISPLAY_WINDOW) {
      return historyPoints.slice(-HISTORY_DISPLAY_WINDOW)
    }

    return historyPoints
  }, [capitalCallHistory, projectionStartOrder])

  const distributionHistorySeries = useMemo(() => {
    const historicalEntries = distributionHistory.filter(
      (entry) => getPeriodOrder(entry.label) < projectionStartOrder
    )
    let cumulative = 0
    const entries = historicalEntries
      .map((entry) => ({
        ...entry,
        order: getPeriodOrder(entry.label),
      }))
      .sort((a, b) => a.order - b.order)

    const historyPoints = entries.map((entry) => {
      cumulative += entry.amount
      return {
        period: entry.label,
        order: entry.order,
        historicalDistribution: entry.amount,
        historicalCumulative: cumulative,
      }
    })

    if (historyPoints.length > HISTORY_DISPLAY_WINDOW) {
      return historyPoints.slice(-HISTORY_DISPLAY_WINDOW)
    }

    return historyPoints
  }, [distributionHistory, projectionStartOrder])

  const capitalChartData = useMemo(() => {
    const timeline = new Map<
      number,
      {
        period: string
        order: number
        amount?: number
        cumulative?: number
        historicalCapital?: number
        historicalCumulative?: number
      }
    >()

    capitalHistorySeries.forEach((entry) => {
      timeline.set(entry.order, {
        period: entry.period,
        order: entry.order,
        historicalCapital: entry.historicalCapital,
        historicalCumulative: entry.historicalCumulative,
      })
    })

    capitalCallProjections.forEach((projection) => {
      const order = getPeriodOrder(projection.period)
      const existing = timeline.get(order) ?? { period: projection.period, order }
      timeline.set(order, {
        ...existing,
        amount: projection.amount,
        cumulative: projection.cumulative,
      })
    })

    return Array.from(timeline.values())
      .sort((a, b) => a.order - b.order)
      .map(({ order, ...rest }) => rest)
  }, [capitalHistorySeries, capitalCallProjections])

  const distributionChartData = useMemo(() => {
    const timeline = new Map<
      number,
      {
        period: string
        order: number
        amount?: number
        cumulative?: number
        historicalDistribution?: number
        historicalCumulative?: number
      }
    >()

    distributionHistorySeries.forEach((entry) => {
      timeline.set(entry.order, {
        period: entry.period,
        order: entry.order,
        historicalDistribution: entry.historicalDistribution,
        historicalCumulative: entry.historicalCumulative,
      })
    })

    distributionProjections.forEach((projection) => {
      const order = getPeriodOrder(projection.period)
      const existing = timeline.get(order) ?? { period: projection.period, order }
      timeline.set(order, {
        ...existing,
        amount: projection.amount,
        cumulative: projection.cumulative,
      })
    })

    return Array.from(timeline.values())
      .sort((a, b) => a.order - b.order)
      .map(({ order, ...rest }) => rest)
  }, [distributionHistorySeries, distributionProjections])

  // Calculate net cash flow
  const netCashFlow = useMemo(() => {
    return quarters.map((quarter, index) => ({
      period: quarter,
      capitalCalls: -capitalCallProjections[index].amount,
      distributions: distributionProjections[index].amount,
      net: distributionProjections[index].amount - capitalCallProjections[index].amount,
    }))
  }, [quarters, capitalCallProjections, distributionProjections])

  // Calculate liquidity requirements
  const liquidityRequirements = useMemo(() => {
    let cumulativeCash = 0
    let maxDrawdown = 0
    
    const requirements = netCashFlow.map((cf) => {
      cumulativeCash += cf.net
      maxDrawdown = Math.min(maxDrawdown, cumulativeCash)
      
      return {
        period: cf.period,
        cumulativeCash,
        maxDrawdown,
        requiredReserve: Math.abs(maxDrawdown) * 1.15, // 15% buffer
      }
    })

    return requirements
  }, [netCashFlow])

  const tabs = [
    { id: 'capital', label: 'Capital Calls', icon: TrendingDown },
    { id: 'distributions', label: 'Distributions', icon: TrendingUp },
    { id: 'net', label: 'Net Cash Flow', icon: Activity },
    { id: 'liquidity', label: 'Liquidity', icon: DollarSign },
  ]
  const hasCapitalHistory = capitalHistorySeries.length > 0
  const hasDistributionHistory = distributionHistorySeries.length > 0
  const capitalLegendPayload = useMemo<LegendProps['payload']>(
    () => [
      { value: 'Projected Calls', type: 'rect' as const, id: 'projCalls', color: '#ef4444' },
      { value: 'Projected Cumulative', type: 'line' as const, id: 'projCum', color: '#dc2626' },
      ...(hasCapitalHistory
        ? [
            { value: 'Historical Calls', type: 'rect' as const, id: 'histCalls', color: '#f97316' },
            { value: 'Historical Cumulative', type: 'line' as const, id: 'histCum', color: '#f59e0b' },
          ]
        : []),
    ],
    [hasCapitalHistory]
  )
  const distributionLegendPayload = useMemo<LegendProps['payload']>(
    () => [
      { value: 'Projected Distributions', type: 'rect' as const, id: 'projDist', color: '#10b981' },
      { value: 'Projected Cumulative', type: 'line' as const, id: 'projDistCum', color: '#059669' },
      ...(hasDistributionHistory
        ? [
            { value: 'Historical Distributions', type: 'rect' as const, id: 'histDist', color: '#3b82f6' },
            { value: 'Historical Cumulative', type: 'line' as const, id: 'histDistCum', color: '#0ea5e9' },
          ]
        : []),
    ],
    [hasDistributionHistory]
  )

  // Export Functions
  const handleExportPDF = async () => {
    const totalProjectedCapitalCalls = capitalCallProjections.reduce((sum, p) => sum + p.amount, 0)
    const totalProjectedDistributions = distributionProjections.reduce((sum, p) => sum + p.amount, 0)
    const netProjectedCashFlow = totalProjectedDistributions - totalProjectedCapitalCalls
    const maxDrawdown = Math.min(...liquidityRequirements.map(l => l.cumulativeCash), 0)
    const peakReserve = Math.abs(maxDrawdown) * 1.15

    const doc = exportToPDF({
      title: 'Cash Flow Forecasting Report',
      subtitle: `${timeHorizon} Forecast - ${scenario} Case Scenario`,
      date: formatDateForExport(new Date()),
      sections: [
        {
          title: 'Forecast Summary',
          type: 'metrics',
          data: [
            { label: 'Timeframe', value: timeHorizon },
            { label: 'Scenario', value: scenario.charAt(0).toUpperCase() + scenario.slice(1) },
            { label: 'Focus', value: focusLabel },
            { label: 'Total Projected Capital Calls', value: formatCurrencyForExport(totalProjectedCapitalCalls) },
            { label: 'Total Projected Distributions', value: formatCurrencyForExport(totalProjectedDistributions) },
            { label: 'Net Cash Flow', value: formatCurrencyForExport(netProjectedCashFlow) },
            { label: 'Peak Liquidity Need', value: formatCurrencyForExport(Math.abs(maxDrawdown)) },
            { label: 'Avg Deployment Pace', value: formatPercent((historicalDeploymentRate ?? 0.15)) },
            { label: 'Avg Distribution Yield', value: formatPercent((historicalDistributionRate ?? 0.08)) },
            { label: 'Deployment Multiplier', value: `${customDeploymentMultiplier.toFixed(2)}x` },
            { label: 'Distribution Multiplier', value: `${customDistributionMultiplier.toFixed(2)}x` },
            { label: 'DPI Growth', value: formatPercent(customDpiGrowth) },
            { label: 'NAV Shock', value: formatPercent(navShock) },
          ],
        },
        {
          title: 'Capital Call Projections',
          type: 'table',
          data: {
            headers: ['Period', 'Amount', 'Cumulative'],
            rows: capitalCallProjections.map((p) => [
              p.period,
              formatCurrencyForExport(p.amount),
              formatCurrencyForExport(p.cumulative),
            ]),
          },
        },
        {
          title: 'Distribution Projections',
          type: 'table',
          data: {
            headers: ['Period', 'Amount', 'Cumulative'],
            rows: distributionProjections.map((p) => [
              p.period,
              formatCurrencyForExport(p.amount),
              formatCurrencyForExport(p.cumulative),
            ]),
          },
        },
        {
          title: 'Net Cash Flow Analysis',
          type: 'table',
          data: {
            headers: ['Period', 'Capital Calls', 'Distributions', 'Net Flow'],
            rows: netCashFlow.map((p) => [
              p.period,
              formatCurrencyForExport(Math.abs(p.capitalCalls)),
              formatCurrencyForExport(p.distributions),
              formatCurrencyForExport(p.net),
            ]),
          },
        },
        {
          title: 'Liquidity Planning',
          type: 'summary',
          data: {
            'Required Reserve (15% Buffer)': formatCurrencyForExport(peakReserve),
            'Peak Drawdown': formatCurrencyForExport(Math.abs(maxDrawdown)),
            'Unfunded Commitments': formatCurrencyForExport(metrics.unfundedCommitments),
          },
        },
      ],
    })

    doc.save(`forecasting-report-${timeHorizon}-${scenario}-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportExcel = async () => {
    const totalProjectedCapitalCalls = capitalCallProjections.reduce((sum, p) => sum + p.amount, 0)
    const totalProjectedDistributions = distributionProjections.reduce((sum, p) => sum + p.amount, 0)
    const netProjectedCashFlow = totalProjectedDistributions - totalProjectedCapitalCalls
    const maxDrawdown = Math.min(...liquidityRequirements.map(l => l.cumulativeCash), 0)
    const peakReserve = Math.abs(maxDrawdown) * 1.15

    exportToExcel({
      filename: `forecasting-report-${timeHorizon}-${scenario}-${new Date().toISOString().split('T')[0]}`,
      sheets: [
        {
          name: 'Summary',
          data: [
            ['Cash Flow Forecasting Report'],
            ['Generated', formatDateForExport(new Date())],
            ['Timeframe', timeHorizon],
            ['Scenario', scenario.charAt(0).toUpperCase() + scenario.slice(1)],
            ['Focus', focusLabel],
            [],
            ['Metric', 'Value'],
            ['Total Projected Capital Calls', totalProjectedCapitalCalls],
            ['Total Projected Distributions', totalProjectedDistributions],
            ['Net Cash Flow', netProjectedCashFlow],
            ['Peak Liquidity Need', Math.abs(maxDrawdown)],
            ['Required Reserve (15% Buffer)', peakReserve],
            ['Avg Deployment Pace', formatPercent((historicalDeploymentRate ?? 0.15))],
            ['Avg Distribution Yield', formatPercent((historicalDistributionRate ?? 0.08))],
            ['Deployment Multiplier', customDeploymentMultiplier],
            ['Distribution Multiplier', customDistributionMultiplier],
            ['DPI Growth', customDpiGrowth],
            ['NAV Shock', navShock],
          ],
        },
        {
          name: 'Capital Calls',
          data: [
            ['Period', 'Amount', 'Cumulative'],
            ...capitalCallProjections.map((p) => [p.period, p.amount, p.cumulative]),
          ],
        },
        {
          name: 'Distributions',
          data: [
            ['Period', 'Amount', 'Cumulative'],
            ...distributionProjections.map((p) => [p.period, p.amount, p.cumulative]),
          ],
        },
        {
          name: 'Net Cash Flow',
          data: [
            ['Period', 'Capital Calls', 'Distributions', 'Net Flow'],
            ...netCashFlow.map((p) => [
              p.period,
              Math.abs(p.capitalCalls),
              p.distributions,
              p.net,
            ]),
          ],
        },
        {
          name: 'Liquidity',
          data: [
            ['Period', 'Cumulative Cash', 'Max Drawdown'],
            ...liquidityRequirements.map((p) => [
              p.period,
              p.cumulativeCash,
              p.maxDrawdown,
            ]),
          ],
        },
      ],
    })
  }

  const handleExportCSV = async () => {
    const csvData = [
      ['Period', 'Capital Calls', 'Distributions', 'Net Flow'],
      ...netCashFlow.map((p) => [
        p.period,
        Math.abs(p.capitalCalls).toString(),
        p.distributions.toString(),
        p.net.toString(),
      ]),
    ]

    exportToCSV(csvData, `forecasting-net-cash-flow-${timeHorizon}-${scenario}-${new Date().toISOString().split('T')[0]}`)
  }

  const currentScenarioConfig = useMemo(
    () => ({
      scenario,
      timeHorizon,
      filterMode,
      selectedFundId,
      selectedVintage,
      selectedAssetClass,
      customDeploymentMultiplier,
      customDistributionMultiplier,
      customDpiGrowth,
      navShock,
    }),
    [
      scenario,
      timeHorizon,
      filterMode,
      selectedFundId,
      selectedVintage,
      selectedAssetClass,
      customDeploymentMultiplier,
      customDistributionMultiplier,
      customDpiGrowth,
      navShock,
    ]
  )

  const savedForecastList = savedForecasts ?? []

  const applySavedForecast = (forecast: SavedForecast) => {
    const config = forecast.config || {}

    if (config.scenario && ['best', 'base', 'worst'].includes(config.scenario)) {
      setScenario(config.scenario)
    }
    if (config.timeHorizon && ['1year', '3years', '5years'].includes(config.timeHorizon)) {
      setTimeHorizon(config.timeHorizon)
    }
    if (config.filterMode && ['portfolio', 'fund', 'vintage', 'assetClass'].includes(config.filterMode)) {
      setFilterMode(config.filterMode)
    }

    setSelectedFundId(config.selectedFundId || 'all')
    setSelectedVintage(
      config.selectedVintage !== undefined ? (config.selectedVintage === 'all' ? 'all' : Number(config.selectedVintage)) : 'all'
    )
    setSelectedAssetClass(config.selectedAssetClass || 'all')

    if (typeof config.customDeploymentMultiplier === 'number') {
      setCustomDeploymentMultiplier(config.customDeploymentMultiplier)
    }
    if (typeof config.customDistributionMultiplier === 'number') {
      setCustomDistributionMultiplier(config.customDistributionMultiplier)
    }
    if (typeof config.customDpiGrowth === 'number') {
      setCustomDpiGrowth(config.customDpiGrowth)
    }
    if (typeof config.navShock === 'number') {
      setNavShock(config.navShock)
    }
    setForecastName(forecast.name)
    setForecastDescription(forecast.description || '')
  }

  const handleSaveForecast = async () => {
    if (!forecastName.trim()) {
      setSaveError('Scenario name is required')
      return
    }

    setIsSavingForecast(true)
    setSaveError(null)
    try {
      const response = await fetch('/api/forecasting/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: forecastName.trim(),
          description: forecastDescription,
          config: currentScenarioConfig,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        if (response.status === 503) {
          setSaveError(body?.error || 'Saved forecasts table not found. Ask your administrator to run the latest migrations.')
          return
        }
        throw new Error(body?.error || 'Failed to save forecast scenario')
      }

      window.location.reload()
    } catch (error) {
      console.error('Failed to save forecast scenario:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save forecast scenario')
    } finally {
      setIsSavingForecast(false)
    }
  }

  const handleDeleteForecast = async (forecastId: string) => {
    if (!confirm('Delete this saved scenario?')) return
    setDeletingForecastId(forecastId)
    try {
      const response = await fetch(`/api/forecasting/saved/${forecastId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || 'Failed to delete scenario')
      }
      window.location.reload()
    } catch (error) {
      console.error('Failed to delete saved forecast:', error)
      alert('Unable to delete this scenario. Please try again.')
    } finally {
      setDeletingForecastId(null)
    }
  }

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    Cash Flow Forecasting
                  </motion.span>
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-sm text-foreground/60 mt-0.5"
                >
                  Project cash flows, model scenarios, and plan liquidity needs
                </motion.p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSettingsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Forecasting Scenario Settings"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Scenario Settings</span>
              </button>
              <ExportButton
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onExportCSV={handleExportCSV}
                label="Export Forecast"
              />
            </div>
          </div>
        </motion.div>

        {savedForecastsError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Saved scenarios unavailable</p>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
                The SavedForecast table has not been migrated yet. Ask an administrator to run the latest database migrations to enable this feature.
              </p>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <div className="rounded-xl border border-border dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1">Avg Deployment Pace</p>
            <p className="text-2xl font-bold text-foreground">
              {formatPercent((historicalDeploymentRate ?? 0.15))} <span className="text-sm font-medium text-foreground/60">per quarter</span>
            </p>
            <p className="text-xs text-foreground/50 mt-1">
              {capitalCallHistory.length
                ? `Based on last ${Math.min(AGGREGATION_WINDOW, capitalCallHistory.length)} quarters of capital calls`
                : 'Insufficient history, using default pacing'}
            </p>
          </div>
          <div className="rounded-xl border border-border dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1">Avg Distribution Yield</p>
            <p className="text-2xl font-bold text-foreground">
              {formatPercent((historicalDistributionRate ?? 0.08))} <span className="text-sm font-medium text-foreground/60">of NAV</span>
            </p>
            <p className="text-xs text-foreground/50 mt-1">
              {distributionHistory.length
                ? `Derived from last ${Math.min(AGGREGATION_WINDOW, distributionHistory.length)} quarters of distributions`
                : 'Insufficient history, using default yield'}
            </p>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6 mb-8"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2 block">
                Scenario
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'best', label: 'Best Case', color: 'emerald' },
                  { value: 'base', label: 'Base Case', color: 'blue' },
                  { value: 'worst', label: 'Worst Case', color: 'red' },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setScenario(s.value as ScenarioType)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      scenario === s.value
                        ? s.color === 'emerald'
                          ? 'bg-emerald-500 text-white'
                          : s.color === 'blue'
                          ? 'bg-blue-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-l border-border pl-4 ml-auto">
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2 block">
                Time Horizon
              </label>
              <select
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(e.target.value as TimeHorizon)}
                className="px-4 py-2 border border-border rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="1year">1 Year (4 Quarters)</option>
                <option value="3years">3 Years (12 Quarters)</option>
                <option value="5years">5 Years (20 Quarters)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2 block">
                Focus Mode
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'portfolio', label: 'Portfolio' },
                  { value: 'fund', label: 'Fund' },
                  { value: 'vintage', label: 'Vintage' },
                  { value: 'assetClass', label: 'Asset Class' },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setFilterMode(mode.value as FilterMode)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterMode === mode.value
                        ? 'bg-accent text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {filterMode === 'fund' && (
              <div>
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2 block">
                  Fund
                </label>
                <select
                  value={selectedFundId}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="all">All Funds</option>
                  {funds.map((fund) => (
                    <option key={fund.id} value={fund.id}>
                      {fund.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterMode === 'vintage' && (
              <div>
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2 block">
                  Vintage Year
                </label>
                <select
                  value={selectedVintage}
                  onChange={(e) =>
                    setSelectedVintage(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="all">All Vintages</option>
                  {Array.from(new Set(funds.map((fund) => fund.vintage)))
                    .sort((a, b) => b - a)
                    .map((vintage) => (
                      <option key={vintage} value={vintage}>
                        {vintage}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {filterMode === 'assetClass' && (
              <div>
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2 block">
                  Asset Class
                </label>
                <select
                  value={selectedAssetClass}
                  onChange={(e) => setSelectedAssetClass(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="all">All Asset Classes</option>
                  {assetClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="text-xs text-foreground/50 mt-4">Current Focus: {focusLabel}</p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 rounded-xl border border-red-200/60 dark:border-red-800/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-sm font-semibold text-foreground">Total Calls</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(capitalCallProjections.reduce((sum, p) => sum + p.amount, 0))}
            </p>
            <p className="text-xs text-foreground/60">Over {quarters.length} quarters</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Total Distributions</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(distributionProjections.reduce((sum, p) => sum + p.amount, 0))}
            </p>
            <p className="text-xs text-foreground/60">Projected returns</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl border border-blue-200/60 dark:border-blue-800/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-foreground">Net Cash Flow</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(netCashFlow.reduce((sum, cf) => sum + cf.net, 0))}
            </p>
            <p className="text-xs text-foreground/60">
              {netCashFlow.reduce((sum, cf) => sum + cf.net, 0) > 0 ? 'Positive' : 'Negative'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 rounded-xl border border-amber-200/60 dark:border-amber-800/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Reserve Needed</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(Math.max(...liquidityRequirements.map(r => r.requiredReserve)))}
            </p>
            <p className="text-xs text-foreground/60">Peak liquidity requirement</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex gap-2 border-b border-border overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Capital Calls Tab */}
        {activeTab === 'capital' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Projected Capital Calls</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={capitalChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#f8fafc' }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Legend payload={capitalLegendPayload} wrapperStyle={{ paddingTop: 12 }} />
                  <Bar dataKey="amount" fill="#ef4444" name="Projected Calls" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="cumulative" stroke="#dc2626" strokeWidth={2} name="Projected Cumulative" />
                  {hasCapitalHistory && (
                    <>
                      <Bar dataKey="historicalCapital" fill="#f97316" name="Historical Calls" radius={[8, 8, 0, 0]} />
                      <Line type="monotone" dataKey="historicalCumulative" stroke="#f59e0b" strokeDasharray="4 4" name="Historical Cumulative" dot={false} connectNulls />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quarterly Breakdown</h3>
              <div className="space-y-2">
                {capitalCallProjections.slice(0, 8).map((projection, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-4">
                      <Calendar className="w-4 h-4 text-foreground/40" />
                      <span className="text-sm font-medium text-foreground">{projection.period}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${(projection.amount / Math.max(...capitalCallProjections.map(p => p.amount))) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground min-w-[100px] text-right">
                        {formatCurrency(projection.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Distributions Tab */}
        {activeTab === 'distributions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Projected Distributions</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={distributionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#f8fafc' }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Legend payload={distributionLegendPayload} wrapperStyle={{ paddingTop: 12 }} />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Projected Distribution" />
                  <Line type="monotone" dataKey="cumulative" stroke="#059669" strokeWidth={2} name="Projected Cumulative" />
                  {hasDistributionHistory && (
                    <>
                      <Area type="monotone" dataKey="historicalDistribution" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Historical Distributions" />
                      <Line type="monotone" dataKey="historicalCumulative" stroke="#0ea5e9" strokeDasharray="4 4" name="Historical Cumulative" dot={false} connectNulls />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Distribution Drivers</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-foreground">Portfolio Maturity</span>
                      <span className="text-sm font-semibold text-foreground">
                        {Math.round((funds.reduce((sum, f) => sum + (new Date().getFullYear() - f.vintage), 0) / funds.length))} years avg
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-foreground">Exit Activity</span>
                      <span className="text-sm font-semibold text-foreground">{scenario === 'best' ? 'High' : scenario === 'base' ? 'Moderate' : 'Low'}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: scenario === 'best' ? '80%' : scenario === 'base' ? '50%' : '30%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-foreground">Market Conditions</span>
                      <span className="text-sm font-semibold text-foreground">{scenario === 'best' ? 'Favorable' : scenario === 'base' ? 'Stable' : 'Challenging'}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: scenario === 'best' ? '90%' : scenario === 'base' ? '60%' : '35%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Key Assumptions</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <span className="text-sm text-foreground">Distribution Rate</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {scenario === 'best' ? '12%' : scenario === 'base' ? '8%' : '4%'} / quarter
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-foreground">Avg. Holding Period</span>
                    <span className="text-sm font-semibold text-foreground">5-7 years</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-foreground">Exit Multiples</span>
                    <span className="text-sm font-semibold text-foreground">
                      {scenario === 'best' ? '3.0x' : scenario === 'base' ? '2.5x' : '1.8x'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Net Cash Flow Tab */}
        {activeTab === 'net' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Net Cash Flow Projection</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={netCashFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(Math.abs(value))}
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#f8fafc' }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Legend />
                  <Bar dataKey="capitalCalls" fill="#ef4444" name="Capital Calls" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="distributions" fill="#10b981" name="Distributions" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} name="Net Cash Flow" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { label: 'Positive Quarters', value: netCashFlow.filter(cf => cf.net > 0).length, total: netCashFlow.length, color: 'emerald' },
                { label: 'Negative Quarters', value: netCashFlow.filter(cf => cf.net < 0).length, total: netCashFlow.length, color: 'red' },
                { label: 'Breakeven Point', value: netCashFlow.findIndex(cf => cf.net > 0) + 1, total: netCashFlow.length, color: 'blue' },
              ].map((stat) => (
                <div key={stat.label} className={`bg-gradient-to-br ${
                  stat.color === 'emerald' 
                    ? 'from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 border-emerald-200/60 dark:border-emerald-800/60'
                    : stat.color === 'red'
                    ? 'from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10 border-red-200/60 dark:border-red-800/60'
                    : 'from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 border-blue-200/60 dark:border-blue-800/60'
                } rounded-xl border p-6`}>
                  <p className="text-sm text-foreground/60 mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {stat.label === 'Breakeven Point' ? `Quarter ${stat.value}` : `of ${stat.total} quarters`}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Liquidity Tab */}
        {activeTab === 'liquidity' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Cumulative Cash Position</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={liquidityRequirements}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#f8fafc' }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="cumulativeCash" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Cumulative Cash" />
                  <Area type="monotone" dataKey="requiredReserve" stroke="#f59e0b" fill="none" strokeDasharray="5 5" name="Required Reserve" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Liquidity Milestones</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Peak Liquidity Need</p>
                      <p className="text-lg font-bold text-foreground mt-1">
                        {formatCurrency(Math.max(...liquidityRequirements.map(r => r.requiredReserve)))}
                      </p>
                      <p className="text-xs text-foreground/60 mt-1">
                        In {liquidityRequirements.find(r => r.requiredReserve === Math.max(...liquidityRequirements.map(x => x.requiredReserve)))?.period}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Cash Flow Positive</p>
                      <p className="text-lg font-bold text-foreground mt-1">
                        {liquidityRequirements.find(r => r.cumulativeCash > 0)?.period || 'Not in period'}
                      </p>
                      <p className="text-xs text-foreground/60 mt-1">First positive cumulative cash</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Full Deployment</p>
                      <p className="text-lg font-bold text-foreground mt-1">
                        {capitalCallProjections[capitalCallProjections.length - 1]?.period}
                      </p>
                      <p className="text-xs text-foreground/60 mt-1">All capital deployed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Funding Recommendations</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm font-semibold text-foreground">Immediate Reserve</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-2">
                      {formatCurrency(Math.max(...liquidityRequirements.slice(0, 4).map(r => r.requiredReserve)))}
                    </p>
                    <p className="text-xs text-foreground/60">For next 12 months</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-foreground">Credit Line</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(metrics.unfundedCommitments * 0.3)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-foreground">Cash Reserve</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(metrics.unfundedCommitments * 0.2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-foreground">Total Buffer</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(metrics.unfundedCommitments * 0.5)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {/* Scenario Settings Modal */}
        {settingsModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSettingsModalOpen(false)}>
            <div className="bg-white dark:bg-surface border border-border rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-surface border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Forecasting Scenario Settings</h2>
                  <p className="text-sm text-foreground/60 mt-1">Adjust scenario parameters and manage saved scenarios</p>
                </div>
                <button
                  onClick={() => setSettingsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-8">
                {/* Scenario Adjustment Sliders */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Scenario Adjustments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2">
                        <span>Deployment Multiplier</span>
                        <span>{customDeploymentMultiplier.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={1.5}
                        step={0.05}
                        value={customDeploymentMultiplier}
                        onChange={(e) => setCustomDeploymentMultiplier(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-foreground/50 mt-1">Adjusts capital call pacing relative to scenario baseline.</p>
                    </div>
                    <div className="rounded-xl border border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2">
                        <span>Distribution Multiplier</span>
                        <span>{customDistributionMultiplier.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={1.5}
                        step={0.05}
                        value={customDistributionMultiplier}
                        onChange={(e) => setCustomDistributionMultiplier(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-foreground/50 mt-1">Scales projected distributions up or down.</p>
                    </div>
                    <div className="rounded-xl border border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2">
                        <span>DPI Growth</span>
                        <span>{(customDpiGrowth * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min={-0.3}
                        max={0.5}
                        step={0.01}
                        value={customDpiGrowth}
                        onChange={(e) => setCustomDpiGrowth(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-foreground/50 mt-1">Adjusts overall distribution growth assumptions.</p>
                    </div>
                    <div className="rounded-xl border border-border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2">
                        <span>NAV Shock</span>
                        <span>{(navShock * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min={-0.3}
                        max={0.2}
                        step={0.01}
                        value={navShock}
                        onChange={(e) => setNavShock(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-foreground/50 mt-1">Simulate NAV decline or appreciation impacting future cash flows.</p>
                    </div>
                  </div>
                </div>

                {/* Saved Scenarios Section */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white">
                      <Bookmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Saved Scenarios</h3>
                      <p className="text-sm text-foreground/60">Store scenario configurations and reuse them later.</p>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide block mb-2">
                          Scenario Name
                        </label>
                        <input
                          type="text"
                          value={forecastName}
                          onChange={(e) => setForecastName(e.target.value)}
                          placeholder="e.g., Base Case – Europe Funds"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide block mb-2">
                          Description
                        </label>
                        <textarea
                          value={forecastDescription}
                          onChange={(e) => setForecastDescription(e.target.value)}
                          rows={3}
                          placeholder="Optional notes about assumptions or intended recipients."
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
                        />
                      </div>
                      {saveError && <p className="text-sm text-red-500">{saveError}</p>}
                      <button
                        type="button"
                        onClick={() => {
                          handleSaveForecast()
                          // Optionally close modal after save
                          setTimeout(() => {
                            if (!saveError) {
                              setSettingsModalOpen(false)
                            }
                          }, 1000)
                        }}
                        disabled={isSavingForecast || savedForecastsError}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white font-medium disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {isSavingForecast ? 'Saving...' : 'Save Current Scenario'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {savedForecastList.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-foreground/60">
                          No saved scenarios yet.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                          {savedForecastList.map((forecast) => (
                            <div
                              key={forecast.id}
                              className="border border-border rounded-lg p-4 hover:border-accent/40 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-foreground">{forecast.name}</p>
                                  {forecast.description && (
                                    <p className="text-sm text-foreground/60 mt-1">{forecast.description}</p>
                                  )}
                                  <p className="text-xs text-foreground/50 mt-1">
                                    Updated {new Date(forecast.updatedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      applySavedForecast(forecast)
                                      setSettingsModalOpen(false)
                                    }}
                                    className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700"
                                  >
                                    Load
                                  </button>
                                  <button
                                    onClick={() => handleDeleteForecast(forecast.id)}
                                    disabled={deletingForecastId === forecast.id}
                                    className="p-2 rounded-full border border-border text-foreground/70 hover:text-red-500 hover:border-red-500 disabled:opacity-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
