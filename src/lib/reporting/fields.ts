export type FieldType = 'dimension' | 'metric'
export type MetricAggregation =
  | 'sum'
  | 'ratio'
  | 'weightedAvgPaidIn'
  | 'paidInToCommitment'
export type ValueFormat = 'string' | 'currency' | 'multiple' | 'percent' | 'number'

export interface BaseField {
  id: string
  name: string
  label?: string
  description?: string
  iconId?: string
}

export interface DimensionField extends BaseField {
  type: 'dimension'
}

export interface MetricField extends BaseField {
  type: 'metric'
  aggregation: MetricAggregation
  format: ValueFormat
}

export type ReportField = DimensionField | MetricField

export const DIMENSION_FIELDS: DimensionField[] = [
  {
    id: 'name',
    name: 'Fund Name',
    description: 'Individual fund or direct investment name',
    iconId: 'Building2',
    type: 'dimension',
  },
  {
    id: 'vintage',
    name: 'Vintage Year',
    description: 'Year of fund vintage or investment date',
    iconId: 'Calendar',
    type: 'dimension',
  },
  {
    id: 'domicile',
    name: 'Geography',
    description: 'Fund domicile or investment geography',
    iconId: 'MapPin',
    type: 'dimension',
  },
  {
    id: 'region',
    name: 'Region',
    description: 'High-level geography grouping',
    iconId: 'Globe2',
    type: 'dimension',
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'General partner or manager name',
    iconId: 'Users',
    type: 'dimension',
  },
  {
    id: 'investmentType',
    name: 'Investment Type',
    description: 'Fund vs direct investment categorization',
    iconId: 'Layers',
    type: 'dimension',
  },
  {
    id: 'entityType',
    name: 'Entity Type',
    description: 'Fund or Direct Investment entity marker',
    iconId: 'Layers',
    type: 'dimension',
  },
  {
    id: 'assetClass',
    name: 'Asset Class',
    description: 'Asset class classification (e.g., PE, Credit, Real Estate)',
    iconId: 'Briefcase',
    type: 'dimension',
  },
  {
    id: 'strategy',
    name: 'Strategy',
    description: 'Fund strategy or mandate',
    iconId: 'Target',
    type: 'dimension',
  },
  {
    id: 'sector',
    name: 'Sector',
    description: 'Sector/industry focus',
    iconId: 'PieChart',
    type: 'dimension',
  },
  {
    id: 'baseCurrency',
    name: 'Base Currency',
    description: 'Reported currency of the entity',
    iconId: 'Coins',
    type: 'dimension',
  },
]

export const METRIC_FIELDS: MetricField[] = [
  {
    id: 'commitment',
    name: 'Commitment',
    description: 'Total committed capital',
    aggregation: 'sum',
    format: 'currency',
    iconId: 'DollarSign',
    type: 'metric',
  },
  {
    id: 'paidIn',
    name: 'Paid-In Capital',
    description: 'Capital contributions to date',
    aggregation: 'sum',
    format: 'currency',
    iconId: 'DollarSign',
    type: 'metric',
  },
  {
    id: 'nav',
    name: 'NAV',
    description: 'Net Asset Value',
    aggregation: 'sum',
    format: 'currency',
    iconId: 'TrendingUp',
    type: 'metric',
  },
  {
    id: 'unfunded',
    name: 'Unfunded',
    description: 'Unfunded commitment (commitment - paid-in)',
    aggregation: 'sum',
    format: 'currency',
    iconId: 'PiggyBank',
    type: 'metric',
  },
  {
    id: 'distributions',
    name: 'Distributions',
    description: 'Total distributions to date',
    aggregation: 'sum',
    format: 'currency',
    iconId: 'Wallet',
    type: 'metric',
  },
  {
    id: 'totalValue',
    name: 'Total Value',
    description: 'NAV + distributions',
    aggregation: 'sum',
    format: 'currency',
    iconId: 'BarChart3',
    type: 'metric',
  },
  {
    id: 'tvpi',
    name: 'TVPI',
    description: 'Total Value to Paid-In',
    aggregation: 'ratio',
    format: 'multiple',
    iconId: 'Activity',
    type: 'metric',
  },
  {
    id: 'dpi',
    name: 'DPI',
    description: 'Distributions to Paid-In',
    aggregation: 'ratio',
    format: 'multiple',
    iconId: 'Activity',
    type: 'metric',
  },
  {
    id: 'rvpi',
    name: 'RVPI',
    description: 'Residual Value to Paid-In',
    aggregation: 'ratio',
    format: 'multiple',
    iconId: 'Activity',
    type: 'metric',
  },
  {
    id: 'pic',
    name: 'Paid-In / Commitment',
    description: 'Paid-in capital as % of commitment',
    aggregation: 'paidInToCommitment',
    format: 'percent',
    iconId: 'Percent',
    type: 'metric',
  },
  {
    id: 'irr',
    name: 'IRR',
    description: 'Internal Rate of Return (weighted by paid-in)',
    aggregation: 'weightedAvgPaidIn',
    format: 'percent',
    iconId: 'Gauge',
    type: 'metric',
  },
  {
    id: 'currentValue',
    name: 'Current Value',
    description: 'Current value for direct investments',
    aggregation: 'sum',
    format: 'currency',
    iconId: 'TrendingUp',
    type: 'metric',
  },
]

export const ALLOWED_DIMENSION_IDS = new Set(DIMENSION_FIELDS.map((d) => d.id))
export const ALLOWED_METRIC_IDS = new Set(METRIC_FIELDS.map((m) => m.id))

export const METRIC_MAP: Record<string, MetricField> = METRIC_FIELDS.reduce((acc, metric) => {
  acc[metric.id] = metric
  return acc
}, {} as Record<string, MetricField>)

export const DIMENSION_MAP: Record<string, DimensionField> = DIMENSION_FIELDS.reduce((acc, dimension) => {
  acc[dimension.id] = dimension
  return acc
}, {} as Record<string, DimensionField>)
