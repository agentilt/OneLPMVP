import { getNeonClient } from '@/lib/neon'

export interface BenchmarkSeriesRow {
  id: string
  code: string
  name: string
  frequency: string | null
  currency: string | null
  asset_class: string | null
  sector: string | null
}

export interface BenchmarkPointRow {
  series_id: string
  date: string
  value: number
}

export interface BenchmarkSeriesWithPoints extends BenchmarkSeriesRow {
  points: BenchmarkPointRow[]
}

export interface BenchmarkQuery {
  codes?: string[]
  assetClass?: string
  sector?: string
  limitPoints?: number
  fromDate?: string
  toDate?: string
}

export async function getBenchmarkSeries(params: BenchmarkQuery): Promise<BenchmarkSeriesWithPoints[]> {
  const client = getNeonClient()
  const conditions: string[] = []
  const values: any[] = []
  let idx = 1

  if (params.codes?.length) {
    conditions.push(`code = ANY($${idx++}::text[])`)
    values.push(params.codes)
  }
  if (params.assetClass) {
    conditions.push(`asset_class = $${idx++}`)
    values.push(params.assetClass)
  }
  if (params.sector) {
    conditions.push(`sector = $${idx++}`)
    values.push(params.sector)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const seriesSql = `
    SELECT id, code, name, frequency, currency, asset_class, sector
    FROM benchmark_series
    ${where}
    ORDER BY code ASC;
  `
  const seriesRows = (await client(seriesSql, values)) as unknown as BenchmarkSeriesRow[]

  if (seriesRows.length === 0) return []

  const limitPoints = Math.min(Math.max(params.limitPoints ?? 120, 1), 365)
  const pointsConditions: string[] = ['series_id = ANY($1::text[])']
  const pointsValues: any[] = [seriesRows.map((s) => s.id)]
  let pointsIdx = 2
  if (params.fromDate) {
    pointsConditions.push(`date >= $${pointsIdx++}`)
    pointsValues.push(params.fromDate)
  }
  if (params.toDate) {
    pointsConditions.push(`date <= $${pointsIdx++}`)
    pointsValues.push(params.toDate)
  }

  const pointsWhere = pointsConditions.length ? `WHERE ${pointsConditions.join(' AND ')}` : ''
  const pointsSql = `
    SELECT series_id, date, value
    FROM benchmark_points
    ${pointsWhere}
    ORDER BY date DESC
    LIMIT ${limitPoints * seriesRows.length};
  `

  const pointsRows = (await client(pointsSql, pointsValues)) as unknown as BenchmarkPointRow[]

  const grouped: Record<string, BenchmarkPointRow[]> = {}
  for (const p of pointsRows) {
    if (!grouped[p.series_id]) grouped[p.series_id] = []
    if (grouped[p.series_id].length < limitPoints) {
      grouped[p.series_id].push(p)
    }
  }

  return seriesRows.map((s) => ({
    ...s,
    points: (grouped[s.id] ?? []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  }))
}
