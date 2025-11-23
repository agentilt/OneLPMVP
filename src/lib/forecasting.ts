export type ScenarioKey = 'base' | 'downside' | 'severe' | 'custom'

export interface ScenarioConfig {
  key: ScenarioKey
  label: string
  callPaceMultiplier: number // >1 accelerates calls
  distributionHaircut: number // 0-1 haircut on distributions
  reserveBufferPct: number // additional buffer applied to required reserve
}

export const SCENARIO_PRESETS: Record<Exclude<ScenarioKey, 'custom'>, ScenarioConfig> = {
  base: { key: 'base', label: 'Base', callPaceMultiplier: 1, distributionHaircut: 0, reserveBufferPct: 0 },
  downside: { key: 'downside', label: 'Downside', callPaceMultiplier: 1.15, distributionHaircut: 0.3, reserveBufferPct: 0.1 },
  severe: { key: 'severe', label: 'Severe', callPaceMultiplier: 1.3, distributionHaircut: 0.5, reserveBufferPct: 0.2 },
}

export const FORECAST_QUARTERS = 8

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

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

export type CashFlowEventInput = {
  type: string
  date: string
  amount: number
}

type QuarterAggregate = {
  key: string
  label: string
  amount: number
}

const aggregateQuarterlyTotals = (
  events: CashFlowEventInput[],
  filter: (event: CashFlowEventInput) => boolean
): QuarterAggregate[] => {
  const totals = new Map<string, { label: string; amount: number; sortValue: number }>()

  events.forEach((event) => {
    if (!filter(event)) return
    const date = new Date(event.date)
    const year = date.getFullYear()
    const quarter = Math.floor(date.getMonth() / 3) + 1
    const key = `${year}-Q${quarter}`
    const label = `Q${quarter} ${year}`
    const existing = totals.get(key)
    if (existing) {
      existing.amount += Math.abs(event.amount)
    } else {
      totals.set(key, {
        label,
        amount: Math.abs(event.amount),
        sortValue: year * 4 + quarter,
      })
    }
  })

  return Array.from(totals.entries())
    .sort((a, b) => a[1].sortValue - b[1].sortValue)
    .map(([key, value]) => ({ key, label: value.label, amount: value.amount }))
}

export interface ForecastProjection {
  period: string
  amount: number
  cumulative: number
}

export interface ForecastNetPoint {
  period: string
  capitalCalls: number
  distributions: number
  net: number
  cumulativeNet: number
}

export interface CashFlowForecast {
  capitalCallProjections: ForecastProjection[]
  distributionProjections: ForecastProjection[]
  netCashFlow: ForecastNetPoint[]
  requiredReserve: number
  upcomingDrawdowns: ForecastProjection[]
  totalProjectedCalls: number
  reserveGap?: number
}

export const generateScenarioForecast = (
  events: CashFlowEventInput[],
  fundSnapshots: { id: string; name: string; nav: number; commitment: number; paidIn: number }[],
  scenario: ScenarioConfig,
  availableCash = 0
): CashFlowForecast | null => {
  if (!fundSnapshots.length) return null

  const totalCommitment = fundSnapshots.reduce((sum, fund) => sum + (fund.commitment || 0), 0)
  const totalPaidIn = fundSnapshots.reduce((sum, fund) => sum + (fund.paidIn || 0), 0)
  const totalNav = fundSnapshots.reduce((sum, fund) => sum + (fund.nav || 0), 0)
  const unfundedCommitments = Math.max(totalCommitment - totalPaidIn, 0)

  const capitalHistory = aggregateQuarterlyTotals(
    events,
    (e) => e.type === 'CAPITAL_CALL' || e.type === 'NEW_HOLDING' || e.type === 'DIRECT_INVESTMENT'
  )
  const distributionHistory = aggregateQuarterlyTotals(events, (e) => e.type === 'DISTRIBUTION')

  const recentCapitalWindow = capitalHistory.slice(-FORECAST_QUARTERS)
  const recentDistributionWindow = distributionHistory.slice(-FORECAST_QUARTERS)
  const avgQuarterlyCapitalCalls = recentCapitalWindow.length
    ? recentCapitalWindow.reduce((sum, entry) => sum + entry.amount, 0) / recentCapitalWindow.length
    : null
  const avgQuarterlyDistributions = recentDistributionWindow.length
    ? recentDistributionWindow.reduce((sum, entry) => sum + entry.amount, 0) / recentDistributionWindow.length
    : null

  const historicalDeploymentRate =
    avgQuarterlyCapitalCalls && unfundedCommitments > 0
      ? clamp(avgQuarterlyCapitalCalls / unfundedCommitments, 0.03, 0.5)
      : null
  const historicalDistributionRate =
    avgQuarterlyDistributions && totalNav > 0
      ? clamp(avgQuarterlyDistributions / totalNav, 0.02, 0.5)
      : null

  const currentQuarterOrder = getCurrentQuarterOrder()
  const historyMaxOrder = Math.max(
    capitalHistory.length ? Math.max(...capitalHistory.map((entry) => getPeriodOrder(entry.label))) : Number.NEGATIVE_INFINITY,
    distributionHistory.length ? Math.max(...distributionHistory.map((entry) => getPeriodOrder(entry.label))) : Number.NEGATIVE_INFINITY
  )

  const projectionStartOrder =
    Number.isFinite(historyMaxOrder) && historyMaxOrder !== Number.NEGATIVE_INFINITY
      ? historyMaxOrder + 1
      : currentQuarterOrder

  const quarters = Array.from({ length: FORECAST_QUARTERS }, (_, index) =>
    getPeriodLabelFromOrder(projectionStartOrder + index)
  )

  const baseDeploymentPace = historicalDeploymentRate ?? 0.15
  const baseDistributionRate = historicalDistributionRate ?? 0.08

  const callMultiplier = scenario.callPaceMultiplier || 1
  const distMultiplier = 1 - (scenario.distributionHaircut || 0)

  let remainingUnfunded = unfundedCommitments
  const capitalCallProjections = quarters.map((period, index) => {
    const timeFactor = Math.max(0.3, 1 - (index / FORECAST_QUARTERS) * 0.7)
    const amount = Math.min(
      remainingUnfunded,
      remainingUnfunded * baseDeploymentPace * timeFactor * callMultiplier
    )
    remainingUnfunded -= amount
    return {
      period,
      amount: Math.round(amount),
      cumulative: Math.round(unfundedCommitments - remainingUnfunded),
    }
  })

  let cumulativeDistributions = 0
  const distributionProjections = quarters.map((period, index) => {
    const maturityFactor = 1 + (index / FORECAST_QUARTERS) * 0.5
    const amount = totalNav * baseDistributionRate * maturityFactor * distMultiplier
    cumulativeDistributions += amount
    return {
      period,
      amount: Math.round(amount),
      cumulative: Math.round(cumulativeDistributions),
    }
  })

  let cumulativeNet = 0
  let minCumulative = 0
  const netCashFlow = quarters.map((period, index) => {
    const callAmount = capitalCallProjections[index]?.amount ?? 0
    const distAmount = distributionProjections[index]?.amount ?? 0
    const net = distAmount - callAmount
    cumulativeNet += net
    minCumulative = Math.min(minCumulative, cumulativeNet)
    return {
      period,
      capitalCalls: -callAmount,
      distributions: distAmount,
      net,
      cumulativeNet,
    }
  })

  const requiredReserve = Math.abs(minCumulative) * (1 + (scenario.reserveBufferPct || 0))

  return {
    capitalCallProjections,
    distributionProjections,
    netCashFlow,
    requiredReserve,
    upcomingDrawdowns: capitalCallProjections.slice(0, 4),
    totalProjectedCalls: capitalCallProjections.reduce((sum, projection) => sum + projection.amount, 0),
    reserveGap: Math.max(requiredReserve - availableCash, 0),
  }
}
