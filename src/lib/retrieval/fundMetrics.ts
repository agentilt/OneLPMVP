import { getNeonClient } from '@/lib/neon'

export interface FundMetricRow {
  id: string
  fund_id: string
  as_of_date: string
  nav: number | null
  tvpi: number | null
  dpi: number | null
  irr: number | null
  rvpi: number | null
  committed: number | null
  called_to_date: number | null
  unfunded: number | null
  distributions_to_date: number | null
  gross_irr: number | null
  net_irr: number | null
  source_system: string | null
}

export interface FundMetricsQuery {
  fundId: string
  limit?: number
  fromDate?: string
  toDate?: string
  order?: 'asc' | 'desc'
}

export async function getFundMetrics(params: FundMetricsQuery): Promise<FundMetricRow[]> {
  const { fundId } = params
  const order = params.order === 'asc' ? 'asc' : 'desc'
  const limit = Math.min(Math.max(params.limit ?? 120, 1), 365)

  const conditions: string[] = ['fund_id = $1']
  const values: any[] = [fundId]
  let idx = 2

  if (params.fromDate) {
    conditions.push(`as_of_date >= $${idx++}`)
    values.push(params.fromDate)
  }
  if (params.toDate) {
    conditions.push(`as_of_date <= $${idx++}`)
    values.push(params.toDate)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const sql = `
    SELECT id, fund_id, as_of_date, nav, tvpi, dpi, irr, rvpi, committed,
           called_to_date, unfunded, distributions_to_date, gross_irr, net_irr, source_system
    FROM fund_metrics
    ${where}
    ORDER BY as_of_date ${order}
    LIMIT ${limit};
  `

  const client = getNeonClient()
  const rows = (await client(sql, values)) as unknown as FundMetricRow[]
  return rows
}
