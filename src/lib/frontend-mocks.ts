import { RiskPolicyConfig, RiskScenarioResult } from './riskEngine'

export const mockAISuggestions = [
  { id: 'mock-ai-1', title: 'Review portfolio performance', detail: 'Open analytics to see NAV and TVPI trends', actionHref: '/analytics', actionLabel: 'Open analytics' },
  { id: 'mock-ai-2', title: 'Check capital calls', detail: 'See upcoming capital calls and payment status', actionHref: '/capital-calls', actionLabel: 'View calls' },
  { id: 'mock-ai-3', title: 'Review risk exposure', detail: 'Open risk to check concentration and policy status', actionHref: '/risk', actionLabel: 'Open risk' },
]

export const mockCapitalCalls = [
  {
    id: 'mock-call-1',
    fundId: 'mock-fund-1',
    fundName: 'Mock Growth Fund',
    title: 'Q4 2024 Capital Call',
    dueDate: new Date(),
    uploadDate: new Date(),
    callAmount: 1500000,
    paymentStatus: 'PENDING',
    status: 'DUE_SOON',
  },
  {
    id: 'mock-call-2',
    fundId: 'mock-fund-2',
    fundName: 'Real Estate Opportunities',
    title: 'Bridge Financing',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
    uploadDate: new Date(),
    callAmount: 750000,
    paymentStatus: 'PENDING',
    status: 'UPCOMING',
  },
]

export const mockRiskPolicy: RiskPolicyConfig = {
  maxAssetClassExposure: 60,
  maxGeographyExposure: 60,
  maxManagerExposure: 35,
  maxSectorExposure: 40,
  minLiquidityCoverage: 1.25,
  minNumberOfFunds: 5,
  targetDiversificationScore: 70,
  enablePolicyViolationAlerts: true,
}

export const mockRiskReport = {
  riskScores: {
    overall: 7,
    liquidity: 7.2,
    concentration: 6.4,
  },
  metrics: {
    totalPortfolio: 12500000,
    totalCommitment: 15000000,
    unfundedCommitments: 2500000,
    assetClassConcentration: { 'Private Equity': 60, 'Real Assets': 40 },
    geographyConcentration: { 'North America': 65, Europe: 35 },
  },
  exposures: {
    assetClass: [
      { name: 'Private Equity', amount: 7500000, percentage: 60 },
      { name: 'Real Assets', amount: 5000000, percentage: 40 },
    ],
    manager: [
      { name: 'Atlas Partners', amount: 4500000, percentage: 36 },
      { name: 'Harbor Capital', amount: 3000000, percentage: 24 },
      { name: 'Summit Ridge', amount: 2000000, percentage: 16 },
    ],
    geography: [
      { name: 'North America', amount: 8000000, percentage: 64 },
      { name: 'Europe', amount: 4500000, percentage: 36 },
    ],
  },
  liquidity: {
    liquidityCoverage: 1.8,
    schedule: [
      { period: 'Q1', capitalCalls: 500000, distributions: 250000, net: -250000 },
      { period: 'Q2', capitalCalls: 400000, distributions: 300000, net: -100000 },
      { period: 'Q3', capitalCalls: 350000, distributions: 400000, net: 50000 },
      { period: 'Q4', capitalCalls: 300000, distributions: 500000, net: 200000 },
    ],
  },
  scenarios: [
    {
      name: 'Moderate downturn',
      navShock: 0.1,
      callMultiplier: 1.1,
      distributionMultiplier: 0.9,
      projectedNav: 11000000,
      projectedCalls: 600000,
      projectedDistributions: 450000,
      liquidityGap: -150000,
      coverageRatio: 1.2,
    } satisfies RiskScenarioResult,
  ],
  policyBreaches: [],
}

export const mockRiskHistory = [
  {
    id: 'mock-history-1',
    snapshotDate: new Date().toISOString(),
    capitalCalls: 500000,
    distributions: 300000,
    net: -200000,
  },
]

export const mockRiskScenarios = [
  {
    id: 'mock-scenario-1',
    name: 'Recession case',
    description: 'NAV -15%, calls +20%, distributions -30%',
    navShock: 0.15,
    callMultiplier: 1.2,
    distributionMultiplier: 0.7,
  },
]

