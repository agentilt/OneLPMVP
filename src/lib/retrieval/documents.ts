import { getNeonClient } from '@/lib/neon'

export interface DocumentRow {
  id: string
  fund_id: string | null
  strategy_id: string | null
  file_id: string | null
  title: string
  doc_type: string | null
  as_of_date: string | null
  uploaded_at: string | null
  source_system: string | null
  page_count: number | null
  is_redacted: boolean | null
}

export interface DocumentsQuery {
  fundId: string
  limit?: number
  docTypes?: string[]
  fromDate?: string
  toDate?: string
  order?: 'asc' | 'desc'
}

export async function getDocuments(params: DocumentsQuery): Promise<DocumentRow[]> {
  const { fundId, docTypes } = params
  const order = params.order === 'asc' ? 'asc' : 'desc'
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200)

  const conditions: string[] = ['fund_id = $1']
  const values: any[] = [fundId]
  let idx = 2

  if (docTypes?.length) {
    conditions.push(`doc_type = ANY($${idx++}::text[])`)
    values.push(docTypes)
  }
  if (params.fromDate) {
    conditions.push(`uploaded_at >= $${idx++}`)
    values.push(params.fromDate)
  }
  if (params.toDate) {
    conditions.push(`uploaded_at <= $${idx++}`)
    values.push(params.toDate)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `
    SELECT id, fund_id, strategy_id, file_id, title, doc_type, as_of_date, uploaded_at, source_system, page_count, is_redacted
    FROM documents
    ${where}
    ORDER BY uploaded_at ${order} NULLS LAST
    LIMIT ${limit};
  `

  const client = getNeonClient()
  const rows = (await client(sql, values)) as unknown as DocumentRow[]
  return rows
}
