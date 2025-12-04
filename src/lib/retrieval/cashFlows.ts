import { getNeonClient } from '@/lib/neon'

export interface FundCashFlowRow {
  id: string
  fund_id: string
  flow_date: string
  flow_type: string
  amount: number
  currency: string | null
  due_date: string | null
  description: string | null
}

export interface FundCashFlowsQuery {
  fundId: string
  limit?: number
  fromDate?: string
  toDate?: string
  flowType?: 'CALL' | 'DISTRIBUTION' | 'OTHER'
  order?: 'asc' | 'desc'
}

export async function getFundCashFlows(params: FundCashFlowsQuery): Promise<FundCashFlowRow[]> {
  const { fundId, flowType } = params
  const order = params.order === 'asc' ? 'asc' : 'desc'
  const limit = Math.min(Math.max(params.limit ?? 120, 1), 365)

  const conditions: string[] = ['fund_id = $1']
  const values: any[] = [fundId]
  let idx = 2

  if (params.fromDate) {
    conditions.push(`flow_date >= $${idx++}`)
    values.push(params.fromDate)
  }
  if (params.toDate) {
    conditions.push(`flow_date <= $${idx++}`)
    values.push(params.toDate)
  }
  if (flowType) {
    conditions.push(`flow_type = $${idx++}`)
    values.push(flowType)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `
    SELECT id, fund_id, flow_date, flow_type, amount, currency, due_date, description
    FROM fund_cash_flows
    ${where}
    ORDER BY flow_date ${order}
    LIMIT ${limit};
  `

  const client = getNeonClient()
  const rows = (await client(sql, values)) as unknown as FundCashFlowRow[]
  return rows
}
