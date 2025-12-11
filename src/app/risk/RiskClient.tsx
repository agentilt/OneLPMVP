'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  AlertCircle,
  TrendingUp,
  PieChart,
  Activity,
  ChevronRight,
  Trash2,
  Settings,
  X,
  Download,
  Sparkles,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { ExportButton } from '@/components/ExportButton'
import { RiskScoreGauge } from '@/components/risk/RiskScoreGauge'
import { ConcentrationHeatmap } from '@/components/risk/ConcentrationHeatmap'
import { ViolationsAlert } from '@/components/risk/ViolationsAlert'
import { LiquidityTimeline } from '@/components/risk/LiquidityTimeline'
import { StressTestPanel } from '@/components/risk/StressTestPanel'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { RiskPolicyConfig, RiskReport, RiskScenarioResult, RiskPolicyBreach } from '@/lib/riskEngine'
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  formatCurrencyForExport,
  formatPercentForExport,
  formatDateForExport,
} from '@/lib/exportUtils'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
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
  assetClass: string
  sector?: string | null
  baseCurrency?: string
  leverage?: number
}

interface DirectInvestment {
  id: string
  name: string
  industry: string | null
  investmentAmount: number | null
  currentValue: number | null
  assetClass: string
  investmentType?: string | null
  propertyAddress?: string | null
  assetLocation?: string | null
  currency?: string | null
}

interface RiskSnapshotEntry {
  id: string
  snapshotDate: string
  overallRiskScore: number
  concentrationRiskScore: number
  liquidityRiskScore: number
  totalPortfolio: number
  unfundedCommitments: number
  liquidityCoverage: number
}

interface CustomScenario {
  id: string
  name: string
  description?: string | null
  navShock: number
  callMultiplier: number
  distributionMultiplier: number
  createdAt: string
}

type NumericPolicyKey =
  | 'maxSingleFundExposure'
  | 'maxGeographyExposure'
  | 'maxSectorExposure'
  | 'maxVintageExposure'
  | 'maxManagerExposure'
  | 'maxAssetClassExposure'
  | 'maxUnfundedCommitments'
  | 'minLiquidityReserve'
  | 'minLiquidityCoverage'
  | 'targetLiquidityBuffer'
  | 'maxPortfolioLeverage'
  | 'minNumberOfFunds'
  | 'targetDiversificationScore'
  | 'minAcceptableTVPI'
  | 'minAcceptableDPI'
  | 'minAcceptableIRR'
  | 'maxCurrencyExposure'

interface PolicyFieldConfig {
  key: NumericPolicyKey
  label: string
  suffix?: string
  min?: number
  max?: number
  step?: number
  scale?: number
  helper?: string
}

interface RiskMetrics {
  totalPortfolio: number
  totalCommitment: number
  totalPaidIn?: number
  unfundedCommitments: number
  assetClassConcentration: { [key: string]: number }
  geographyConcentration: { [key: string]: number }
}

interface RiskClientProps {
  funds: Fund[]
  directInvestments: DirectInvestment[]
  assetClasses: string[]
  policy: RiskPolicyConfig | null
}

const COLORS = ['#4b6c9c', '#2d7a5f', '#6d5d8a', '#c77340', '#3b82f6', '#10b981', '#ef4444', '#a85f35']

export function RiskClient({ funds, directInvestments, assetClasses, policy }: RiskClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'concentration' | 'stress' | 'liquidity'>('overview')
  const [filterMode, setFilterMode] = useState<'portfolio' | 'fund' | 'assetClass'>('portfolio')
  const [selectedFundId, setSelectedFundId] = useState('all')
  const [selectedAssetClass, setSelectedAssetClass] = useState('all')
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null)
  const [riskLoading, setRiskLoading] = useState(false)
  const [riskError, setRiskError] = useState<string | null>(null)
  const [focusLabel, setFocusLabel] = useState('Entire portfolio')
  const [policyBreaches, setPolicyBreaches] = useState<RiskPolicyBreach[]>([])
  const [policyState, setPolicyState] = useState<RiskPolicyConfig | null>(policy)
  const [policySaving, setPolicySaving] = useState(false)
  const [policySaveMessage, setPolicySaveMessage] = useState<string | null>(null)
  const [customScenarios, setCustomScenarios] = useState<CustomScenario[]>([])
  const [scenariosLoading, setScenariosLoading] = useState(false)
  const [scenarioForm, setScenarioForm] = useState({
    name: '',
    navShockPercent: -20,
    callMultiplier: 1.2,
    distributionMultiplier: 0.7,
  })
  const [scenarioSaving, setScenarioSaving] = useState(false)
  const [scenarioMessage, setScenarioMessage] = useState<string | null>(null)
  const [scenarioError, setScenarioError] = useState<string | null>(null)
  const [riskHistory, setRiskHistory] = useState<RiskSnapshotEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [snapshotSaving, setSnapshotSaving] = useState(false)
  const [varMethod, setVarMethod] = useState<'historical' | 'parametric' | 'monteCarlo'>('historical')
  const [policyModalOpen, setPolicyModalOpen] = useState(false)
  const [isQuickExporting, setIsQuickExporting] = useState(false)
  const promptIdeas = [
    'Highlight managers breaching policy thresholds',
    'Where are we over 20% in any asset class?',
    'Run a -25% NAV shock and show liquidity gap',
    'List funds without NAV update in 90 days',
  ]

  const triggerCopilotPrompt = (prompt: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('onelp-copilot-prompt', { detail: { prompt } }))
    }
  }

  const shortcutLabel = useMemo(() => {
    if (typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')) {
      return '⌘⇧E'
    }
    return 'Ctrl+Shift+E'
  }, [])

  useEffect(() => {
    if (filterMode !== 'fund') {
      setSelectedFundId('all')
    }
    if (filterMode !== 'assetClass') {
      setSelectedAssetClass('all')
    }
  }, [filterMode])

  const fetchRiskMetrics = useCallback(async () => {
    setRiskLoading(true)
    setRiskError(null)
    try {
      const response = await fetch('/api/risk/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: filterMode,
          fundId: filterMode === 'fund' && selectedFundId !== 'all' ? selectedFundId : undefined,
          assetClass:
            filterMode === 'assetClass' && selectedAssetClass !== 'all'
              ? selectedAssetClass
              : undefined,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to load risk metrics')
      }
      const data = await response.json()
      setRiskReport(data.report)
      setFocusLabel(data.focus?.label || 'Entire portfolio')
      setPolicyBreaches(data.report?.policyBreaches || [])
      if (data.policy) {
        setPolicyState(data.policy)
      }
      if (Array.isArray(data.customScenarios)) {
        setCustomScenarios(data.customScenarios)
      }
    } catch (error) {
      console.error('Risk metrics fetch error', error)
      setRiskError('Unable to load risk metrics')
    } finally {
      setRiskLoading(false)
    }
  }, [filterMode, selectedFundId, selectedAssetClass])

  useEffect(() => {
    fetchRiskMetrics()
  }, [fetchRiskMetrics])

  const fetchRiskHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const response = await fetch('/api/risk/history?limit=60')
      if (!response.ok) {
        throw new Error('Failed to load history')
      }
      const data = await response.json()
      setRiskHistory(Array.isArray(data.snapshots) ? data.snapshots : [])
    } catch (error) {
      console.error('Unable to fetch history', error)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRiskHistory()
  }, [fetchRiskHistory])

  const fetchCustomScenarios = useCallback(async () => {
    setScenariosLoading(true)
    try {
      const response = await fetch('/api/risk/scenarios')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load scenarios')
      }
      const data = await response.json()
      setCustomScenarios(Array.isArray(data.scenarios) ? data.scenarios : [])
    } catch (error: any) {
      console.error('Unable to fetch scenarios', error)
      setScenarioError(error.message || 'Failed to load scenarios')
    } finally {
      setScenariosLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomScenarios()
  }, [fetchCustomScenarios])

  const filteredFunds = useMemo(() => {
    if (filterMode === 'fund' && selectedFundId !== 'all') {
      return funds.filter((fund) => fund.id === selectedFundId)
    }
    if (filterMode === 'assetClass' && selectedAssetClass !== 'all') {
      return funds.filter((fund) => fund.assetClass === selectedAssetClass)
    }
    return funds
  }, [funds, filterMode, selectedFundId, selectedAssetClass])

  const filteredDirectInvestments = useMemo(() => {
    if (filterMode === 'fund' && selectedFundId !== 'all') {
      return []
    }
    if (filterMode === 'assetClass' && selectedAssetClass !== 'all') {
      return directInvestments.filter((di) => di.assetClass === selectedAssetClass)
    }
    return directInvestments
  }, [directInvestments, filterMode, selectedAssetClass, selectedFundId])

  const currentRiskMetrics: RiskMetrics =
    riskReport?.metrics ?? {
      totalPortfolio: 0,
      totalCommitment: 0,
      unfundedCommitments: 0,
      assetClassConcentration: {},
      geographyConcentration: {},
    }
  const scenarioSummaries: RiskScenarioResult[] = riskReport?.scenarios ?? []
  const liquiditySummary = riskReport?.liquidity ?? null

  const fundsForDisplay = filterMode === 'portfolio' ? funds : filteredFunds
  const directInvestmentsForDisplay =
    filterMode === 'portfolio' ? directInvestments : filteredDirectInvestments

  const focusDescription = focusLabel
  const riskScore = ((riskReport?.riskScores.overall ?? 0) / 10).toFixed(1)
  const latestSnapshotLabel = useMemo(() => {
    if (!riskHistory.length) return null
    return new Date(riskHistory[0].snapshotDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }, [riskHistory])

  // Prepare data for charts
  const assetClassData = riskReport
    ? riskReport.exposures.assetClass.map((entry) => ({
        name: entry.name,
        value: entry.amount,
        percentage: entry.percentage,
      }))
    : []

  const managerData = riskReport
    ? riskReport.exposures.manager.map((entry) => ({
        name: entry.name,
        value: entry.amount,
        percentage: entry.percentage,
      }))
    : []

  const geographyData = riskReport
    ? riskReport.exposures.geography.map((entry) => ({
        name: entry.name,
        value: entry.amount,
        percentage: entry.percentage,
      }))
    : []

  const policyViolationCount = policyBreaches.length

  const timelineData = useMemo(() => {
    if (liquiditySummary?.schedule?.length) {
      return liquiditySummary.schedule.map((point) => ({
        period: point.period,
        capitalCalls: point.capitalCalls,
        distributions: point.distributions,
        net: point.net,
      }))
    }
    const base = currentRiskMetrics.unfundedCommitments
    return [
      { period: 'Q1', capitalCalls: base * 0.15, distributions: base * 0.05, net: base * 0.05 - base * 0.15 },
      { period: 'Q2', capitalCalls: base * 0.18, distributions: base * 0.06, net: base * 0.06 - base * 0.18 },
      { period: 'Q3', capitalCalls: base * 0.12, distributions: base * 0.05, net: base * 0.05 - base * 0.12 },
      { period: 'Q4', capitalCalls: base * 0.16, distributions: base * 0.05, net: base * 0.05 - base * 0.16 },
    ]
  }, [liquiditySummary, currentRiskMetrics.unfundedCommitments])

  const avgQuarterlyCall =
    liquiditySummary?.averageQuarterlyCall ?? currentRiskMetrics.unfundedCommitments * 0.15
  const deploymentYears =
    liquiditySummary?.deploymentYears ??
    (avgQuarterlyCall > 0
      ? (currentRiskMetrics.unfundedCommitments / Math.max(avgQuarterlyCall, 1)) / 4
      : 0)

  const historySeries = useMemo(() => {
    const reversed = [...riskHistory]
      .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime())
      .map((entry) => ({
        date: new Date(entry.snapshotDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        risk: entry.overallRiskScore,
        liquidity: entry.liquidityCoverage,
      }))

    if (riskReport) {
      reversed.push({
        date: 'Today',
        risk: riskReport.riskScores.overall,
        liquidity: liquiditySummary?.liquidityCoverage ?? 0,
      })
    }

    return reversed.slice(-12)
  }, [riskHistory, riskReport, liquiditySummary])

  const correlationMatrix = useMemo(() => {
    const topClasses = assetClassData.slice(0, Math.min(assetClassData.length, 5))
    return topClasses.map((row, rowIndex) => ({
      name: row.name,
      values: topClasses.map((col, colIndex) => {
        if (rowIndex === colIndex) return 1
        const diff = Math.abs(row.percentage - col.percentage)
        const exposureFactor = Math.max(row.percentage, col.percentage) / 100
        const base = Math.max(0.1, 1 - diff / 100)
        const correlated = Math.min(0.95, base * (0.6 + exposureFactor * 0.4))
        return Number(correlated.toFixed(2))
      }),
    }))
  }, [assetClassData])

  const varMetrics = useMemo(() => {
    return calculateVarMetrics(
      varMethod,
      historySeries,
      scenarioSummaries,
      currentRiskMetrics.totalPortfolio,
      assetClassData,
      correlationMatrix
    )
  }, [varMethod, historySeries, scenarioSummaries, currentRiskMetrics.totalPortfolio, assetClassData, correlationMatrix])

  const policyFieldGroups: Array<{
    title: string
    description: string
    fields: PolicyFieldConfig[]
  }> = [
    {
      title: 'Concentration Limits',
      description: 'Set maximum exposure thresholds across portfolio dimensions',
      fields: [
        { key: 'maxSingleFundExposure', label: 'Max Single Fund', suffix: '%', min: 0, max: 100 },
        { key: 'maxAssetClassExposure', label: 'Max Asset Class', suffix: '%', min: 0, max: 100 },
        { key: 'maxGeographyExposure', label: 'Max Geography', suffix: '%', min: 0, max: 100 },
        { key: 'maxSectorExposure', label: 'Max Sector', suffix: '%', min: 0, max: 100 },
        { key: 'maxManagerExposure', label: 'Max Manager', suffix: '%', min: 0, max: 100 },
        { key: 'maxVintageExposure', label: 'Max Vintage', suffix: '%', min: 0, max: 100 },
        { key: 'maxCurrencyExposure', label: 'Max Currency', suffix: '%', min: 0, max: 100 },
      ],
    },
    {
      title: 'Liquidity & Leverage',
      description: 'Control capital call pacing and reserve buffers',
      fields: [
        { key: 'maxUnfundedCommitments', label: 'Max Unfunded Commitments', suffix: '%', min: 0, max: 100 },
        { key: 'minLiquidityReserve', label: 'Min Liquidity Reserve', suffix: '%', min: 0, max: 100 },
        { key: 'minLiquidityCoverage', label: 'Min Liquidity Coverage', suffix: 'x', min: 0, step: 0.1 },
        { key: 'targetLiquidityBuffer', label: 'Target Liquidity Buffer', suffix: '%', min: 0, max: 100, scale: 100 },
        { key: 'maxPortfolioLeverage', label: 'Max Look-through Leverage', suffix: 'x', min: 0, step: 0.1 },
      ],
    },
    {
      title: 'Performance & Diversification',
      description: 'Set performance minimums and diversification targets',
      fields: [
        { key: 'minNumberOfFunds', label: 'Min Number of Funds', min: 1, step: 1 },
        { key: 'targetDiversificationScore', label: 'Target Diversification Score', step: 0.05, min: 0, max: 1 },
        { key: 'minAcceptableTVPI', label: 'Min Acceptable TVPI', step: 0.1, min: 0 },
        { key: 'minAcceptableDPI', label: 'Min Acceptable DPI', step: 0.1, min: 0 },
        { key: 'minAcceptableIRR', label: 'Min Acceptable IRR', suffix: '%', min: 0 },
      ],
    },
  ]

  const handlePolicyInputChange = (key: keyof RiskPolicyConfig, rawValue: string) => {
    const parsed = rawValue === '' ? 0 : Number(rawValue)
    if (Number.isNaN(parsed)) {
      return
    }
    setPolicyState((prev) => ({
      ...(prev || {}),
      [key]: parsed,
    }))
  }

  const handleSavePolicy = async () => {
    if (!policyState) return
    setPolicySaving(true)
    setPolicySaveMessage(null)
    try {
      const response = await fetch('/api/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policyState),
      })
      if (!response.ok) {
        throw new Error('Failed to update policy')
      }
      const data = await response.json()
      setPolicyState(data.policy)
      setPolicySaveMessage('Policy settings updated')
      await fetchRiskMetrics()
    } catch (error: any) {
      setPolicySaveMessage(error.message || 'Unable to update policy')
    } finally {
      setPolicySaving(false)
    }
  }

  const handleResetPolicy = async () => {
    setPolicySaving(true)
    setPolicySaveMessage(null)
    try {
      const response = await fetch('/api/policies', { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to reset policy')
      }
      await fetchRiskMetrics()
      setPolicySaveMessage('Policy reset to defaults')
    } catch (error: any) {
      setPolicySaveMessage(error.message || 'Unable to reset policy')
    } finally {
      setPolicySaving(false)
    }
  }

  const getPolicyDisplayValue = (field: PolicyFieldConfig) => {
    if (!policyState) return ''
    const rawValue = policyState[field.key]
    if (rawValue === undefined || rawValue === null) return ''
    return field.scale ? (rawValue * field.scale).toString() : rawValue.toString()
  }

  const handlePolicyFieldChange = (field: PolicyFieldConfig, raw: string) => {
    if (field.scale) {
      const numeric = raw === '' ? 0 : Number(raw)
      if (Number.isNaN(numeric)) return
      handlePolicyInputChange(field.key, (numeric / field.scale).toString())
    } else {
      handlePolicyInputChange(field.key, raw)
    }
  }

  const handleScenarioFieldChange = (field: keyof typeof scenarioForm, value: string) => {
    setScenarioForm((prev) => ({
      ...prev,
      [field]: field === 'name' ? value : Number(value),
    }))
    setScenarioError(null)
    setScenarioMessage(null)
  }

  const handleCaptureSnapshot = async () => {
    setSnapshotSaving(true)
    try {
      const response = await fetch('/api/risk/snapshot', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Failed to capture snapshot')
      }
      await Promise.all([fetchRiskHistory(), fetchRiskMetrics()])
    } catch (error) {
      console.error('Snapshot capture failed', error)
    } finally {
      setSnapshotSaving(false)
    }
  }

  const handleSaveScenario = async () => {
    if (!scenarioForm.name.trim()) {
      setScenarioError('Scenario name is required')
      return
    }
    setScenarioSaving(true)
    setScenarioMessage(null)
    setScenarioError(null)
    try {
      const response = await fetch('/api/risk/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scenarioForm.name.trim(),
          navShockPercent: Number(scenarioForm.navShockPercent),
          callMultiplier: Number(scenarioForm.callMultiplier),
          distributionMultiplier: Number(scenarioForm.distributionMultiplier),
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save scenario')
      }
      setScenarioMessage('Scenario saved')
      setScenarioForm({
        name: '',
        navShockPercent: -20,
        callMultiplier: 1.2,
        distributionMultiplier: 0.7,
      })
      await Promise.all([fetchCustomScenarios(), fetchRiskMetrics()])
    } catch (error: any) {
      setScenarioError(error.message || 'Unable to save scenario')
    } finally {
      setScenarioSaving(false)
    }
  }

  const handleDeleteScenario = async (id: string) => {
    setScenarioMessage(null)
    setScenarioError(null)
    try {
      const response = await fetch(`/api/risk/scenarios/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete scenario')
      }
      setScenarioMessage('Scenario deleted')
      await Promise.all([fetchCustomScenarios(), fetchRiskMetrics()])
    } catch (error: any) {
      setScenarioError(error.message || 'Unable to delete scenario')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'concentration', label: 'Concentration', icon: PieChart },
    { id: 'stress', label: 'Stress Testing', icon: Activity },
    { id: 'liquidity', label: 'Liquidity & VaR', icon: TrendingUp },
  ]

  // Export Functions
  const handleExportPDF = async () => {
    if (!riskReport) return
    const totalPositions = fundsForDisplay.length + directInvestmentsForDisplay.length
    const concentrationRisk = assetClassData.reduce(
      (max, item) => Math.max(max, item.percentage),
      0
    )
    const liquidityRisk =
      currentRiskMetrics.totalPortfolio > 0
        ? (currentRiskMetrics.unfundedCommitments / currentRiskMetrics.totalPortfolio) * 100
        : 0
    const dailyVaR = currentRiskMetrics.totalPortfolio * 0.02 * 1.65

    const doc = exportToPDF({
      title: 'Risk Management Report',
      subtitle: 'Portfolio Risk Analysis and Stress Testing',
      date: formatDateForExport(new Date()),
      sections: [
        {
          title: 'Risk Overview',
          type: 'metrics',
          data: [
            { label: 'Overall Risk Score', value: `${riskScore} / 10` },
            { label: 'Total Portfolio Value', value: formatCurrencyForExport(currentRiskMetrics.totalPortfolio) },
            { label: 'Active Positions', value: totalPositions.toString() },
            { label: 'Policy Violations', value: policyViolationCount.toString() },
            { label: 'Concentration Risk', value: formatPercentForExport(concentrationRisk) },
            { label: 'Liquidity Risk', value: formatPercentForExport(liquidityRisk) },
            { label: 'Last Snapshot', value: latestSnapshotLabel || 'Not captured' },
          ],
        },
        {
          title: 'Asset Class Allocation',
          type: 'table',
          data: {
            headers: ['Asset Class', 'Value', 'Percentage'],
            rows: assetClassData.map((item) => [
              item.name,
              formatCurrencyForExport(item.value),
              `${item.percentage.toFixed(1)}%`,
            ]),
          },
        },
        {
          title: 'Concentration Analysis',
          type: 'table',
          data: {
            headers: ['Category', 'Exposure', 'Percentage', 'Status'],
            rows: assetClassData.map((item) => {
              const pct = item.percentage
              const warningLevel = policyState?.maxAssetClassExposure ?? 30
              return [
                item.name,
                formatCurrencyForExport(item.value),
                `${item.percentage.toFixed(1)}%`,
                pct > warningLevel ? 'Violation' : pct > warningLevel * 0.85 ? 'Warning' : 'Within Policy',
              ]
            }),
          },
        },
        {
          title: 'Value at Risk (95% Confidence)',
          type: 'summary',
          data: {
            'Daily VaR': formatCurrencyForExport(dailyVaR),
            'Monthly VaR': formatCurrencyForExport(dailyVaR * 4.47),
            'Annual VaR': formatCurrencyForExport(dailyVaR * 15.87),
          },
        },
        ...(historySeries.length > 1
          ? [
              {
                title: 'Snapshot History',
                type: 'table' as const,
                data: {
                  headers: ['Date', 'Risk Score', 'Liquidity Coverage'],
                  rows: historySeries.slice(-8).map((point) => [
                    point.date,
                    point.risk.toFixed(1),
                    `${point.liquidity.toFixed(2)}x`,
                  ]),
                },
              },
            ]
          : []),
        {
          title: 'Scenario Analysis',
          type: 'table',
          data: {
            headers: ['Scenario', 'NAV Shock', 'Capital Calls', 'Distributions', 'Shortfall'],
            rows: scenarioSummaries.map((scenario) => [
              scenario.name,
              `${(scenario.navShock * 100).toFixed(0)}%`,
              formatCurrencyForExport(scenario.projectedCalls),
              formatCurrencyForExport(scenario.projectedDistributions),
              scenario.liquidityGap > 0 ? formatCurrencyForExport(scenario.liquidityGap) : 'Covered',
            ]),
          },
        },
        {
          title: 'Unfunded Commitments',
          type: 'table',
          data: {
            headers: ['Fund', 'Manager', 'Commitment', 'Paid In', 'Unfunded'],
            rows: fundsForDisplay.map((fund) => [
              fund.name,
              fund.manager,
              formatCurrencyForExport(fund.commitment),
              formatCurrencyForExport(fund.paidIn),
              formatCurrencyForExport(fund.commitment - fund.paidIn),
            ]),
          },
        },
      ],
    })

    doc.save(`risk-report-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportExcel = async () => {
    if (!riskReport) return
    const totalPositions = fundsForDisplay.length + directInvestmentsForDisplay.length
    const concentrationRisk = assetClassData.reduce(
      (max, item) => Math.max(max, item.percentage),
      0
    )
    const liquidityRisk =
      currentRiskMetrics.totalPortfolio > 0
        ? (currentRiskMetrics.unfundedCommitments / currentRiskMetrics.totalPortfolio) * 100
        : 0

    exportToExcel({
      filename: `risk-report-${new Date().toISOString().split('T')[0]}`,
      sheets: [
        {
          name: 'Risk Overview',
          data: [
            ['Risk Management Report'],
            ['Generated', formatDateForExport(new Date())],
            [],
            ['Metric', 'Value'],
            ['Overall Risk Score', `${riskScore} / 10`],
            ['Total Portfolio Value', formatCurrencyForExport(currentRiskMetrics.totalPortfolio)],
            ['Active Positions', totalPositions.toString()],
            ['Policy Violations', policyViolationCount.toString()],
            ['Concentration Risk', formatPercentForExport(concentrationRisk)],
            ['Liquidity Risk', formatPercentForExport(liquidityRisk)],
          ],
        },
        {
          name: 'Asset Allocation',
          data: [
            ['Asset Class', 'Value', 'Percentage'],
            ...assetClassData.map((item) => [
              item.name,
              item.value,
              `${item.percentage.toFixed(1)}%`,
            ]),
          ],
        },
        ...(historySeries.length > 1
          ? [
              {
                name: 'Snapshot History',
                data: [
                  ['Date', 'Risk Score', 'Liquidity Coverage'],
                  ...historySeries.slice(-12).map((point) => [
                    point.date,
                    point.risk.toFixed(1),
                    `${point.liquidity.toFixed(2)}x`,
                  ]),
                ],
              },
            ]
          : []),
        {
          name: 'Funds',
          data: [
            ['Fund', 'Manager', 'Domicile', 'Commitment', 'Paid In', 'NAV', 'Unfunded'],
            ...fundsForDisplay.map((fund) => [
              fund.name,
              fund.manager,
              fund.domicile,
              fund.commitment,
              fund.paidIn,
              fund.nav,
              fund.commitment - fund.paidIn,
            ]),
          ],
        },
        {
          name: 'Direct Investments',
          data: [
            ['Name', 'Industry', 'Investment', 'Current Value'],
            ...directInvestmentsForDisplay.map((di) => [
              di.name,
              di.industry || 'N/A',
              di.investmentAmount || 0,
              di.currentValue || 0,
            ]),
          ],
        },
        {
          name: 'Scenario Analysis',
          data: [
            ['Scenario', 'NAV Shock', 'Capital Calls', 'Distributions', 'Shortfall'],
            ...scenarioSummaries.map((scenario) => [
              scenario.name,
              `${(scenario.navShock * 100).toFixed(0)}%`,
              scenario.projectedCalls,
              scenario.projectedDistributions,
              scenario.liquidityGap > 0 ? scenario.liquidityGap : 0,
            ]),
          ],
        },
      ],
    })
  }

  const handleExportCSV = async () => {
    if (!riskReport) return
    const csvData = [
      ['Asset Class', 'Value', 'Percentage'],
      ...assetClassData.map((item) => [
        item.name,
        item.value.toString(),
        `${item.percentage.toFixed(1)}%`,
      ]),
    ]

    exportToCSV(csvData, `risk-asset-allocation-${new Date().toISOString().split('T')[0]}`)
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
    <div className="flex min-h-screen glass-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 p-6 lg:p-10 space-y-8">
        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="glass-panel rounded-3xl border border-border shadow-2xl shadow-black/10 p-6 sm:p-8"
        >
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Risk Management</h1>
                <p className="text-sm text-foreground/70 mt-2 max-w-2xl">
                  Copilot monitoring for concentration, stress, and liquidity—minimal and focused.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {promptIdeas.slice(0, 3).map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => triggerCopilotPrompt(prompt)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-full glass-panel border border-border text-xs font-semibold text-foreground/80 hover:border-accent/50 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <button
                onClick={() => setPolicyModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-border glass-panel text-foreground hover:border-accent/40 transition-colors"
                title="Risk Policy Settings"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Policy Settings</span>
              </button>
              <button
                onClick={handleQuickExport}
                disabled={isQuickExporting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border glass-panel text-sm font-semibold text-foreground hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                label="Export Report"
              />
            </div>
          </div>
        </motion.section>

        {riskError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">
            {riskError}
          </div>
        )}
        {riskLoading && (
          <div className="mb-4 rounded-xl border border-border glass-panel px-4 py-3 text-sm text-foreground/70">
            Updating risk metrics…
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mb-6"
        >
          <div className="glass-panel border border-border rounded-2xl p-4 shadow-2xl shadow-black/10 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-foreground/70">Focus:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Portfolio', value: 'portfolio' },
                  { label: 'Fund', value: 'fund' },
                  { label: 'Asset Class', value: 'assetClass' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilterMode(option.value as typeof filterMode)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                      filterMode === option.value
                        ? 'bg-accent text-white border-transparent shadow-lg shadow-accent/30'
                        : 'glass-panel border-border text-foreground/80 hover:border-accent/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {filterMode === 'fund' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                  Fund
                </label>
                <select
                  value={selectedFundId}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                  className="w-full md:w-72 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
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

            {filterMode === 'assetClass' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                  Asset Class
                </label>
                <select
                  value={selectedAssetClass}
                  onChange={(e) => setSelectedAssetClass(e.target.value)}
                  className="w-full md:w-72 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
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

            <p className="text-xs text-foreground/60">
              Viewing: {focusDescription}
              {latestSnapshotLabel ? ` · Last snapshot: ${latestSnapshotLabel}` : ''}
            </p>
          </div>
        </motion.div>


        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
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
          <>
            <ViolationsAlert violations={policyBreaches} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            >
              <SummaryStat label="Portfolio Value" value={formatCurrency(currentRiskMetrics.totalPortfolio)} icon={PieChart} />
              <SummaryStat
                label="Unfunded Commitments"
                value={formatCurrency(currentRiskMetrics.unfundedCommitments)}
                sublabel={`${formatPercent((currentRiskMetrics.unfundedCommitments / Math.max(currentRiskMetrics.totalCommitment, 1)) * 100)} of commitments`}
                icon={Activity}
              />
              <SummaryStat
                label="Pending Calls"
                value={formatCurrency(liquiditySummary?.pendingCalls ?? 0)}
                sublabel="Next 90 days"
                icon={AlertCircle}
              />
              <SummaryStat
                label="Policy Breaches"
                value={policyViolationCount.toString()}
                sublabel={policyViolationCount > 0 ? 'Requires attention' : 'Within policy'}
                icon={Shield}
              />
            </motion.div>

            {historySeries.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.5 }}
                className="glass-panel rounded-2xl border border-border p-6 mb-8 shadow-2xl shadow-black/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Snapshot Trend</h3>
                    <p className="text-xs text-foreground/60">Historical risk and liquidity coverage</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {historyLoading && <span className="text-xs text-foreground/60">Updating…</span>}
                    <button
                      onClick={handleCaptureSnapshot}
                      disabled={snapshotSaving}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border glass-panel hover:border-accent/40 disabled:opacity-50"
                    >
                      {snapshotSaving ? 'Capturing…' : 'Capture snapshot'}
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={historySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" hide={historySeries.length > 10} />
                    <YAxis yAxisId="left" stroke="#6b7280" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#6b7280" domain={[0, Math.max(...historySeries.map((d) => d.liquidity + 0.5), 2)]} hide />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="risk" stroke="#ef4444" name="Risk Score" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="liquidity" stroke="#0ea5e9" name="Liquidity Coverage" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <RiskScoreGauge
                title="Overall Risk Score"
                subtitle="Weighted concentration + liquidity"
                score={riskReport?.riskScores.overall ?? 0}
                max={100}
              />
              <ConcentrationHeatmap
                title="Asset Class Exposure"
                description="Share of NAV by asset class"
                data={assetClassData.map((entry) => ({ name: entry.name, percentage: entry.percentage }))}
                highlightLimit={policyState?.maxAssetClassExposure ?? 30}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ConcentrationHeatmap
                title="Geography Exposure"
                description="Monitor regional concentration"
                data={geographyData.map((entry) => ({ name: entry.name, percentage: entry.percentage }))}
                highlightLimit={policyState?.maxGeographyExposure ?? 40}
              />
              <StressTestPanel scenarios={scenarioSummaries} />
            </div>

            <LiquidityTimeline
              schedule={timelineData}
              pendingCalls={liquiditySummary?.pendingCalls ?? 0}
              next12MonthCalls={liquiditySummary?.next12MonthCalls}
              next24MonthCalls={liquiditySummary?.next24MonthCalls}
              liquidityCoverage={liquiditySummary?.liquidityCoverage}
            />
          </>
        )}
        {activeTab === 'concentration' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Concentration Analysis</h2>
              <p className="text-foreground/60 mb-6">
                Detailed breakdown of portfolio concentration across different dimensions
              </p>
              
              {/* Concentration Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-panel rounded-xl border border-border p-4 shadow-2xl shadow-black/10">
                  <p className="text-xs text-foreground/60 mb-1">Top Manager</p>
                  <p className="text-2xl font-bold text-foreground">
                    {managerData.length > 0 ? managerData[0].percentage.toFixed(1) : '0'}%
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {managerData.length > 0 ? managerData[0].name : 'N/A'}
                  </p>
                </div>
                
                <div className="glass-panel rounded-xl border border-border p-4 shadow-2xl shadow-black/10">
                  <p className="text-xs text-foreground/60 mb-1">Top Geography</p>
                  <p className="text-2xl font-bold text-foreground">
                    {geographyData.length > 0 ? Math.max(...geographyData.map(d => d.percentage)).toFixed(1) : '0'}%
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {geographyData.length > 0 ? geographyData.reduce((max, d) => (d.percentage > max.percentage ? d : max)).name : 'N/A'}
                  </p>
                </div>
                
                <div className="glass-panel rounded-xl border border-border p-4 shadow-2xl shadow-black/10">
                  <p className="text-xs text-foreground/60 mb-1">Number of Managers</p>
                  <p className="text-2xl font-bold text-foreground">{managerData.length}</p>
                  <p className="text-xs text-foreground/60 mt-1">Unique managers</p>
                </div>
                
                <div className="glass-panel rounded-xl border border-border p-4 shadow-2xl shadow-black/10">
                  <p className="text-xs text-foreground/60 mb-1">Diversification</p>
                  <p className="text-2xl font-bold text-foreground">
                    {managerData.length > 7 ? 'Good' : managerData.length > 3 ? 'Moderate' : 'Concentrated'}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">Portfolio spread</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Manager Concentration (Pie) */}
                <div data-animate data-tilt className="glass-panel rounded-2xl shadow-2xl shadow-black/10 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Manager Concentration</h3>
                  {managerData.length > 0 ? (
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 min-w-[240px]">
                        <ResponsiveContainer width="100%" height={260}>
                          <RePieChart>
                            <Pie
                              data={managerData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={95}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {managerData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                  stroke="#ffffff"
                                  strokeWidth={1.5}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload as (typeof managerData)[number]
                                  return (
                                    <div className="glass-panel border border-border rounded-xl px-4 py-3 shadow-xl text-sm">
                                      <p className="font-semibold text-foreground">{data.name}</p>
                                      <p className="text-foreground/60">{formatCurrency(data.value)}</p>
                                      <p className="text-foreground/60">{data.percentage.toFixed(1)}% of portfolio</p>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex-1 space-y-3">
                        {managerData.slice(0, 8).map((item, index) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl glass-panel border border-border"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                                <p className="text-xs text-foreground/60">Exposure {formatCurrency(item.value)}</p>
                              </div>
                            </div>
                            <p
                              className={`text-sm font-semibold ${
                                item.percentage > (policyState?.maxManagerExposure ?? 30)
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-foreground'
                              }`}
                            >
                              {item.percentage.toFixed(1)}%
                            </p>
                          </div>
                        ))}
                        {managerData.length > 8 && (
                          <p className="text-xs text-foreground/60 px-1">
                            Top 8 managers shown above; see breakdown for full list.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center text-foreground/40">
                      No data available
                    </div>
                  )}
                </div>

                {/* Geography Concentration (Bar) */}
                <div data-animate data-tilt className="glass-panel rounded-2xl shadow-2xl shadow-black/10 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Geographic Distribution</h3>
                  {geographyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={geographyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="value" fill="#4b6c9c" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-foreground/40">
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Manager Breakdown Table */}
                <div data-animate data-tilt className="glass-panel rounded-2xl shadow-2xl shadow-black/10 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Manager Breakdown</h3>
                  <div className="space-y-2">
                    {managerData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(item.value)}</p>
                          <p
                            className={`text-xs ${
                              item.percentage > (policyState?.maxManagerExposure ?? 30)
                                ? 'text-red-600 dark:text-red-400 font-semibold'
                                : 'text-foreground/60'
                            }`}
                          >
                            {item.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Geography Breakdown Table */}
                <div data-animate data-tilt className="glass-panel rounded-2xl shadow-2xl shadow-black/10 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Geography Breakdown</h3>
                  <div className="space-y-2">
                    {geographyData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(item.value)}</p>
                          <p
                            className={`text-xs ${
                              item.percentage > 40
                                ? 'text-red-600 dark:text-red-400 font-semibold'
                                : 'text-foreground/60'
                            }`}
                          >
                            {item.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {correlationMatrix.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="glass-panel rounded-2xl border border-border p-6 shadow-2xl shadow-black/10"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4">Asset Class Correlation</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-xs uppercase tracking-wide text-foreground/50 pb-2">Asset Class</th>
                        {correlationMatrix.map((col) => (
                          <th key={col.name} className="text-xs text-center uppercase tracking-wide text-foreground/50 pb-2">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlationMatrix.map((row) => (
                        <tr key={row.name}>
                          <td className="py-2 font-medium text-foreground">{row.name}</td>
                          {row.values.map((value, index) => (
                            <td key={`${row.name}-${index}`} className="py-1 text-center">
                              <span
                                className="inline-flex items-center justify-center w-12 rounded-full text-xs font-semibold text-white"
                                style={{
                                  backgroundColor: `rgba(244,63,94,${value * 0.6 + 0.2})`,
                                }}
                              >
                                {value.toFixed(2)}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-foreground/60 mt-3">
                  Calculated from relative exposure overlap; darker cells indicate higher expected co-movement.
                </p>
              </motion.div>
            )}
          </>
        )}

        {/* Stress Testing Tab */}
        {activeTab === 'stress' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Stress Testing & Scenario Analysis</h2>
              <p className="text-foreground/60 mb-6">
                Saved scenarios are configured in Risk Policy Settings and applied below alongside the default Base/Downside/Severe curves.
              </p>

              {customScenarios.length > 0 ? (
                <div className="glass-panel rounded-2xl border border-border p-6 mb-6 shadow-2xl shadow-black/10">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Custom Scenarios</h3>
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {customScenarios.map((scenario) => (
                      <div key={scenario.id} className="flex items-center justify-between border border-border dark:border-slate-800/60 rounded-xl p-3 text-sm">
                        <div>
                          <p className="font-semibold text-foreground">{scenario.name}</p>
                          <p className="text-foreground/60">NAV {(scenario.navShock * 100).toFixed(1)}% · Calls ×{scenario.callMultiplier.toFixed(2)} · Dists ×{scenario.distributionMultiplier.toFixed(2)}</p>
                        </div>
                        <span className="text-xs text-foreground/60">{new Date(scenario.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-6 text-sm text-foreground/60">No custom scenarios yet. Use the Policy Settings button to create one.</div>
              )}

              <StressTestPanel scenarios={scenarioSummaries} />
            </motion.div>
          </>
        )}
        {/* Liquidity & VaR Tab */}
        {activeTab === 'liquidity' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Liquidity Analysis & Value at Risk</h2>
              <p className="text-foreground/60 mb-6">
                Monitor unfunded commitments, liquidity requirements, and value at risk metrics
              </p>

              {/* Key Liquidity Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 rounded-xl border border-blue-200/60 dark:border-blue-800/60 p-4">
                  <p className="text-xs text-foreground/60 mb-1">Unfunded Commitments</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(currentRiskMetrics.unfundedCommitments)}</p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {formatPercent((currentRiskMetrics.unfundedCommitments / currentRiskMetrics.totalCommitment) * 100, 1)} of commitments
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 p-4">
                  <p className="text-xs text-foreground/60 mb-1">Liquidity Coverage</p>
                  <p className="text-2xl font-bold text-foreground">
                    {liquiditySummary ? `${liquiditySummary.liquidityCoverage.toFixed(2)}x` : '—'}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">
                    {liquiditySummary
                      ? liquiditySummary.liquidityCoverage < (policyState?.minLiquidityCoverage ?? 1.5)
                        ? 'Below policy target'
                        : 'Within policy'
                      : 'Awaiting data'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 rounded-xl border border-amber-200/60 dark:border-amber-800/60 p-4">
                  <p className="text-xs text-foreground/60 mb-1">Avg. Quarterly Call</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(avgQuarterlyCall)}</p>
                  <p className="text-xs text-foreground/60 mt-1">Est. based on pace</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10 rounded-xl border border-purple-200/60 dark:border-purple-800/60 p-4">
                  <p className="text-xs text-foreground/60 mb-1">Est. Duration</p>
                  <p className="text-2xl font-bold text-foreground">
                    {deploymentYears > 0 ? deploymentYears.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1">Years to deploy</p>
                </div>
              </div>

              {/* Unfunded Timeline */}
              <div data-animate data-tilt className="glass-panel rounded-2xl shadow-2xl shadow-black/10 border border-border p-6 mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Projected Capital Call Timeline</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={timelineData}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      formatter={(value: number, name) =>
                        [formatCurrency(value), name === 'capitalCalls' ? 'Capital Calls' : 'Distributions']
                      }
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="capitalCalls"
                      stroke="#4b6c9c"
                      fill="#4b6c9c"
                      fillOpacity={0.3}
                      name="Capital Calls"
                    />
                    <Area
                      type="monotone"
                      dataKey="distributions"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.2}
                      name="Distributions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* VaR and Risk Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div data-animate data-tilt className="glass-panel rounded-2xl shadow-2xl shadow-black/10 border border-border p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Value at Risk (VaR)</h3>
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      {(['historical', 'parametric', 'monteCarlo'] as VarMethod[]).map((method) => (
                        <button
                          key={method}
                          onClick={() => setVarMethod(method)}
                        className={`px-3 py-1.5 rounded-full font-semibold transition-colors border ${
                            varMethod === method
                            ? 'bg-accent text-white border-transparent shadow-lg shadow-accent/30'
                            : 'glass-panel border-border text-foreground/80 hover:border-accent/40'
                          }`}
                        >
                          {method === 'historical'
                            ? 'Historical'
                            : method === 'parametric'
                            ? 'Parametric'
                            : 'Monte Carlo'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground">Daily VaR (95%)</span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(varMetrics.daily)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/60">
                        Based on {varMethod === 'historical' ? 'rolling risk snapshots' : varMethod === 'parametric' ? 'asset class volatility' : 'scenario simulations'}
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground">Monthly VaR</span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(varMetrics.monthly)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/60">Scaled using √time rule</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground">Annual VaR</span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(varMetrics.annual)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground">Expected Shortfall (CVaR)</span>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(varMetrics.es)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/60">Average loss if VaR threshold is breached</p>
                    </div>
                  </div>
                </div>

                <div data-animate data-tilt className="glass-panel rounded-2xl shadow-2xl shadow-black/10 border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Liquidity Requirements</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 glass-panel border border-border/70 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">Next 12 Months</p>
                        <p className="text-xs text-foreground/60">Estimated calls</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(liquiditySummary?.next12MonthCalls ?? currentRiskMetrics.unfundedCommitments * 0.6)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 glass-panel border border-border/70 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">Next 24 Months</p>
                        <p className="text-xs text-foreground/60">Total projected</p>
                      </div>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(liquiditySummary?.next24MonthCalls ?? currentRiskMetrics.unfundedCommitments * 0.85)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 glass-panel border border-border/70 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">Reserve Buffer</p>
                        <p className="text-xs text-foreground/60">
                          {liquiditySummary
                            ? liquiditySummary.reserveGap > 0
                              ? `Gap: ${formatCurrency(liquiditySummary.reserveGap)}`
                              : 'Buffer sufficient'
                            : 'Recommended 15%'}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(
                          liquiditySummary?.recommendedReserve ?? currentRiskMetrics.unfundedCommitments * 0.9
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fund-by-Fund Breakdown */}
              <div data-animate data-tilt className="glass-panel rounded-2xl shadow-2xl shadow-black/10 border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Unfunded Commitments by Fund</h3>
                <div className="space-y-2">
                  {fundsForDisplay.slice(0, 10).map((fund, index) => {
                    const unfunded = fund.commitment - fund.paidIn
                    const percentage =
                      currentRiskMetrics.unfundedCommitments > 0
                        ? (unfunded / currentRiskMetrics.unfundedCommitments) * 100
                        : 0
                    return (
                      <div key={fund.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{fund.name}</p>
                          <p className="text-xs text-foreground/60">{fund.manager}</p>
                        </div>
                        <div className="w-32">
                          <div className="w-full bg-[var(--border)]/40 rounded-full h-2 mb-1 overflow-hidden glass-panel">
                            <div 
                              className="h-2 rounded-full bg-[color-mix(in_srgb,var(--accent-color) 80%,transparent)]" 
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-foreground/60 text-right">{percentage.toFixed(1)}%</p>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(unfunded)}</p>
                          <p className="text-xs text-foreground/60">
                            {formatPercent((unfunded / fund.commitment) * 100, 0)} left
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Policy Settings Modal */}
        {policyModalOpen && policyState && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPolicyModalOpen(false)}>
            <div className="glass-panel border border-border rounded-2xl shadow-2xl shadow-black/20 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 glass-panel border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Risk Policy Settings</h2>
                  <p className="text-sm text-foreground/60 mt-1">Adjust concentration and liquidity thresholds</p>
                </div>
                <button
                  onClick={() => setPolicyModalOpen(false)}
                  className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-8">
                {policySaveMessage && (
                  <div className="px-4 py-2 text-sm rounded-lg" data-testid="policy-save-message">
                    <span
                      className={
                        policySaveMessage.toLowerCase().includes('fail') || policySaveMessage.toLowerCase().includes('unable')
                          ? 'text-red-600'
                          : 'text-emerald-600'
                      }
                    >
                      {policySaveMessage}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {policyFieldGroups.map((group) => (
                    <div key={group.title} className="border border-border rounded-2xl glass-panel">
                      <div className="p-4 border-b border-border">
                        <h4 className="text-sm font-semibold text-foreground">{group.title}</h4>
                        <p className="text-xs text-foreground/60 mt-1">{group.description}</p>
                      </div>
                      <div className="divide-y divide-border">
                        {group.fields.map((field) => (
                          <div key={field.key} className="flex items-center justify-between gap-4 px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">{field.label}</p>
                              {field.helper && <p className="text-xs text-foreground/60">{field.helper}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={getPolicyDisplayValue(field)}
                                onChange={(e) => handlePolicyFieldChange(field, e.target.value)}
                                min={field.min}
                                max={field.max}
                                step={field.step ?? 1}
                                className="w-24 px-3 py-1.5 border border-border rounded-lg bg-[var(--surface)] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                              />
                              {field.suffix && <span className="text-xs text-foreground/60">{field.suffix}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Custom Stress Scenarios</h3>
                      <p className="text-sm text-foreground/60">Saved shocks automatically feed the stress-testing charts and exports.</p>
                    </div>
                    {scenariosLoading && <span className="text-xs text-foreground/60">Loading…</span>}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border border-border rounded-2xl glass-panel p-4 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide block mb-1">Scenario name</label>
                        <input
                          type="text"
                          value={scenarioForm.name}
                          onChange={(e) => handleScenarioFieldChange('name', e.target.value)}
                          placeholder="e.g., Tech Slowdown"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-[var(--surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide block mb-1">NAV shock (%)</label>
                          <input
                            type="number"
                            step="1"
                            value={scenarioForm.navShockPercent}
                            onChange={(e) => handleScenarioFieldChange('navShockPercent', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-[var(--surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide block mb-1">Call multiplier</label>
                          <input
                            type="number"
                            min="0"
                            step="0.05"
                            value={scenarioForm.callMultiplier}
                            onChange={(e) => handleScenarioFieldChange('callMultiplier', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-[var(--surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wide block mb-1">Distribution multiplier</label>
                          <input
                            type="number"
                            min="0"
                            step="0.05"
                            value={scenarioForm.distributionMultiplier}
                            onChange={(e) => handleScenarioFieldChange('distributionMultiplier', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-[var(--surface)] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm"
                          />
                        </div>
                      </div>
                      {scenarioError && <p className="text-xs text-red-600">{scenarioError}</p>}
                      {scenarioMessage && <p className="text-xs text-emerald-600">{scenarioMessage}</p>}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleSaveScenario}
                          disabled={scenarioSaving}
                          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold shadow hover:bg-accent-hover disabled:opacity-50"
                        >
                          {scenarioSaving ? 'Saving…' : 'Save scenario'}
                        </button>
                        <button
                          onClick={() => {
                            setScenarioForm({ name: '', navShockPercent: -20, callMultiplier: 1.2, distributionMultiplier: 0.7 })
                            setScenarioError(null)
                            setScenarioMessage(null)
                          }}
                          className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="border border-border rounded-2xl glass-panel p-4 space-y-3">
                      {customScenarios.length === 0 ? (
                        <p className="text-sm text-foreground/60">No custom scenarios saved.</p>
                      ) : (
                        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                          {customScenarios.map((scenario) => (
                            <div key={scenario.id} className="border border-border rounded-xl p-3 flex items-start justify-between gap-3 glass-panel">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{scenario.name}</p>
                                <p className="text-xs text-foreground/60">{new Date(scenario.createdAt).toLocaleDateString()}</p>
                                <div className="mt-2 text-xs text-foreground/70 space-y-1">
                                  <p>NAV shock: {(scenario.navShock * 100).toFixed(1)}%</p>
                                  <p>Calls ×{scenario.callMultiplier.toFixed(2)} · Dists ×{scenario.distributionMultiplier.toFixed(2)}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteScenario(scenario.id)}
                                className="p-2 rounded-lg border border-border text-foreground/70 hover:text-red-600 hover:border-red-500 transition-colors"
                                aria-label={`Delete ${scenario.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 glass-panel border-t border-border px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={handleResetPolicy}
                  disabled={policySaving}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors"
                >
                  Reset to defaults
                </button>
                <button
                  onClick={() => {
                    handleSavePolicy()
                    // Optionally close modal after save
                    setTimeout(() => {
                      if (policySaveMessage && !policySaveMessage.toLowerCase().includes('fail') && !policySaveMessage.toLowerCase().includes('unable')) {
                        setPolicyModalOpen(false)
                      }
                    }, 1000)
                  }}
                  disabled={policySaving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-accent text-white shadow hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                  {policySaving ? 'Saving…' : 'Save Policy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

interface SummaryStatProps {
  label: string
  value: string
  sublabel?: string
  icon: ComponentType<{ className?: string }>
}

function SummaryStat({ label, value, sublabel, icon: Icon }: SummaryStatProps) {
  return (
    <div data-animate data-tilt className="glass-panel rounded-2xl border border-border p-4 flex items-center gap-4 shadow-2xl shadow-black/10">
      <div className="w-11 h-11 rounded-xl glass-panel border border-border/60 flex items-center justify-center">
        <Icon className="w-5 h-5 text-foreground/70" />
      </div>
      <div>
        <p className="text-xs text-foreground/60">{label}</p>
        <p className="text-xl font-semibold text-foreground">{value}</p>
        {sublabel && <p className="text-xs text-foreground/60">{sublabel}</p>}
      </div>
    </div>
  )
}

type VarMethod = 'historical' | 'parametric' | 'monteCarlo'

interface VarMetrics {
  daily: number
  monthly: number
  annual: number
  es: number
}

function calculateVarMetrics(
  method: VarMethod,
  historySeries: { risk: number }[],
  scenarios: RiskScenarioResult[],
  totalPortfolio: number,
  assetClassData: { percentage: number }[],
  correlationMatrix: { values: number[] }[]
): VarMetrics {
  const portfolio = Math.max(totalPortfolio, 1)

  const fallback = (sigma: number) => {
    const daily = portfolio * sigma * 1.65
    return {
      daily,
      monthly: daily * Math.sqrt(21),
      annual: daily * Math.sqrt(252),
      es: daily * 1.35,
    }
  }

  const weights = assetClassData.length
    ? assetClassData.map((item) => item.percentage / 100)
    : [1]
  const normalizedWeights = (() => {
    const sum = weights.reduce((acc, value) => acc + value, 0) || 1
    return weights.map((value) => value / sum)
  })()
  const vols = normalizedWeights.map((weight) => 0.08 + weight * 0.15)

  const buildCovariance = () => {
    if (!correlationMatrix.length || correlationMatrix.length !== normalizedWeights.length) {
      return normalizedWeights.map((_, index) =>
        normalizedWeights.map((__, innerIndex) => (index === innerIndex ? Math.pow(vols[index], 2) : 0))
      )
    }
    return correlationMatrix.map((row, rowIndex) =>
      row.values.map((corr, colIndex) => {
        const value = (corr ?? 0.3) * vols[rowIndex] * vols[colIndex]
        return rowIndex === colIndex ? Math.pow(vols[rowIndex], 2) : value
      })
    )
  }

  const covariance = buildCovariance()
  const portfolioVariance = normalizedWeights.reduce((sum, wi, i) => {
    const inner = normalizedWeights.reduce((innerSum, wj, j) => innerSum + wj * covariance[i][j], 0)
    return sum + wi * inner
  }, 0)

  if (method === 'historical') {
    const deltas: number[] = []
    for (let i = 1; i < historySeries.length; i++) {
      const prev = historySeries[i - 1].risk
      const curr = historySeries[i].risk
      if (!Number.isFinite(prev) || prev === 0) continue
      deltas.push((curr - prev) / 100)
    }
    const avg = deltas.reduce((sum, value) => sum + value, 0) / (deltas.length || 1)
    const variance =
      deltas.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / (deltas.length || 1)
    const sigma = Math.max(Math.sqrt(variance), 0.012)
    return fallback(sigma)
  }

  if (method === 'parametric') {
    const sigma = Math.max(Math.sqrt(portfolioVariance), 0.015)
    return fallback(sigma)
  }

  const shocks = scenarios
    .map((scenario) => scenario.navShock)
    .filter((value) => Number.isFinite(value) && value !== 0)
  const baseShocks = shocks.length ? shocks : [-0.08, -0.22, -0.35]
  const sigmaCov = Math.max(Math.sqrt(portfolioVariance), 0.01)
  const iterations = 800
  const returns: number[] = []

  const gaussian = () => {
    const u = Math.random() || 1e-9
    const v = Math.random() || 1e-9
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  for (let i = 0; i < iterations; i++) {
    const baseShock = baseShocks[Math.floor(Math.random() * baseShocks.length)]
    const noise = gaussian() * sigmaCov
    const secondary = gaussian() * sigmaCov * 0.5
    const simulatedReturn = baseShock + (noise * 0.7 + secondary * 0.3)
    returns.push(simulatedReturn)
  }

  returns.sort((a, b) => a - b)
  const index = Math.max(0, Math.floor(returns.length * 0.05) - 1)
  const varReturn = Math.abs(returns[index] ?? -0.02)
  const tail = returns.slice(0, index + 1)
  const esReturn = Math.abs(tail.reduce((sum, value) => sum + value, 0) / (tail.length || 1))

  return {
    daily: portfolio * varReturn,
    monthly: portfolio * varReturn * Math.sqrt(21),
    annual: portfolio * varReturn * Math.sqrt(252),
    es: portfolio * esReturn,
  }
}
