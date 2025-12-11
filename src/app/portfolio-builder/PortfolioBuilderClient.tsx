'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  TrendingUp,
  PieChart as PieChartIcon,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Calendar,
  DollarSign,
  Save,
  FolderPlus,
  Trash2,
  PlusCircle,
  MinusCircle,
  X,
  Download,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { ExportButton } from '@/components/ExportButton'
import { formatCurrency, formatPercent, formatMultiple } from '@/lib/utils'
import { DEFAULT_PORTFOLIO_TARGETS } from '@/lib/portfolioTargets'
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  formatCurrencyForExport,
  formatPercentForExport,
  formatDateForExport,
} from '@/lib/exportUtils'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface Fund {
  id: string
  name: string
  manager: string
  domicile: string
  vintage: number
  commitment: number
  paidIn: number
  nav: number
  irr: number
  tvpi: number
  assetClass?: string | null
}

interface DirectInvestment {
  id: string
  name: string
  currentValue: number | null
}

interface CurrentAllocations {
  byManager: { [key: string]: number }
  byGeography: { [key: string]: number }
  byVintage: { [key: string]: number }
  byAssetClass?: { [key: string]: number }
}

interface PortfolioMetrics {
  totalCommitment: number
  totalNav: number
  totalPaidIn: number
  totalPortfolioValue: number
  unfundedCommitments: number
  diTotalValue: number
}

type DimensionKey = 'byManager' | 'byGeography' | 'byVintage'

interface PortfolioModel {
  id: string
  name: string
  targets: Record<DimensionKey, { [key: string]: number }>
}

interface DriftItem {
  dimension: DimensionKey
  dimensionLabel: string
  name: string
  current: number
  target: number
  drift: number
  tolerance: number
}

interface RebalancingRecommendation {
  dimensionKey: DimensionKey
  dimensionLabel: string
  category: string
  current: number
  target: number
  drift: number
  isOverweight: boolean
  adjustmentAmount: number
  action: 'Reduce' | 'Increase'
}

interface FundActionPlan {
  fund: Fund
  cashImpact: number
  timeline: string
  gpConstraint: string
}

interface ActionableRecommendation extends RebalancingRecommendation {
  fundPlans: FundActionPlan[]
}

interface PortfolioBuilderClientProps {
  funds: Fund[]
  directInvestments: DirectInvestment[]
  currentAllocations: CurrentAllocations
  portfolioMetrics: PortfolioMetrics
  portfolioModels: PortfolioModel[]
}

const COLORS = ['#4b6c9c', '#2d7a5f', '#6d5d8a', '#c77340', '#3b82f6', '#10b981', '#ef4444', '#a85f35']

// Custom Tooltip Component for better readability
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel border border-border rounded-xl shadow-2xl shadow-black/10 p-4">
        {label && <p className="font-bold text-base mb-3 text-foreground">{label}</p>}
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-sm font-medium text-foreground/80">
                  {entry.name || entry.dataKey}:
                </span>
              </div>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {typeof entry.value === 'number' 
                  ? entry.value > 1000 
                    ? formatCurrency(entry.value)
                    : `${entry.value.toFixed(1)}%`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}
const DIMENSION_CONFIG: Array<{ key: DimensionKey; label: string; tolerance: number }> = [
  { key: 'byManager', label: 'Strategy / Manager', tolerance: 2 },
  { key: 'byGeography', label: 'Geography', tolerance: 1 },
  { key: 'byVintage', label: 'Vintage Year', tolerance: 1.5 },
]

const DIMENSION_LABEL_LOOKUP = DIMENSION_CONFIG.reduce(
  (acc, config) => {
    acc[config.key] = config.label
    return acc
  },
  {
    byManager: 'Strategy / Manager',
    byGeography: 'Geography',
    byVintage: 'Vintage Year',
  } as Record<DimensionKey, string>
)

const DIMENSION_FUND_SELECTOR: Record<DimensionKey, (fund: Fund) => string> = {
  byManager: (fund) => fund.manager || 'Unassigned',
  byGeography: (fund) => fund.domicile || 'Unspecified',
  byVintage: (fund) => (fund.vintage ? `${fund.vintage}` : 'Unspecified'),
}

// Default target allocations (can be customized by user)
const DEFAULT_TARGETS = DEFAULT_PORTFOLIO_TARGETS

export function PortfolioBuilderClient({
  funds,
  directInvestments,
  currentAllocations,
  portfolioMetrics,
  portfolioModels,
}: PortfolioBuilderClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'rebalance' | 'whatif' | 'pacing'>('overview')
  const [models, setModels] = useState<PortfolioModel[]>(portfolioModels)
  const [selectedModelId, setSelectedModelId] = useState(portfolioModels[0]?.id || '')
  const [modelSaving, setModelSaving] = useState(false)
  const [modelMessage, setModelMessage] = useState<string | null>(null)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [customCategories, setCustomCategories] = useState<Record<DimensionKey, string[]>>({
    byManager: [],
    byGeography: [],
    byVintage: [],
  })
  const [newCategoryInputs, setNewCategoryInputs] = useState<Record<DimensionKey, string>>({
    byManager: '',
    byGeography: '',
    byVintage: '',
  })
  const [scenarioDimension, setScenarioDimension] = useState<DimensionKey>('byManager')
  const [scenarioCategory, setScenarioCategory] = useState('')
  const [isQuickExporting, setIsQuickExporting] = useState(false)

  const ensureTargets = (targets?: Partial<Record<DimensionKey, { [key: string]: number }>>) => {
    return {
      byManager: { ...(targets?.byManager || {}) },
      byGeography: { ...(targets?.byGeography || {}) },
      byVintage: { ...(targets?.byVintage || {}) },
    } as Record<DimensionKey, { [key: string]: number }>
  }

  const selectedModel = useMemo(() => {
    if (!models.length) return null
    const found = models.find((model) => model.id === selectedModelId)
    return found || models[0]
  }, [models, selectedModelId])

  const [modelName, setModelName] = useState(selectedModel?.name || 'Default Targets')
  const [editableTargets, setEditableTargets] = useState<Record<DimensionKey, { [key: string]: number }>>(
    ensureTargets(selectedModel?.targets || DEFAULT_TARGETS)
  )

  const targetAllocations = editableTargets

  const shortcutLabel = useMemo(() => {
    if (typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')) {
      return '⌘⇧E'
    }
    return 'Ctrl+Shift+E'
  }, [])

  useEffect(() => {
    setModelName(selectedModel?.name || 'Default Targets')
    setEditableTargets(ensureTargets(selectedModel?.targets || DEFAULT_TARGETS))
    setModelMessage(null)
    setCustomCategories({
      byManager: [],
      byGeography: [],
      byVintage: [],
    })
    setNewCategoryInputs({
      byManager: '',
      byGeography: '',
      byVintage: '',
    })
  }, [selectedModel])


  const [whatIfCommitment, setWhatIfCommitment] = useState(10000000) // $10M default

  // Calculate current allocation percentages
  const currentAllocationPercentages = useMemo(() => {
    const { totalPortfolioValue } = portfolioMetrics

    const byManager = Object.entries(currentAllocations.byManager).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalPortfolioValue) * 100,
    }))

    const byGeography = Object.entries(currentAllocations.byGeography).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalPortfolioValue) * 100,
    }))

    const byVintage = Object.entries(currentAllocations.byVintage).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalPortfolioValue) * 100,
    }))

    const byAssetClass = Object.entries(currentAllocations.byAssetClass || {}).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalPortfolioValue) * 100,
    }))

    return { byManager, byGeography, byVintage, byAssetClass }
  }, [currentAllocations, portfolioMetrics])

  const dimensionCategories = useMemo(() => {
    return DIMENSION_CONFIG.reduce(
      (acc, config) => {
        const currentNames = currentAllocationPercentages[config.key].map((item) => item.name)
        const targetNames = Object.keys(targetAllocations[config.key] || {})
        const customNames = customCategories[config.key] || []
        acc[config.key] = Array.from(new Set([...currentNames, ...targetNames, ...customNames]))
        return acc
      },
      {
        byManager: [] as string[],
        byGeography: [] as string[],
        byVintage: [] as string[],
      }
    )
  }, [currentAllocationPercentages, targetAllocations, customCategories])

  const scenarioCategoryOptions = dimensionCategories[scenarioDimension] || []

  useEffect(() => {
    const categories = dimensionCategories[scenarioDimension]
    if (!categories.length) {
      setScenarioCategory('')
      return
    }
    if (!scenarioCategory || !categories.includes(scenarioCategory)) {
      setScenarioCategory(categories[0])
    }
  }, [dimensionCategories, scenarioDimension, scenarioCategory])

  const dimensionTargetTotals = useMemo<Record<DimensionKey, number>>(() => {
    return DIMENSION_CONFIG.reduce(
      (acc, config) => {
        const total = Object.values(targetAllocations[config.key] || {}).reduce((sum, value) => {
          return sum + (Number.isFinite(value) ? value : 0)
        }, 0)
        acc[config.key] = total
        return acc
      },
      {
        byManager: 0,
        byGeography: 0,
        byVintage: 0,
      } as Record<DimensionKey, number>
    )
  }, [targetAllocations])

  const handleAddCategory = (dimension: DimensionKey) => {
    const label = newCategoryInputs[dimension]?.trim()
    if (!label) return

    setEditableTargets((prev) => {
      const nextDimension = { ...(prev[dimension] || {}) }
      if (nextDimension[label] === undefined) {
        nextDimension[label] = 0
      }
      return {
        ...prev,
        [dimension]: nextDimension,
      }
    })

    setCustomCategories((prev) => ({
      ...prev,
      [dimension]: Array.from(new Set([...(prev[dimension] || []), label])),
    }))

    setNewCategoryInputs((prev) => ({
      ...prev,
      [dimension]: '',
    }))
  }

  const handleRemoveCategory = (dimension: DimensionKey, category: string) => {
    const currentNames = currentAllocationPercentages[dimension].map((item) => item.name)
    if (currentNames.includes(category)) {
      return
    }

    setEditableTargets((prev) => {
      const nextDimension = { ...(prev[dimension] || {}) }
      delete nextDimension[category]
      return {
        ...prev,
        [dimension]: nextDimension,
      }
    })

    setCustomCategories((prev) => ({
      ...prev,
      [dimension]: (prev[dimension] || []).filter((item) => item !== category),
    }))
  }

  const handleTargetValueChange = (dimension: DimensionKey, category: string, value: number) => {
    const nextValue = Number.isFinite(value) ? value : 0
    setEditableTargets((prev) => ({
      ...prev,
      [dimension]: {
        ...(prev[dimension] || {}),
        [category]: nextValue,
      },
    }))
  }

  const sanitizeTargets = (targets: Record<DimensionKey, { [key: string]: number }>) => {
    const result: Record<DimensionKey, { [key: string]: number }> = {
      byManager: {},
      byGeography: {},
      byVintage: {},
    }
    DIMENSION_CONFIG.forEach(({ key }) => {
      Object.entries(targets[key] || {}).forEach(([category, value]) => {
        if (!Number.isFinite(value)) return
        if (Math.abs(value) < 0.001) return
        result[key][category] = value
      })
    })
    return result
  }

  const handleSaveModel = async () => {
    if (!selectedModel) return
    setModelSaving(true)
    setModelMessage(null)
    try {
      const response = await fetch(`/api/portfolio-models/${selectedModel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modelName || selectedModel.name,
          targets: sanitizeTargets(targetAllocations),
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to save model')
      }
      const data = await response.json()
      setModels((prev) => prev.map((model) => (model.id === data.model.id ? data.model : model)))
      setModelMessage('Model saved')
    } catch (error) {
      setModelMessage('Unable to save model')
    } finally {
      setModelSaving(false)
    }
  }

  const handleCreateModel = async () => {
    setModelSaving(true)
    setModelMessage(null)
    try {
      const response = await fetch('/api/portfolio-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Model ${models.length + 1}`,
          targets: sanitizeTargets(targetAllocations),
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to create model')
      }
      const data = await response.json()
      setModels((prev) => [...prev, data.model])
      setSelectedModelId(data.model.id)
      setModelMessage('Model created')
    } catch (error) {
      setModelMessage('Unable to create model')
    } finally {
      setModelSaving(false)
    }
  }

  const handleDeleteModel = async () => {
    if (!selectedModel || models.length <= 1) return
    setModelSaving(true)
    setModelMessage(null)
    try {
      const response = await fetch(`/api/portfolio-models/${selectedModel.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete model')
      }
      setModels((prev) => {
        const next = prev.filter((model) => model.id !== selectedModel.id)
        setSelectedModelId(next[0]?.id || '')
        return next
      })
      setModelMessage('Model deleted')
    } catch (error) {
      setModelMessage('Unable to delete model')
    } finally {
      setModelSaving(false)
    }
  }

  const driftSummary = useMemo(() => {
    const perDimension = DIMENSION_CONFIG.reduce((acc, config) => {
      const currentList = currentAllocationPercentages[config.key]
      const targetMap = targetAllocations[config.key] || {}
      const categories = new Set([
        ...currentList.map((item) => item.name),
        ...Object.keys(targetMap),
      ])
      const items: DriftItem[] = Array.from(categories).map((name) => {
        const current = currentList.find((item) => item.name === name)?.percentage || 0
        const target = targetMap[name] ?? 0
        return {
          dimension: config.key,
          dimensionLabel: config.label,
          name,
          current,
          target,
          drift: current - target,
          tolerance: config.tolerance,
        }
      })
      acc[config.key] = items
      return acc
    }, {} as Record<DimensionKey, DriftItem[]>)

    const flattened = Object.values(perDimension).flat()
    const totalDrift = flattened.reduce((sum, item) => sum + Math.abs(item.drift), 0)
    const needsRebalancing = flattened.some((item) => Math.abs(item.drift) > item.tolerance)
    const averageDrift = flattened.length ? totalDrift / flattened.length : 0

    return { perDimension, flattened, averageDrift, totalDrift, needsRebalancing }
  }, [currentAllocationPercentages, targetAllocations])

  // Calculate rebalancing recommendations
  const rebalancingRecommendations = useMemo<RebalancingRecommendation[]>(() => {
    return driftSummary.flattened
      .filter((item) => Math.abs(item.drift) > item.tolerance)
      .map((item) => {
        const isOverweight = item.drift > 0
        const action: 'Reduce' | 'Increase' = isOverweight ? 'Reduce' : 'Increase'
        return {
          dimensionKey: item.dimension,
          dimensionLabel: item.dimensionLabel,
          category: item.name,
          current: item.current,
          target: item.target,
          drift: item.drift,
          isOverweight,
          adjustmentAmount: (Math.abs(item.drift) / 100) * portfolioMetrics.totalPortfolioValue,
          action,
        }
      })
      .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
  }, [driftSummary, portfolioMetrics])

  const sortedDriftRows = useMemo(() => {
    return [...driftSummary.flattened].sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
  }, [driftSummary])

  const actionableRecommendations = useMemo<ActionableRecommendation[]>(() => {
    return rebalancingRecommendations.map((rec) => {
      const selector = DIMENSION_FUND_SELECTOR[rec.dimensionKey]
      const focusFunds = selector ? funds.filter((fund) => selector(fund) === rec.category) : []
      const totalCategoryNav = focusFunds.reduce((sum, fund) => sum + fund.nav, 0)
      const plans: FundActionPlan[] = focusFunds
        .map((fund) => {
          const equalWeight = focusFunds.length ? 1 / focusFunds.length : 0
          const weight = totalCategoryNav ? fund.nav / totalCategoryNav : equalWeight
          const cashImpact = rec.adjustmentAmount * weight
          const paidInRatio = fund.commitment ? fund.paidIn / fund.commitment : 0
          const gpConstraint =
            paidInRatio >= 0.9
              ? 'Near fully called'
              : paidInRatio <= 0.3
              ? 'Early-stage deployment'
              : 'Standard capacity'
          const timeline = rec.isOverweight ? 'Execute in 30-60 days' : 'Deploy across 1-3 quarters'
          return {
            fund,
            cashImpact,
            timeline,
            gpConstraint,
          }
        })
        .sort((a, b) => Math.abs(b.cashImpact) - Math.abs(a.cashImpact))
        .slice(0, 3)

      return {
        ...rec,
        fundPlans: plans,
      }
    })
  }, [funds, rebalancingRecommendations])

  const executionPlanRows = useMemo(
    () =>
      actionableRecommendations.flatMap((rec) => {
        if (!rec.fundPlans.length) {
          return [
            {
              dimensionLabel: rec.dimensionLabel,
              category: rec.category,
              fundName: 'No eligible funds',
              action: rec.action,
              amount: rec.adjustmentAmount,
              timeline: 'Requires manual plan',
              constraint: 'Review allocation',
            },
          ]
        }
        return rec.fundPlans.map((plan) => ({
          dimensionLabel: rec.dimensionLabel,
          category: rec.category,
          fundName: plan.fund.name,
          action: rec.action,
          amount: plan.cashImpact,
          timeline: plan.timeline,
          constraint: plan.gpConstraint,
        }))
      }),
    [actionableRecommendations]
  )

  // Commitment pacing calculation
  const commitmentPacing = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const next5Years = Array.from({ length: 5 }, (_, i) => currentYear + i)
    
    // Calculate suggested annual commitments to maintain target allocation
    const annualPacing = next5Years.map(year => {
      const baseCommitment = portfolioMetrics.unfundedCommitments / 5 // Spread over 5 years
      const vintageAdjustment = year === currentYear ? 1.2 : year === currentYear + 1 ? 1.1 : 1.0
      
      return {
        year,
        suggested: baseCommitment * vintageAdjustment,
        deployed: year < currentYear + 2 ? baseCommitment * 0.8 : 0, // Historical for past years
      }
    })

    return annualPacing
  }, [portfolioMetrics])

  // What-if scenario calculation
  const whatIfScenario = useMemo(() => {
    const newTotalValue = portfolioMetrics.totalPortfolioValue + whatIfCommitment
    const dimensionData = currentAllocationPercentages[scenarioDimension]
    const availableCategories = dimensionCategories[scenarioDimension]
    const focusCategory =
      (scenarioCategory && availableCategories.includes(scenarioCategory) && scenarioCategory) ||
      availableCategories[0] ||
      ''

    const updatedAllocations = dimensionData.map((alloc) => {
      const newValue = alloc.name === focusCategory ? alloc.value + whatIfCommitment : alloc.value
      return {
        ...alloc,
        newValue,
        newPercentage: newTotalValue ? (newValue / newTotalValue) * 100 : 0,
        currentPercentage: alloc.percentage,
      }
    })

    const liquidityBefore =
      portfolioMetrics.unfundedCommitments > 0
        ? portfolioMetrics.totalNav / portfolioMetrics.unfundedCommitments
        : portfolioMetrics.totalNav
    const liquidityAfter =
      portfolioMetrics.unfundedCommitments + whatIfCommitment > 0
        ? portfolioMetrics.totalNav / (portfolioMetrics.unfundedCommitments + whatIfCommitment)
        : portfolioMetrics.totalNav

    const pacingBaseline = commitmentPacing[0]
    const pacingDelta = pacingBaseline ? whatIfCommitment - pacingBaseline.suggested : 0
    const pacingStatus = pacingBaseline
      ? pacingDelta >= 0
        ? 'Ahead of target'
        : 'Shortfall vs target'
      : 'No pacing baseline'
    const pacingGap = Math.abs(pacingDelta)

    return {
      newTotalValue,
      updatedAllocations: updatedAllocations.sort((a, b) => b.newPercentage - a.newPercentage),
      focusCategory: focusCategory || 'Unspecified',
      focusDimensionLabel: DIMENSION_LABEL_LOOKUP[scenarioDimension],
      liquidityBefore,
      liquidityAfter,
      pacingStatus,
      pacingGap,
    }
  }, [
    commitmentPacing,
    currentAllocationPercentages,
    dimensionCategories,
    portfolioMetrics,
    scenarioCategory,
    scenarioDimension,
    whatIfCommitment,
  ])

  const scenarioFocusLabel = `${whatIfScenario.focusDimensionLabel}: ${whatIfScenario.focusCategory}`
  const liquidityDelta = whatIfScenario.liquidityAfter - whatIfScenario.liquidityBefore

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'rebalance', label: 'Rebalancing', icon: Settings },
    { id: 'whatif', label: 'What-If Analysis', icon: TrendingUp },
    { id: 'pacing', label: 'Commitment Pacing', icon: Calendar },
  ]

  // Export Functions
  const handleExportPDF = async () => {
    const totalPositions = funds.length + directInvestments.length
    const scenarioFocus = `${whatIfScenario.focusDimensionLabel}: ${whatIfScenario.focusCategory}`
    const liquidityCoverageText = `${formatMultiple(whatIfScenario.liquidityBefore, 2)} → ${formatMultiple(
      whatIfScenario.liquidityAfter,
      2
    )}`

    const doc = exportToPDF({
      title: 'Portfolio Builder Report',
      subtitle: 'Target Allocation Analysis and Rebalancing Recommendations',
      date: formatDateForExport(new Date()),
      sections: [
        {
          title: 'Portfolio Summary',
          type: 'metrics',
          data: [
            { label: 'Total Portfolio Value', value: formatCurrencyForExport(portfolioMetrics.totalPortfolioValue) },
            { label: 'Active Positions', value: totalPositions.toString() },
            { label: 'Allocation Drift', value: formatPercentForExport(driftSummary.averageDrift) },
            { label: 'Unfunded Commitments', value: formatCurrencyForExport(portfolioMetrics.unfundedCommitments) },
          ],
        },
        {
          title: 'Audit Metadata',
          type: 'summary',
          data: {
            'Model Name': modelName,
            'Model ID': selectedModel?.id || 'N/A',
            'Scenario Focus': scenarioFocus,
            'Scenario Commitment': formatCurrencyForExport(whatIfCommitment),
            'Liquidity Coverage (pre → post)': liquidityCoverageText,
            'Prepared By': 'OneLP Portfolio Builder',
          },
        },
        {
          title: 'Current vs Target Allocation',
          type: 'table',
          data: {
            headers: ['Category', 'Current', 'Target', 'Drift'],
            rows: sortedDriftRows.slice(0, 12).map((item) => [
              `${item.dimensionLabel}: ${item.name}`,
              formatPercentForExport(item.current),
              formatPercentForExport(item.target),
              formatPercentForExport(item.drift),
            ]),
          },
        },
        {
          title: 'Rebalancing Recommendations',
          type: 'table',
          data: {
            headers: ['Category', 'Action', 'Amount', 'Priority'],
            rows: rebalancingRecommendations.map((rec) => [
              `${rec.dimensionLabel}: ${rec.category}`,
              rec.action,
              formatCurrencyForExport(rec.adjustmentAmount),
              Math.abs(rec.drift) > 5 ? 'High' : 'Medium',
            ]),
          },
        },
        {
          title: 'Execution Plan (Fund-Level)',
          type: 'table',
          data: {
            headers: ['Dimension', 'Category', 'Fund', 'Action', 'Amount', 'Timeline', 'Constraint'],
            rows: executionPlanRows.map((row) => [
              row.dimensionLabel,
              row.category,
              row.fundName,
              row.action,
              formatCurrencyForExport(row.amount),
              row.timeline,
              row.constraint,
            ]),
          },
        },
        {
          title: 'What-If Analysis',
          type: 'summary',
          data: {
            Focus: scenarioFocus,
            'Proposed Commitment': formatCurrencyForExport(whatIfCommitment),
            'New Portfolio Value': formatCurrencyForExport(whatIfScenario.newTotalValue),
            'Increase': formatPercentForExport((whatIfCommitment / portfolioMetrics.totalPortfolioValue) * 100),
            'Liquidity Coverage (pre → post)': liquidityCoverageText,
            'Pacing Status': `${whatIfScenario.pacingStatus}${
              whatIfScenario.pacingGap ? ` (${formatCurrencyForExport(whatIfScenario.pacingGap)})` : ''
            }`,
          },
        },
        {
          title: 'Scenario Allocation Impact',
          type: 'table',
          data: {
            headers: ['Category', 'Current %', 'Projected %'],
            rows: whatIfScenario.updatedAllocations.slice(0, 10).map((entry) => [
              entry.name,
              formatPercentForExport(entry.currentPercentage),
              formatPercentForExport(entry.newPercentage),
            ]),
          },
        },
        {
          title: '5-Year Commitment Pacing Plan',
          type: 'table',
          data: {
            headers: ['Year', 'Suggested Commitments', 'Deployed Capital'],
            rows: commitmentPacing.map((p) => [
              p.year,
              formatCurrencyForExport(p.suggested),
              formatCurrencyForExport(p.deployed),
            ]),
          },
        },
      ],
    })

    doc.save(`portfolio-builder-report-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportExcel = async () => {
    const totalPositions = funds.length + directInvestments.length
    const scenarioFocus = `${whatIfScenario.focusDimensionLabel}: ${whatIfScenario.focusCategory}`

    exportToExcel({
      filename: `portfolio-builder-report-${new Date().toISOString().split('T')[0]}`,
      sheets: [
        {
          name: 'Summary',
          data: [
            ['Portfolio Builder Report'],
            ['Generated', formatDateForExport(new Date())],
            [],
            ['Metric', 'Value'],
            ['Total Portfolio Value', portfolioMetrics.totalPortfolioValue],
            ['Active Positions', totalPositions],
            ['Allocation Drift', driftSummary.averageDrift],
            ['Unfunded Commitments', portfolioMetrics.unfundedCommitments],
            ['Model Name', modelName],
            ['Model ID', selectedModel?.id || 'N/A'],
            ['Scenario Focus', scenarioFocus],
            ['Scenario Commitment', whatIfCommitment],
            [
              'Liquidity Coverage (pre → post)',
              `${formatMultiple(whatIfScenario.liquidityBefore, 2)} -> ${formatMultiple(
                whatIfScenario.liquidityAfter,
                2
              )}`,
            ],
          ],
        },
        {
          name: 'Allocation',
          data: [
            ['Dimension', 'Category', 'Current %', 'Target %', 'Drift %'],
            ...sortedDriftRows.map((item) => [
              item.dimensionLabel,
              item.name,
              item.current,
              item.target,
              item.drift,
            ]),
          ],
        },
        {
          name: 'Rebalancing',
          data: [
            ['Category', 'Action', 'Adjustment Amount', 'Drift %'],
            ...rebalancingRecommendations.map((rec) => [
              `${rec.dimensionLabel}: ${rec.category}`,
              rec.action,
              rec.adjustmentAmount,
              rec.drift,
            ]),
          ],
        },
        {
          name: 'Execution Plan',
          data: [
            ['Dimension', 'Category', 'Fund', 'Action', 'Amount', 'Timeline', 'Constraint'],
            ...executionPlanRows.map((row) => [
              row.dimensionLabel,
              row.category,
              row.fundName,
              row.action,
              row.amount,
              row.timeline,
              row.constraint,
            ]),
          ],
        },
        {
          name: 'Pacing Plan',
          data: [
            ['Year', 'Suggested Commitments', 'Deployed Capital'],
            ...commitmentPacing.map((p) => [p.year, p.suggested, p.deployed]),
          ],
        },
        {
          name: 'Scenario Impact',
          data: [
            ['Category', 'Current %', 'Projected %'],
            ...whatIfScenario.updatedAllocations.map((entry) => [
              entry.name,
              entry.currentPercentage,
              entry.newPercentage,
            ]),
          ],
        },
      ],
    })
  }

  const handleExportCSV = async () => {
    const scenarioFocus = `${whatIfScenario.focusDimensionLabel}: ${whatIfScenario.focusCategory}`
    const csvData: (string | number)[][] = [
      ['Portfolio Builder Export'],
      ['Generated', formatDateForExport(new Date())],
      ['Model Name', modelName],
      ['Model ID', selectedModel?.id || 'N/A'],
      ['Scenario Focus', scenarioFocus],
      ['Scenario Commitment', whatIfCommitment],
      [
        'Liquidity Coverage (pre → post)',
        `${formatMultiple(whatIfScenario.liquidityBefore, 2)} -> ${formatMultiple(
          whatIfScenario.liquidityAfter,
          2
        )}`,
      ],
      [],
      ['Allocation Drift'],
      ['Dimension', 'Category', 'Current %', 'Target %', 'Drift %'],
      ...sortedDriftRows.map((item) => [item.dimensionLabel, item.name, item.current, item.target, item.drift]),
      [],
      ['Execution Plan'],
      ['Dimension', 'Category', 'Fund', 'Action', 'Amount', 'Timeline', 'Constraint'],
      ...executionPlanRows.map((row) => [
        row.dimensionLabel,
        row.category,
        row.fundName,
        row.action,
        row.amount,
        row.timeline,
        row.constraint,
      ]),
      [],
      ['Scenario Impact'],
      ['Category', 'Current %', 'Projected %'],
      ...whatIfScenario.updatedAllocations.map((entry) => [
        entry.name,
        entry.currentPercentage,
        entry.newPercentage,
      ]),
    ]

    exportToCSV(csvData, `portfolio-allocation-${new Date().toISOString().split('T')[0]}`)
  }

  const handleQuickExport = useCallback(async () => {
    if (isQuickExporting) return
    setIsQuickExporting(true)
    try {
      await Promise.resolve(handleExportPDF())
    } finally {
      setIsQuickExporting(false)
    }
  }, [isQuickExporting, handleExportPDF])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'e') {
        event.preventDefault()
        handleQuickExport()
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [handleQuickExport])

  return (
    <div className="min-h-screen glass-page">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-6 lg:p-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl glass-panel border border-border/70 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    Portfolio Builder
                  </motion.span>
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-sm text-foreground/60 mt-0.5"
                >
                  Optimize allocations, rebalance holdings, and model target portfolios
                </motion.p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={handleQuickExport}
                disabled={isQuickExporting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-panel border border-border text-sm font-semibold text-foreground hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isQuickExporting ? (
                  <>
                    <Download className="w-4 h-4 animate-spin" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Quick Export
                    <span className="text-xs text-foreground/60">({shortcutLabel})</span>
                  </>
                )}
              </button>
              <ExportButton
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onExportCSV={handleExportCSV}
                label="Export Portfolio"
              />
              <button
                onClick={() => setSettingsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg glass-panel border border-border text-foreground hover:border-accent/40 hover:text-accent transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Target Settings</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Status Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass-panel rounded-xl border border-border p-6 shadow-2xl shadow-black/10">
            <div className="flex items-center gap-2 mb-3">
              <PieChartIcon className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Portfolio Value</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(portfolioMetrics.totalPortfolioValue)}
            </p>
            <p className="text-xs text-foreground/60">Total NAV</p>
          </div>

          <div
            className={`glass-panel rounded-xl border p-6 shadow-2xl shadow-black/10 ${
              driftSummary.needsRebalancing ? 'border-amber-300/70' : 'border-emerald-300/70'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {driftSummary.needsRebalancing ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              <h3 className="text-sm font-semibold text-foreground">Allocation Drift</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatPercent(driftSummary.totalDrift, 1)}
            </p>
            <p className="text-xs text-foreground/60">
              {driftSummary.needsRebalancing ? 'Rebalance recommended' : 'On target'}
            </p>
          </div>

          <div className="glass-panel rounded-xl border border-border p-6 shadow-2xl shadow-black/10">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Active Positions</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {funds.length + directInvestments.length}
            </p>
            <p className="text-xs text-foreground/60">{funds.length} funds, {directInvestments.length} direct</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 dark:from-orange-500/20 dark:to-orange-600/10 rounded-xl border border-orange-200/60 dark:border-orange-800/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-sm font-semibold text-foreground">Unfunded</h3>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(portfolioMetrics.unfundedCommitments)}
            </p>
            <p className="text-xs text-foreground/60">Available capacity</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            {/* Allocation & Exposure */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div data-animate data-tilt data-delay="0.02s" className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
                <h3 className="text-lg font-semibold text-foreground mb-4">Current Allocation by Manager</h3>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={currentAllocationPercentages.byManager}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={false}
                      >
                        {currentAllocationPercentages.byManager.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px' }}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => {
                          const entry = currentAllocationPercentages.byManager.find(e => e.name === value)
                          return `${value} (${entry?.percentage.toFixed(1)}%)`
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div data-animate data-tilt data-delay="0.05s" className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
                <h3 className="text-lg font-semibold text-foreground mb-4">Asset Class Exposure</h3>
                {currentAllocationPercentages.byAssetClass.length ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart 
                        data={currentAllocationPercentages.byAssetClass}
                        margin={{ top: 20, right: 40, bottom: 20, left: 40 }}
                      >
                        <PolarGrid stroke="#e2e8f0" strokeWidth={1.5} />
                        <PolarAngleAxis 
                          dataKey="name" 
                          tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                          tickLine={false}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          tick={false}
                          axisLine={false}
                          domain={[0, 'auto']}
                        />
                        <Radar
                          name="Exposure %"
                          dataKey="percentage"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fill="#6366f1"
                          fillOpacity={0.25}
                          dot={{ r: 3, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          wrapperStyle={{ fontSize: '11px', fontWeight: 500 }}
                          iconType="circle"
                          iconSize={8}
                          verticalAlign="bottom"
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-foreground/60 border border-dashed border-border rounded-xl">
                    No asset class data available.
                  </div>
                )}
              </div>

              <div data-animate data-tilt data-delay="0.08s" className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
                <h3 className="text-lg font-semibold text-foreground mb-4">Geographic Distribution</h3>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentAllocationPercentages.byGeography} margin={{ top: 10, right: 20, left: 10, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                        stroke="#cbd5e1"
                        tickLine={{ stroke: '#cbd5e1' }}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                        stroke="#cbd5e1"
                        tickLine={{ stroke: '#cbd5e1' }}
                        tickFormatter={(value) => `${value.toFixed(0)}%`}
                        width={50}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                      <Bar 
                        dataKey="percentage" 
                        fill="#059669" 
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                        name="Portfolio %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Target vs Current */}
            <div data-animate data-tilt data-delay="0.02s" className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
              <h3 className="text-lg font-semibold text-foreground mb-4">Target vs Current</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {driftSummary.perDimension.byManager.slice(0, 8).map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <span
                        className={`text-sm font-semibold ${
                          Math.abs(item.drift) > 5
                            ? 'text-red-600 dark:text-red-400'
                            : Math.abs(item.drift) > 2
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {item.drift > 0 ? '+' : ''}
                        {formatPercent(item.drift, 1)}
                      </span>
                    </div>
                    <div className="relative h-8 glass-panel border border-border/70 rounded-lg overflow-hidden">
                      <div
                        className="absolute h-full bg-blue-500/30 border-r-2 border-blue-500"
                        style={{ width: `${item.target}%` }}
                      />
                      <div
                        className={`absolute h-full ${
                          item.drift > 0 ? 'bg-red-500' : item.drift < 0 ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${item.current}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">
                          {formatPercent(item.current, 1)} / {formatPercent(item.target, 1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Rebalancing Tab */}
        {activeTab === 'rebalance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            {/* Rebalancing Alert */}
            {driftSummary.needsRebalancing && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Rebalancing Recommended</h3>
                    <p className="text-sm text-foreground/60 mb-4">
                      Your portfolio has drifted {formatPercent(driftSummary.totalDrift, 1)} from target allocations.
                      Consider rebalancing to maintain your desired risk profile.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rebalancing Recommendations */}
            <div data-animate data-tilt data-delay="0.05s" className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recommended Actions</h3>
              {actionableRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {actionableRecommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl border border-border glass-panel"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <ArrowRight className={`w-5 h-5 ${
                            rec.isOverweight 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`} />
                          <h4 className="text-sm font-semibold text-foreground">
                            {rec.action} {rec.category}
                          </h4>
                        </div>
                        <p className="text-xs text-foreground/60">
                          Focus: {rec.dimensionLabel}
                        </p>
                        <p className="text-xs text-foreground/60 mb-2">
                          Current: {formatPercent(rec.current, 1)} → Target: {formatPercent(rec.target, 1)}
                        </p>
                        {rec.fundPlans.length ? (
                          <div className="mt-3 space-y-2">
                            {rec.fundPlans.map((plan) => (
                              <div
                                key={`${rec.category}-${plan.fund.id}`}
                                className="text-xs border border-dashed border-border rounded-lg p-2 glass-panel"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-foreground">{plan.fund.name}</span>
                                  <span className="text-foreground/60">{plan.timeline}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-foreground/60">Amount</span>
                                  <span className="font-semibold text-foreground">
                                    {formatCurrency(plan.cashImpact)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-foreground/60">GP Constraint</span>
                                  <span className="text-foreground text-right">{plan.gpConstraint}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-foreground/60">
                            No eligible funds in this category. Review exposures manually.
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {rec.action} exposure by {formatCurrency(rec.adjustmentAmount)}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-lg glass-panel border ${
                          Math.abs(rec.drift) > 5
                            ? 'border-red-300/70 text-red-700'
                            : 'border-amber-300/70 text-amber-700'
                        }`}
                      >
                        <p className="text-lg font-bold">
                          {rec.drift > 0 ? '+' : ''}{formatPercent(rec.drift, 1)}
                        </p>
                        <p className="text-xs">drift</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-foreground/60">Portfolio is well-balanced. No rebalancing needed at this time.</p>
                </div>
              )}
            </div>

            {/* Impact Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div data-animate data-tilt data-delay="0.02s" className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
                <h3 className="text-lg font-semibold text-foreground mb-4">Rebalancing Impact</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 glass-panel border border-border rounded-lg">
                    <span className="text-sm text-foreground">Expected Transactions</span>
                    <span className="text-sm font-semibold text-foreground">{actionableRecommendations.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 glass-panel border border-border rounded-lg">
                    <span className="text-sm text-foreground">Total Adjustment</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(actionableRecommendations.reduce((sum, r) => sum + r.adjustmentAmount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 glass-panel border border-border rounded-lg">
                    <span className="text-sm text-foreground">Risk Reduction</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPercent(driftSummary.totalDrift * 0.8, 1)}
                    </span>
                  </div>
                </div>
              </div>

            <div data-animate data-tilt data-delay="0.05s" className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
                <h3 className="text-lg font-semibold text-foreground mb-4">Implementation Timeline</h3>
                <div className="space-y-3">
                  {['Month 1-2', 'Month 3-4', 'Month 5-6'].map((period, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{period}</p>
                        <p className="text-xs text-foreground/60">
                          {index === 0 ? 'Execute high-priority rebalancing' : 
                           index === 1 ? 'Deploy new capital to underweight categories' : 
                           'Monitor and fine-tune allocations'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* What-If Tab */}
        {activeTab === 'whatif' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            {/* Input Panel */}
            <div data-animate data-tilt data-delay="0.08s" className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
              <h3 className="text-lg font-semibold text-foreground mb-4">Scenario Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">New Commitment Amount</label>
                  <input
                    type="number"
                    value={whatIfCommitment}
                    onChange={(e) => setWhatIfCommitment(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-border rounded-xl glass-panel focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-foreground/60 mt-2">
                    Current: {formatCurrency(portfolioMetrics.totalPortfolioValue)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Target Dimension</label>
                  <select
                    value={scenarioDimension}
                    onChange={(event) => setScenarioDimension(event.target.value as DimensionKey)}
                    className="w-full px-4 py-3 border border-border rounded-xl glass-panel focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {DIMENSION_CONFIG.map((config) => (
                      <option key={config.key} value={config.key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-foreground/60 mt-2">Choose the lens for this scenario.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Target Category</label>
                  <select
                    value={scenarioCategory}
                    onChange={(event) => setScenarioCategory(event.target.value)}
                    disabled={!scenarioCategoryOptions.length}
                    className="w-full px-4 py-3 border border-border rounded-xl glass-panel focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                  >
                    {scenarioCategoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-foreground/60 mt-2">
                    New commitment will be allocated to this category.
                  </p>
                </div>
              </div>
            </div>

            {/* Impact Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div data-animate data-tilt className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
                <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio Impact</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-foreground/60 mb-1">New Portfolio Value</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(whatIfScenario.newTotalValue)}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        +{formatPercent((whatIfCommitment / portfolioMetrics.totalPortfolioValue) * 100, 1)} increase
                      </p>
                    </div>
                  <div className="p-4 glass-panel border border-purple-300/70 rounded-lg">
                      <p className="text-xs text-foreground/60 mb-1">Scenario Focus</p>
                      <p className="text-lg font-semibold text-foreground">{scenarioFocusLabel}</p>
                      <p className="text-xs text-foreground/60 mt-1">
                        Concentrating incremental capital into this slice.
                      </p>
                    </div>
                  </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 glass-panel border border-border rounded-lg">
                      <p className="text-xs text-foreground/60 mb-1">Liquidity Coverage</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatMultiple(whatIfScenario.liquidityAfter, 2)}{' '}
                        <span className="text-sm font-normal text-foreground/60">
                          ({formatMultiple(whatIfScenario.liquidityBefore, 2)} → {formatMultiple(whatIfScenario.liquidityAfter, 2)})
                        </span>
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          liquidityDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {liquidityDelta >= 0 ? 'Improves buffer' : 'Draws down buffer'}
                      </p>
                    </div>
                    <div className="p-4 glass-panel border border-amber-300/70 rounded-lg">
                      <p className="text-xs text-foreground/60 mb-1">Pacing Alignment</p>
                      <p className="text-lg font-semibold text-foreground">{whatIfScenario.pacingStatus}</p>
                      {whatIfScenario.pacingGap > 0 && (
                        <p className="text-xs text-foreground/60 mt-1">
                          Gap: {formatCurrency(whatIfScenario.pacingGap)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div data-animate data-tilt className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
                <h3 className="text-lg font-semibold text-foreground mb-4">Allocation Changes</h3>
                <p className="text-xs text-foreground/60 mb-4">
                  {whatIfScenario.focusDimensionLabel} view — capital directed to {whatIfScenario.focusCategory}.
                </p>
                <div className="space-y-3">
                  {whatIfScenario.updatedAllocations.slice(0, 6).map((alloc, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{alloc.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-foreground/60">
                          {formatPercent(alloc.currentPercentage, 1)}
                        </span>
                        <ArrowRight className="w-4 h-4 text-foreground/40" />
                        <span className="text-sm font-semibold text-foreground">
                          {formatPercent(alloc.newPercentage, 1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pacing Tab */}
        {activeTab === 'pacing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            <div data-animate data-tilt className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
              <h3 className="text-lg font-semibold text-foreground mb-4">5-Year Commitment Pacing</h3>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={commitmentPacing} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                      stroke="#cbd5e1"
                      tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                      stroke="#cbd5e1"
                      tickLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                      width={70}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                      iconType="rect"
                      iconSize={12}
                    />
                    <Bar 
                      dataKey="suggested" 
                      fill="#059669" 
                      name="Suggested Annual" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={50}
                    />
                    <Bar 
                      dataKey="deployed" 
                      fill="#2563eb" 
                      name="Deployed to Date" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
                <h3 className="text-lg font-semibold text-foreground mb-4">Pacing Recommendations</h3>
                <div className="space-y-3">
                  {commitmentPacing.map((year, index) => (
                    <div key={index} className="flex items-center justify-between p-3 glass-panel border border-border rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">{year.year}</p>
                        <p className="text-xs text-foreground/60">Annual commitment</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{formatCurrency(year.suggested)}</p>
                        <p className="text-xs text-foreground/60">
                          {year.deployed > 0 && `${formatPercent((year.deployed / year.suggested) * 100, 0)} deployed`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10">
                <h3 className="text-lg font-semibold text-foreground mb-4">Pacing Strategy</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Steady State</h4>
                    <p className="text-xs text-foreground/60">
                      Maintain consistent annual commitments of ~{formatCurrency(portfolioMetrics.unfundedCommitments / 5)} 
                      to match distributions and maintain portfolio size.
                    </p>
                  </div>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Growth Mode</h4>
                    <p className="text-xs text-foreground/60">
                      Increase near-term commitments by 20% to grow portfolio and improve vintage diversification.
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Vintage Diversification</h4>
                    <p className="text-xs text-foreground/60">
                      Spread commitments across 2-3 vintages per year to reduce vintage concentration risk.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Target Settings Modal */}
        {settingsModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSettingsModalOpen(false)}>
            <div className="glass-panel border border-border rounded-2xl shadow-2xl shadow-black/20 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 glass-header border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Target Settings</h2>
                  <p className="text-sm text-foreground/60 mt-1">Manage target models and allocation targets</p>
                </div>
                <button
                  onClick={() => setSettingsModalOpen(false)}
                  className="p-2 glass-panel border border-border rounded-lg transition-colors hover:border-accent/50"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Target Models</h3>
                        <p className="text-xs text-foreground/60">Store policies and shareable allocation templates</p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full glass-panel border border-border/70 text-foreground/70">
                        {models.length} saved
                      </span>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Active model</label>
                      <select
                        value={selectedModel?.id || ''}
                        disabled={!models.length}
                        onChange={(event) => setSelectedModelId(event.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-xl glass-panel border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                      >
                        {models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Model name</label>
                      <input
                        type="text"
                        value={modelName}
                        onChange={(event) => setModelName(event.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-xl glass-panel border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="Enter model name"
                      />
                      <p className="text-[11px] text-foreground/60 mt-1">
                        Used in exports and rebalancing recommendations
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSaveModel}
                        disabled={!selectedModel || modelSaving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        Save changes
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateModel}
                        disabled={modelSaving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-panel border border-border text-sm font-semibold text-foreground hover:border-accent/40"
                      >
                        <FolderPlus className="w-4 h-4" />
                        New model
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteModel}
                        disabled={!selectedModel || models.length <= 1 || modelSaving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/40 text-sm font-semibold text-destructive hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                    {modelMessage && (
                      <p
                        className={`text-xs font-medium ${
                          modelMessage.toLowerCase().includes('unable')
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {modelMessage}
                      </p>
                    )}
                  </div>

                  <div className="xl:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {DIMENSION_CONFIG.map((config) => {
                        const categories = dimensionCategories[config.key]
                        return (
                          <div
                            key={config.key}
                            className="glass-panel rounded-2xl border border-border p-5 shadow-2xl shadow-black/10 flex flex-col"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-base font-semibold text-foreground">{config.label} Targets</h4>
                                <p className="text-xs text-foreground/60">
                                  Target coverage: {formatPercent(dimensionTargetTotals[config.key], 1)} (goal 100%)
                                </p>
                              </div>
                              <span className="text-[11px] font-semibold text-foreground/70">
                                ±{formatPercent(config.tolerance, 1)} tol.
                              </span>
                            </div>
                            <div className="space-y-3 mt-4 flex-1 overflow-y-auto pr-1 max-h-[400px]">
                              {categories.length ? (
                                categories.map((category) => {
                                  const current =
                                    currentAllocationPercentages[config.key].find((item) => item.name === category)
                                      ?.percentage || 0
                                  const target = targetAllocations[config.key]?.[category] ?? 0
                                  const drift = current - target
                                  const isLocked = current > 0.001
                                  const driftColor =
                                    Math.abs(drift) > config.tolerance
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-foreground'

                                  return (
                                    <div key={category} className="border border-border rounded-xl p-3 space-y-3">
                                      <div className="flex items-center justify-between gap-2">
                                        <div>
                                          <p className="text-sm font-semibold text-foreground">{category}</p>
                                          <p className="text-xs text-foreground/60">
                                            Current: {formatPercent(current, 1)}
                                          </p>
                                        </div>
                                        {!isLocked && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveCategory(config.key, category)}
                                            className="inline-flex items-center gap-1 text-[11px] text-foreground/60 hover:text-red-500"
                                          >
                                            <MinusCircle className="w-4 h-4" />
                                            Remove
                                          </button>
                                        )}
                                      </div>
                                      <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                          <label className="text-[11px] text-foreground/60 block mb-1">Target %</label>
                                          <input
                                            type="number"
                                            step="0.1"
                                            value={Number.isFinite(target) ? target : 0}
                                            onChange={(event) =>
                                              handleTargetValueChange(
                                                config.key,
                                                category,
                                                Number(event.target.value)
                                              )
                                            }
                                            className="w-full px-3 py-2 rounded-xl glass-panel border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                          />
                                        </div>
                                        <div className="text-right">
                                          <p className={`text-sm font-semibold ${driftColor}`}>
                                            {drift > 0 ? '+' : ''}
                                            {formatPercent(drift, 1)}
                                          </p>
                                          <p className="text-[11px] text-foreground/60">drift</p>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })
                              ) : (
                                <div className="text-xs text-foreground/60 border border-dashed border-border rounded-xl p-4 text-center">
                                  No categories yet. Add a target below.
                                </div>
                              )}
                            </div>
                            <div className="mt-4 flex gap-2">
                              <input
                                type="text"
                                value={newCategoryInputs[config.key]}
                                onChange={(event) =>
                                  setNewCategoryInputs((prev) => ({
                                    ...prev,
                                    [config.key]: event.target.value,
                                  }))
                                }
                                placeholder={`Add ${config.label.toLowerCase()} category`}
                                className="flex-1 px-3 py-2 rounded-xl glass-panel border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddCategory(config.key)}
                                disabled={!newCategoryInputs[config.key]?.trim()}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl glass-panel border border-border text-sm font-semibold text-foreground hover:border-accent/50 disabled:opacity-50"
                              >
                                <PlusCircle className="w-4 h-4" />
                                Add
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  )
}
