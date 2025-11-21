import { inferFundAssetClass } from '@/lib/assetClass'

export interface RiskPolicyConfig {
  maxSingleFundExposure?: number
  maxGeographyExposure?: number
  maxSectorExposure?: number
  maxVintageExposure?: number
  maxManagerExposure?: number
  maxAssetClassExposure?: number
  maxUnfundedCommitments?: number
  minLiquidityReserve?: number
  minLiquidityCoverage?: number
  targetLiquidityBuffer?: number
  maxPortfolioLeverage?: number
  minNumberOfFunds?: number
  targetDiversificationScore?: number
  minAcceptableTVPI?: number
  minAcceptableDPI?: number
  minAcceptableIRR?: number
  maxCurrencyExposure?: number
  maxLeverageRatio?: number
  enablePolicyViolationAlerts?: boolean
  enablePerformanceAlerts?: boolean
  enableLiquidityAlerts?: boolean
}

export interface RiskFundInput {
  id: string
  name: string
  manager: string
  domicile: string
  commitment: number
  paidIn: number
  nav: number
  vintage: number
  assetClass?: string | null
  sector?: string | null
  baseCurrency?: string | null
  leverage?: number | null
  tvpi?: number | null
  dpi?: number | null
  irr?: number | null
}

export interface RiskDirectInvestmentInput {
  id: string
  name: string
  currentValue: number | null
  investmentAmount?: number | null
  assetClass?: string | null
  sector?: string | null
  geography?: string | null
  currency?: string | null
}

export interface RiskCapitalCallEvent {
  id: string
  fundId: string
  amount: number
  dueDate?: string | Date | null
  uploadDate?: string | Date | null
  paymentStatus?: string | null
}

export interface RiskDistributionEvent {
  id: string
  fundId: string
  amount: number
  distributionDate?: string | Date | null
}

export interface RiskScenarioConfig {
  name: string
  navShock: number
  callMultiplier: number
  distributionMultiplier: number
}

export interface RiskScenarioResult extends RiskScenarioConfig {
  projectedNav: number
  projectedCalls: number
  projectedDistributions: number
  liquidityGap: number
  coverageRatio: number
}

export interface ExposureEntry {
  name: string
  amount: number
  percentage: number
}

export interface LiquiditySchedulePoint {
  period: string
  capitalCalls: number
  distributions: number
  net: number
}

export interface RiskHistoryPoint extends LiquiditySchedulePoint {
  cumulativeCalls: number
  cumulativeDistributions: number
}

export interface RiskPolicyBreach {
  dimension:
    | 'FUND'
    | 'ASSET_CLASS'
    | 'GEOGRAPHY'
    | 'SECTOR'
    | 'VINTAGE'
    | 'MANAGER'
    | 'CURRENCY'
    | 'LIQUIDITY'
    | 'LEVERAGE'
  label: string
  current: number
  limit: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
}

export interface RiskReport {
  metrics: {
    totalPortfolio: number
    totalCommitment: number
    totalPaidIn: number
    unfundedCommitments: number
    assetClassConcentration: Record<string, number>
    geographyConcentration: Record<string, number>
  }
  exposures: {
    assetClass: ExposureEntry[]
    geography: ExposureEntry[]
    manager: ExposureEntry[]
    vintage: ExposureEntry[]
    currency: ExposureEntry[]
    sector: ExposureEntry[]
  }
  liquidity: {
    pendingCalls: number
    next12MonthCalls: number
    next12MonthDistributions: number
    next24MonthCalls: number
    recommendedReserve: number
    reserveGap: number
    liquidityCoverage: number
    averageQuarterlyCall: number
    deploymentYears: number
    schedule: LiquiditySchedulePoint[]
  }
  riskScores: {
    concentration: number
    liquidity: number
    performance: number
    policy: number
    overall: number
  }
  scenarios: RiskScenarioResult[]
  policyBreaches: RiskPolicyBreach[]
  history: {
    trailingQuarters: RiskHistoryPoint[]
  }
}

const DEFAULT_SCENARIOS: RiskScenarioConfig[] = [
  { name: 'Base Case', navShock: -0.08, callMultiplier: 1, distributionMultiplier: 1 },
  { name: 'Downside', navShock: -0.22, callMultiplier: 1.25, distributionMultiplier: 0.75 },
  { name: 'Severe Stress', navShock: -0.4, callMultiplier: 1.5, distributionMultiplier: 0.5 },
]

const DEFAULT_POLICY: Required<RiskPolicyConfig> = {
  maxSingleFundExposure: 25,
  maxGeographyExposure: 40,
  maxSectorExposure: 35,
  maxVintageExposure: 30,
  maxManagerExposure: 20,
  maxAssetClassExposure: 35,
  maxUnfundedCommitments: 50,
  minLiquidityReserve: 10,
  minLiquidityCoverage: 1.5,
  targetLiquidityBuffer: 0.15,
  maxPortfolioLeverage: 0.5,
  minNumberOfFunds: 5,
  targetDiversificationScore: 0.7,
  minAcceptableTVPI: 1.5,
  minAcceptableDPI: 0.5,
  minAcceptableIRR: 10,
  maxCurrencyExposure: 30,
  maxLeverageRatio: 2,
  enablePolicyViolationAlerts: true,
  enablePerformanceAlerts: true,
  enableLiquidityAlerts: true,
}

const getQuarterKey = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3) + 1
  return `${date.getFullYear()}-Q${quarter}`
}

const getQuarterLabel = (key: string) => {
  const [yearStr, quarter] = key.split('-Q')
  return `Q${quarter} ${yearStr}`
}

const getQuarterOrder = (key: string) => {
  const [yearStr, quarter] = key.split('-Q')
  return parseInt(yearStr, 10) * 4 + parseInt(quarter, 10)
}

const createQuarterBuckets = (start: Date, count: number, direction: 'forward' | 'backward') => {
  const quarterStart = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1)
  const buckets: Array<{ key: string; label: string; start: Date; end: Date }> = []

  for (let i = 0; i < count; i++) {
    const offset = direction === 'forward' ? i : -i
    const bucketStart = new Date(quarterStart)
    bucketStart.setMonth(bucketStart.getMonth() + offset * 3)
    const bucketEnd = new Date(bucketStart)
    bucketEnd.setMonth(bucketEnd.getMonth() + 3)
    bucketEnd.setMilliseconds(bucketEnd.getMilliseconds() - 1)
    const key = getQuarterKey(bucketStart)
    buckets.push({
      key,
      label: getQuarterLabel(key),
      start: bucketStart,
      end: bucketEnd,
    })
  }

  if (direction === 'backward') {
    return buckets.reverse()
  }

  return buckets
}

const toNumber = (value: number | null | undefined) => (typeof value === 'number' ? value : 0)

const buildExposure = <T,>(
  items: T[],
  getKey: (item: T) => string,
  getAmount: (item: T) => number
): { entries: ExposureEntry[]; map: Record<string, number> } => {
  const totals = new Map<string, number>()
  let grandTotal = 0

  items.forEach((item) => {
    const key = getKey(item) || 'Unknown'
    const amount = Math.max(getAmount(item), 0)
    if (amount === 0) return
    grandTotal += amount
    totals.set(key, (totals.get(key) || 0) + amount)
  })

  const entries: ExposureEntry[] = Array.from(totals.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  const map = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.name] = entry.amount
    return acc
  }, {})

  return { entries, map }
}

const calculatePolicyBreaches = (
  metrics: RiskReport['metrics'],
  exposures: RiskReport['exposures'],
  liquidity: RiskReport['liquidity'],
  funds: RiskFundInput[],
  policy: Required<RiskPolicyConfig>
): RiskPolicyBreach[] => {
  const breaches: RiskPolicyBreach[] = []

  const addBreach = (
    dimension: RiskPolicyBreach['dimension'],
    label: string,
    current: number,
    limit: number,
    severityMultiplier = 1
  ) => {
    const severityValue = current / Math.max(limit, 0.0001)
    let severity: RiskPolicyBreach['severity'] = 'LOW'
    if (severityValue > 1.4 * severityMultiplier) {
      severity = 'CRITICAL'
    } else if (severityValue > 1.2 * severityMultiplier) {
      severity = 'HIGH'
    } else if (severityValue > 1 * severityMultiplier) {
      severity = 'MEDIUM'
    }

    if (severity === 'LOW') return
    breaches.push({
      dimension,
      label,
      current,
      limit,
      severity,
      message: `${label} at ${current.toFixed(1)}% exceeds policy limit of ${limit}%`,
    })
  }

  exposures.assetClass.forEach((entry) => {
    if (entry.percentage > policy.maxAssetClassExposure) {
      addBreach('ASSET_CLASS', entry.name, entry.percentage, policy.maxAssetClassExposure)
    }
  })

  exposures.geography.forEach((entry) => {
    if (entry.percentage > policy.maxGeographyExposure) {
      addBreach('GEOGRAPHY', entry.name, entry.percentage, policy.maxGeographyExposure)
    }
  })

  exposures.vintage.forEach((entry) => {
    if (entry.percentage > policy.maxVintageExposure) {
      addBreach('VINTAGE', entry.name, entry.percentage, policy.maxVintageExposure)
    }
  })

  exposures.manager.forEach((entry) => {
    if (entry.percentage > policy.maxManagerExposure) {
      addBreach('MANAGER', entry.name, entry.percentage, policy.maxManagerExposure)
    }
  })

  exposures.sector.forEach((entry) => {
    if (entry.percentage > policy.maxSectorExposure) {
      addBreach('SECTOR', entry.name, entry.percentage, policy.maxSectorExposure)
    }
  })

  exposures.currency.forEach((entry) => {
    if (entry.percentage > policy.maxCurrencyExposure) {
      addBreach('CURRENCY', entry.name, entry.percentage, policy.maxCurrencyExposure)
    }
  })

  funds.forEach((fund) => {
    const exposurePct =
      metrics.totalPortfolio > 0 ? (fund.nav / metrics.totalPortfolio) * 100 : 0
    if (exposurePct > policy.maxSingleFundExposure) {
      addBreach('FUND', fund.name, exposurePct, policy.maxSingleFundExposure)
    }
  })

  const unfundedPct =
    metrics.totalCommitment > 0
      ? (metrics.unfundedCommitments / metrics.totalCommitment) * 100
      : 0
  if (unfundedPct > policy.maxUnfundedCommitments) {
    addBreach('LIQUIDITY', 'Unfunded Commitments', unfundedPct, policy.maxUnfundedCommitments)
  }

  if (liquidity.liquidityCoverage < policy.minLiquidityCoverage) {
    breaches.push({
      dimension: 'LIQUIDITY',
      label: 'Liquidity Coverage',
      current: liquidity.liquidityCoverage,
      limit: policy.minLiquidityCoverage,
      severity: liquidity.liquidityCoverage < policy.minLiquidityCoverage * 0.8 ? 'HIGH' : 'MEDIUM',
      message: `Liquidity coverage ${liquidity.liquidityCoverage.toFixed(
        2
      )}x is below policy minimum of ${policy.minLiquidityCoverage.toFixed(2)}x`,
    })
  }

  const avgLeverage =
    funds.length > 0
      ? funds.reduce((sum, fund) => sum + Math.max(toNumber(fund.leverage), 0), 0) / funds.length
      : 0
  if (avgLeverage > policy.maxPortfolioLeverage) {
    addBreach('LEVERAGE', 'Portfolio Leverage', avgLeverage * 100, policy.maxPortfolioLeverage * 100)
  }

  return breaches
}

const calculateRiskScores = (
  metrics: RiskReport['metrics'],
  exposures: RiskReport['exposures'],
  liquidity: RiskReport['liquidity'],
  breaches: RiskPolicyBreach[],
  policy: Required<RiskPolicyConfig>,
  funds: RiskFundInput[]
) => {
  const highestAssetClass = exposures.assetClass[0]?.percentage ?? 0
  const highestManager = exposures.manager[0]?.percentage ?? 0
  const concentrationScore = Math.min(100, highestAssetClass * 0.7 + highestManager * 0.3)

  const liquidityCoverage = liquidity.liquidityCoverage
  const liquidityScore =
    liquidityCoverage >= policy.minLiquidityCoverage
      ? 30 - Math.min(30, (liquidityCoverage - policy.minLiquidityCoverage) * 10)
      : 70 + Math.min(30, (policy.minLiquidityCoverage - liquidityCoverage) * 40)

  const weightedTvpi =
    funds.reduce((sum, fund) => sum + toNumber(fund.tvpi) * fund.paidIn, 0) /
    Math.max(metrics.totalPaidIn, 1)
  const performanceShortfall = Math.max(policy.minAcceptableTVPI - weightedTvpi, 0)
  const performanceScore =
    weightedTvpi >= policy.minAcceptableTVPI
      ? 20
      : 50 + Math.min(30, (performanceShortfall / policy.minAcceptableTVPI) * 100)

  const policyScore = Math.min(100, breaches.length * 15)

  const overall = Math.max(
    0,
    Math.min(100, (concentrationScore + liquidityScore + performanceScore + policyScore) / 4)
  )

  return {
    concentration: parseFloat(concentrationScore.toFixed(1)),
    liquidity: parseFloat(liquidityScore.toFixed(1)),
    performance: parseFloat(performanceScore.toFixed(1)),
    policy: parseFloat(policyScore.toFixed(1)),
    overall: parseFloat(overall.toFixed(1)),
  }
}

const sumBuckets = (buckets: LiquiditySchedulePoint[], count: number) =>
  buckets.slice(0, count).reduce(
    (acc, point) => ({
      capitalCalls: acc.capitalCalls + point.capitalCalls,
      distributions: acc.distributions + point.distributions,
    }),
    { capitalCalls: 0, distributions: 0 }
  )

const buildHistoricalSeries = (
  capitalCalls: RiskCapitalCallEvent[] = [],
  distributions: RiskDistributionEvent[] = []
): RiskHistoryPoint[] => {
  const now = new Date()
  const buckets = createQuarterBuckets(now, 8, 'backward')
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]))
  const values: Record<
    string,
    { capitalCalls: number; distributions: number; net: number }
  > = {}

  buckets.forEach((bucket) => {
    values[bucket.key] = { capitalCalls: 0, distributions: 0, net: 0 }
  })

  capitalCalls.forEach((event) => {
    const eventDate = event.dueDate ? new Date(event.dueDate) : event.uploadDate ? new Date(event.uploadDate) : null
    if (!eventDate || eventDate > now) return
    const key = getQuarterKey(eventDate)
    if (!bucketMap.has(key)) return
    values[key].capitalCalls += Math.max(event.amount, 0)
    values[key].net -= Math.max(event.amount, 0)
  })

  distributions.forEach((event) => {
    const eventDate = event.distributionDate ? new Date(event.distributionDate) : null
    if (!eventDate || eventDate > now) return
    const key = getQuarterKey(eventDate)
    if (!bucketMap.has(key)) return
    values[key].distributions += Math.max(event.amount, 0)
    values[key].net += Math.max(event.amount, 0)
  })

  let cumulativeCalls = 0
  let cumulativeDistributions = 0

  return buckets.map((bucket) => {
    const bucketValues = values[bucket.key]
    cumulativeCalls += bucketValues.capitalCalls
    cumulativeDistributions += bucketValues.distributions
    return {
      period: bucket.label,
      capitalCalls: bucketValues.capitalCalls,
      distributions: bucketValues.distributions,
      net: bucketValues.net,
      cumulativeCalls,
      cumulativeDistributions,
    }
  })
}

const buildForwardSchedule = (
  funds: RiskFundInput[],
  capitalCalls: RiskCapitalCallEvent[] = [],
  distributions: RiskDistributionEvent[] = [],
  history: RiskHistoryPoint[]
): LiquiditySchedulePoint[] => {
  const now = new Date()
  const buckets = createQuarterBuckets(now, 8, 'forward')
  const historyAverage = history.reduce(
    (acc, point) => ({
      capitalCalls: acc.capitalCalls + point.capitalCalls,
      distributions: acc.distributions + point.distributions,
    }),
    { capitalCalls: 0, distributions: 0 }
  )
  const avgCapitalCall = history.length ? historyAverage.capitalCalls / history.length : 0
  const avgDistribution = history.length ? historyAverage.distributions / history.length : 0
  const values: Record<string, LiquiditySchedulePoint> = {}
  buckets.forEach((bucket) => {
    values[bucket.key] = {
      period: bucket.label,
      capitalCalls: 0,
      distributions: 0,
      net: 0,
    }
  })

  capitalCalls.forEach((event) => {
    const eventDate = event.dueDate ? new Date(event.dueDate) : event.uploadDate ? new Date(event.uploadDate) : null
    if (!eventDate || eventDate < now) return
    const key = getQuarterKey(eventDate)
    if (!values[key]) return
    values[key].capitalCalls += Math.max(event.amount, 0)
    values[key].net -= Math.max(event.amount, 0)
  })

  distributions.forEach((event) => {
    const eventDate = event.distributionDate ? new Date(event.distributionDate) : null
    if (!eventDate || eventDate < now) return
    const key = getQuarterKey(eventDate)
    if (!values[key]) return
    values[key].distributions += Math.max(event.amount, 0)
    values[key].net += Math.max(event.amount, 0)
  })

  const remainingCommitment = Math.max(
    funds.reduce((sum, fund) => sum + (fund.commitment - fund.paidIn), 0),
    0
  )
  const scheduledCalls = Object.values(values).reduce((sum, point) => sum + point.capitalCalls, 0)
  let unscheduledCalls = Math.max(remainingCommitment - scheduledCalls, 0)
  const defaultQuarterlyCall = Math.max(avgCapitalCall, unscheduledCalls / Math.max(buckets.length, 1))
  const defaultQuarterlyDist =
    avgDistribution > 0 ? avgDistribution : Math.max(funds.reduce((sum, fund) => sum + fund.nav, 0) * 0.02, 0)

  buckets.forEach((bucket) => {
    const bucketValue = values[bucket.key]
    if (bucketValue.capitalCalls === 0 && unscheduledCalls > 0) {
      const allocation = Math.min(defaultQuarterlyCall, unscheduledCalls)
      bucketValue.capitalCalls += allocation
      bucketValue.net -= allocation
      unscheduledCalls -= allocation
    }
    if (bucketValue.distributions === 0) {
      bucketValue.distributions = defaultQuarterlyDist
      bucketValue.net += defaultQuarterlyDist
    }
  })

  return buckets.map((bucket) => values[bucket.key])
}

export function computeRiskReport(params: {
  funds: RiskFundInput[]
  directInvestments: RiskDirectInvestmentInput[]
  capitalCalls?: RiskCapitalCallEvent[]
  distributions?: RiskDistributionEvent[]
  policy?: RiskPolicyConfig | null
  scenarioConfigs?: RiskScenarioConfig[]
}): RiskReport {
  const {
    funds,
    directInvestments,
    capitalCalls = [],
    distributions = [],
    policy: policyInput,
    scenarioConfigs,
  } = params

  const enrichedFunds = funds.map((fund) => ({
    ...fund,
    assetClass: fund.assetClass || inferFundAssetClass(fund),
  }))

  const normalizedPolicy = { ...DEFAULT_POLICY, ...(policyInput || {}) }

  const directInvestmentValue = directInvestments.reduce(
    (sum, di) => sum + (toNumber(di.currentValue) || toNumber(di.investmentAmount)),
    0
  )
  const totalFundNav = enrichedFunds.reduce((sum, fund) => sum + fund.nav, 0)
  const totalCommitment = enrichedFunds.reduce((sum, fund) => sum + fund.commitment, 0)
  const totalPaidIn = enrichedFunds.reduce((sum, fund) => sum + fund.paidIn, 0)
  const totalPortfolio = totalFundNav + directInvestmentValue
  const unfundedCommitments = Math.max(totalCommitment - totalPaidIn, 0)

  const assetBase = [
    ...enrichedFunds.map((fund) => ({
      amount: fund.nav,
      assetClass: fund.assetClass || 'Multi-Strategy',
      geography: fund.domicile || 'Unknown',
      manager: fund.manager || 'Unknown',
      vintage: fund.vintage?.toString() || 'Unknown',
      currency: fund.baseCurrency || 'USD',
      sector: fund.sector || 'Generalist',
    })),
    ...directInvestments.map((di) => ({
      amount: toNumber(di.currentValue) || toNumber(di.investmentAmount),
      assetClass: di.assetClass || 'Direct Investments',
      geography: di.geography || 'Direct Holdings',
      manager: di.name || 'Direct Holdings',
      vintage: 'Direct',
      currency: di.currency || 'USD',
      sector: di.sector || 'Direct Holdings',
    })),
  ]

  const assetClassExposure = buildExposure(assetBase, (item) => item.assetClass, (item) => item.amount)
  const geographyExposure = buildExposure(assetBase, (item) => item.geography, (item) => item.amount)
  const managerExposure = buildExposure(assetBase, (item) => item.manager, (item) => item.amount)
  const vintageExposure = buildExposure(assetBase, (item) => item.vintage, (item) => item.amount)
  const currencyExposure = buildExposure(assetBase, (item) => item.currency, (item) => item.amount)
  const sectorExposure = buildExposure(assetBase, (item) => item.sector, (item) => item.amount)

  const history = buildHistoricalSeries(capitalCalls, distributions)
  const forwardSchedule = buildForwardSchedule(enrichedFunds, capitalCalls, distributions, history)
  const next12 = sumBuckets(forwardSchedule, 4)
  const next24 = sumBuckets(forwardSchedule, 8)

  const reserveValue = totalCommitment * normalizedPolicy.targetLiquidityBuffer
  const liquidityCoverage =
    next12.capitalCalls > 0
      ? (reserveValue + next12.distributions) / Math.max(next12.capitalCalls, 1)
      : Infinity
  const pendingCalls = capitalCalls.reduce((sum, event) => {
    const dueDate = event.dueDate ? new Date(event.dueDate) : null
    if (!dueDate) return sum
    const daysUntilDue = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysUntilDue < 0 || daysUntilDue > 90) return sum
    return sum + Math.max(event.amount, 0)
  }, 0)

  const liquidity = {
    pendingCalls,
    next12MonthCalls: next12.capitalCalls,
    next12MonthDistributions: next12.distributions,
    next24MonthCalls: next24.capitalCalls,
    recommendedReserve: reserveValue,
    reserveGap: Math.max(next12.capitalCalls - (reserveValue + next12.distributions), 0),
    liquidityCoverage: Number.isFinite(liquidityCoverage) ? liquidityCoverage : 5,
    averageQuarterlyCall: next12.capitalCalls / 4,
    deploymentYears:
      next12.capitalCalls > 0
        ? (unfundedCommitments / Math.max(next12.capitalCalls, 1)) / 4
        : unfundedCommitments > 0
        ? 3
        : 0,
    schedule: forwardSchedule.map((point) => ({
      ...point,
      net: point.distributions - point.capitalCalls,
    })),
  }

  const metrics = {
    totalPortfolio,
    totalCommitment,
    totalPaidIn,
    unfundedCommitments,
    assetClassConcentration: assetClassExposure.map,
    geographyConcentration: geographyExposure.map,
  }

  const exposures = {
    assetClass: assetClassExposure.entries,
    geography: geographyExposure.entries,
    manager: managerExposure.entries,
    vintage: vintageExposure.entries,
    currency: currencyExposure.entries,
    sector: sectorExposure.entries,
  }

  const breaches = calculatePolicyBreaches(metrics, exposures, liquidity, enrichedFunds, normalizedPolicy)

  const riskScores = calculateRiskScores(metrics, exposures, liquidity, breaches, normalizedPolicy, enrichedFunds)

  const scenarioInputs = scenarioConfigs || DEFAULT_SCENARIOS
  const scenarios: RiskScenarioResult[] = scenarioInputs.map((scenario) => {
    const projectedNav = totalPortfolio * (1 + scenario.navShock)
    const projectedCalls = next12.capitalCalls * scenario.callMultiplier
    const projectedDistributions = next12.distributions * scenario.distributionMultiplier
    const liquidityGap = Math.max(
      projectedCalls - (projectedDistributions + liquidity.recommendedReserve),
      0
    )
    const coverageRatio =
      projectedCalls > 0
        ? (projectedDistributions + liquidity.recommendedReserve) / projectedCalls
        : 5

    return {
      ...scenario,
      projectedNav,
      projectedCalls,
      projectedDistributions,
      liquidityGap,
      coverageRatio,
    }
  })

  return {
    metrics,
    exposures,
    liquidity,
    riskScores,
    scenarios,
    policyBreaches: breaches,
    history: {
      trailingQuarters: history,
    },
  }
}
