import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ALLOWED_DIMENSION_IDS, ALLOWED_METRIC_IDS } from '@/lib/reporting/fields'

const FX_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
}

const convertAmount = (amount: number, fromCurrency: string | null | undefined, toCurrency: string) => {
  const from = (fromCurrency || 'USD').toUpperCase()
  const to = (toCurrency || 'USD').toUpperCase()
  const fromRate = FX_RATES[from] || 1
  const toRate = FX_RATES[to] || 1
  return (amount / fromRate) * toRate
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await request.json()
    const rawBuilderConfig = config.builderConfig || {}
    const requestedBaseCurrency = typeof config.baseCurrency === 'string' ? config.baseCurrency.toUpperCase() : 'USD'
    const baseCurrency = FX_RATES[requestedBaseCurrency] ? requestedBaseCurrency : 'USD'
    const builderDimensions = Array.isArray(rawBuilderConfig.dimensions)
      ? rawBuilderConfig.dimensions.filter((dim: any) => ALLOWED_DIMENSION_IDS.has(dim.id))
      : []
    const chartType = rawBuilderConfig.chartType || 'bar'

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, clientId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestedMetrics = Array.isArray(rawBuilderConfig.metrics)
      ? rawBuilderConfig.metrics.filter((metric: any) => ALLOWED_METRIC_IDS.has(metric.id))
      : []

    // For client-owned data, allow all metrics; no masking enforced client-side
    const builderMetrics = requestedMetrics
    const maskedMetrics: string[] = []

    const addCondition = (base: any, condition: any) => {
      if (!base || Object.keys(base).length === 0) {
        return condition
      }
      return { AND: [base, condition] }
    }

    let fundWhereClause: any = {}
    if (user.role === 'ADMIN') {
      fundWhereClause = {}
    } else if (user.clientId) {
      fundWhereClause = { clientId: user.clientId }
    } else {
      const fundAccessRecords = await prisma.fundAccess.findMany({
        where: { userId: session.user.id },
        select: { fundId: true },
      })
      const accessibleFundIds = fundAccessRecords.map((fa) => fa.fundId)
      fundWhereClause = accessibleFundIds.length
        ? { OR: [{ id: { in: accessibleFundIds } }, { userId: session.user.id }] }
        : { userId: session.user.id }
    }

    if (config.filters?.fundIds && config.filters.fundIds.length > 0) {
      fundWhereClause = addCondition(fundWhereClause, { id: { in: config.filters.fundIds } })
    }
    if (config.filters?.vintage && config.filters.vintage.length > 0) {
      fundWhereClause = addCondition(fundWhereClause, { vintage: { in: config.filters.vintage } })
    }
    if (config.filters?.domicile && config.filters.domicile.length > 0) {
      fundWhereClause = addCondition(fundWhereClause, { domicile: { in: config.filters.domicile } })
    }
    if (config.filters?.manager && config.filters.manager.length > 0) {
      fundWhereClause = addCondition(fundWhereClause, { manager: { in: config.filters.manager } })
    }
    if (config.filters?.strategy && config.filters.strategy.length > 0) {
      fundWhereClause = addCondition(fundWhereClause, { strategy: { in: config.filters.strategy } })
    }
    if (config.filters?.sector && config.filters.sector.length > 0) {
      fundWhereClause = addCondition(fundWhereClause, { sector: { in: config.filters.sector } })
    }
    if (config.filters?.vintageRange?.start || config.filters?.vintageRange?.end) {
      const start = config.filters.vintageRange.start ? Number(config.filters.vintageRange.start) : undefined
      const end = config.filters.vintageRange.end ? Number(config.filters.vintageRange.end) : undefined
      fundWhereClause = addCondition(fundWhereClause, {
        vintage: {
          gte: start,
          lte: end,
        },
      })
    }

    const funds = await prisma.fund.findMany({
      where: fundWhereClause,
      select: {
        id: true,
        name: true,
        domicile: true,
        vintage: true,
        manager: true,
        assetClass: true,
        strategy: true,
        sector: true,
        baseCurrency: true,
        commitment: true,
        paidIn: true,
        nav: true,
        tvpi: true,
        dpi: true,
        irr: true,
        updatedAt: true,
      },
    })

    let directInvestments: any[] = []
    if (config.filters?.investmentIds && config.filters.investmentIds.length > 0) {
      let directWhereClause: any = {}
      if (user.role === 'ADMIN') {
        directWhereClause = { id: { in: config.filters.investmentIds } }
      } else if (user.clientId) {
        directWhereClause = { id: { in: config.filters.investmentIds }, clientId: user.clientId }
      } else {
        directWhereClause = { id: { in: config.filters.investmentIds }, userId: session.user.id }
      }

      directInvestments = await prisma.directInvestment.findMany({
        where: directWhereClause,
        select: {
          id: true,
          name: true,
          investmentType: true,
          industry: true,
          stage: true,
          investmentAmount: true,
          currentValue: true,
          investmentDate: true,
          currency: true,
          updatedAt: true,
        },
      })
    }

    const normalizedFunds = funds.map((fund) => {
      const entityCurrency = fund.baseCurrency || 'USD'
      const toBase = (value: number) => convertAmount(value || 0, entityCurrency, baseCurrency)

      const commitment = toBase(fund.commitment || 0)
      const paidIn = toBase(fund.paidIn || 0)
      const nav = toBase(fund.nav || 0)
      const distributions = paidIn * (fund.dpi || 0)
      const unfunded = Math.max(commitment - paidIn, 0)
      const totalValue = nav + distributions

      return {
        ...fund,
        assetClass: fund.assetClass || 'Fund',
        strategy: fund.strategy || 'Generalist',
        sector: fund.sector || 'Diversified',
        region: fund.domicile,
        baseCurrency: fund.baseCurrency || 'USD',
        reportingCurrency: baseCurrency,
        commitment,
        paidIn,
        nav,
        distributions,
        totalValue,
        unfunded,
        tvpi: paidIn > 0 ? totalValue / paidIn : 0,
        dpi: paidIn > 0 ? distributions / paidIn : 0,
        pic: commitment > 0 ? paidIn / commitment : 0,
        rvpi: paidIn > 0 ? nav / paidIn : 0,
        currentValue: nav,
        investmentType: 'Fund',
        entityType: 'Fund',
      }
    })

    const normalizedInvestments = directInvestments.map((di) => {
      const entityCurrency = di.currency || 'USD'
      const toBase = (value: number) => convertAmount(value || 0, entityCurrency, baseCurrency)

      const commitment = toBase(di.investmentAmount || 0)
      const paidIn = toBase(di.investmentAmount || 0)
      const nav = toBase(di.currentValue || 0)
      const distributions = 0 // Placeholder until distribution tracking for directs is added
      const unfunded = Math.max(commitment - paidIn, 0)
      const totalValue = nav + distributions

      return {
        id: di.id,
        name: di.name,
        domicile: di.industry || di.investmentType || 'Direct Investment',
        region: di.industry || di.investmentType || 'Direct Investment',
        vintage: di.investmentDate ? new Date(di.investmentDate).getFullYear() : null,
        manager: di.stage || di.investmentType || 'Direct Investment',
        commitment,
        paidIn,
        nav,
        distributions,
        totalValue,
        unfunded,
        tvpi: paidIn > 0 ? totalValue / paidIn : 0,
        dpi: 0,
        irr: 0,
        pic: commitment > 0 ? paidIn / commitment : 1, // Usually 1 for direct investments (fully funded)
        rvpi: paidIn > 0 ? nav / paidIn : 0,
        currentValue: nav,
        assetClass: di.investmentType || 'Direct Investment',
        strategy: di.stage || di.investmentType || 'Direct Investment',
        sector: di.industry || di.investmentType || 'Direct Investment',
        baseCurrency: di.currency || 'USD',
        reportingCurrency: baseCurrency,
        investmentType: di.investmentType || 'Direct Investment',
        entityType: 'Direct Investment',
      }
    })

    const combinedEntities = [...normalizedFunds, ...normalizedInvestments]

    // Calculate summary metrics using normalized data
    const totalCommitment = combinedEntities.reduce((sum, e) => sum + ((e.commitment as number) || 0), 0)
    const totalPaidIn = combinedEntities.reduce((sum, e) => sum + ((e.paidIn as number) || 0), 0)
    const totalNav = combinedEntities.reduce((sum, e) => sum + ((e.nav as number) || 0), 0)
    const totalDistributions = combinedEntities.reduce((sum, e) => sum + ((e.distributions as number) || 0), 0)
    const totalValue = combinedEntities.reduce((sum, e) => sum + ((e.totalValue as number) || 0), 0)
    const portfolioTvpi = totalPaidIn > 0 ? totalValue / totalPaidIn : 0
    const portfolioDpi = totalPaidIn > 0 ? totalDistributions / totalPaidIn : 0
    const avgTvpi = portfolioTvpi
    const avgDpi = portfolioDpi
    const directInvestmentValue = normalizedInvestments.reduce((sum, di) => sum + ((di.currentValue as number) || 0), 0)

    const benchmark = {
      name: 'Peer Median (placeholder)',
      source: 'Static placeholder - replace with real benchmark provider',
      tvpi: Math.max(1.4, portfolioTvpi * 0.9),
      dpi: Math.max(0.5, portfolioDpi * 0.9),
      irr: 0.12,
      currency: baseCurrency,
    }

    // Handle drag-and-drop builder configuration
    let reportData: any[] = []
    let chartConfig: any = {}
    
    if (builderMetrics.length > 0) {
      if (builderDimensions.length > 0) {
        // Multi-level grouping: reduce over ordered dimensions
        const grouped = combinedEntities.reduce((acc: any, entity) => {
          let cursor = acc
          builderDimensions.forEach((dim: { id: string }, idx: number) => {
            const rawValue = entity[dim.id as keyof typeof entity]
            const key = rawValue === null || typeof rawValue === 'undefined' ? 'Unknown' : String(rawValue)
            if (!cursor[key]) {
              cursor[key] = { __children: {}, __items: [] }
            }
            if (idx === builderDimensions.length - 1) {
              cursor[key].__items.push(entity)
            } else {
              cursor = cursor[key].__children
            }
          })
          return acc
        }, {})

        const aggregateItems = (items: any[]) => {
          return items.reduce(
            (acc, f: any) => {
              const commitment = (f.commitment as number) || 0
              const paidIn = (f.paidIn as number) || 0
              const nav = (f.nav as number) || 0
              const dpi = (f.dpi as number) || 0
              const distributions = (f.distributions as number) || 0
              const irr = (f.irr as number) || 0

              return {
                commitment: acc.commitment + commitment,
                paidIn: acc.paidIn + paidIn,
                nav: acc.nav + nav,
                distributions: acc.distributions + (distributions || dpi * paidIn),
                totalValue: acc.totalValue + nav + (distributions || dpi * paidIn),
                irrWeighted: acc.irrWeighted + irr * paidIn,
                irrWeight: acc.irrWeight + paidIn,
              }
            },
            {
              commitment: 0,
              paidIn: 0,
              nav: 0,
              distributions: 0,
              totalValue: 0,
              irrWeighted: 0,
              irrWeight: 0,
            }
          )
        }

        const calculateMetricValue = (totals: any, metricId: string, items: any[]) => {
          switch (metricId) {
            case 'irr':
              return totals.irrWeight > 0 ? totals.irrWeighted / totals.irrWeight : 0
            case 'tvpi':
              return totals.paidIn > 0 ? totals.totalValue / totals.paidIn : 0
            case 'dpi':
              return totals.paidIn > 0 ? totals.distributions / totals.paidIn : 0
            case 'rvpi':
              return totals.paidIn > 0 ? totals.nav / totals.paidIn : 0
            case 'pic':
              return totals.commitment > 0 ? totals.paidIn / totals.commitment : 0
            case 'unfunded':
              return totals.commitment - totals.paidIn
            case 'totalValue':
              return totals.totalValue
            case 'currentValue':
              return totals.nav
            default:
              return items.reduce(
                (sum, f) => sum + ((f[metricId as keyof typeof f] as number) || 0),
                0
              )
          }
        }

        const flattenGroups = (node: any, depth = 0, prefix: string[] = []) => {
          const rows: any[] = []
          Object.entries(node).forEach(([key, value]: any) => {
            const childItems = value.__items || []
            const childRows = flattenGroups(value.__children || {}, depth + 1, [...prefix, key])
            const totalItems = [...childItems, ...childRows.flatMap((r) => (r as any).__items || [])]
            const totals = aggregateItems(totalItems)
            const row: any = { name: prefix.concat(key).join(' / '), __items: totalItems, __depth: depth }
            builderMetrics.forEach((metric: any) => {
              row[metric.id] = calculateMetricValue(totals, metric.id, totalItems)
            })
            rows.push(row, ...childRows)
          })
          return rows
        }

        reportData = flattenGroups(grouped).map(({ __items, __depth, ...rest }) => rest)
      } else {
        // No grouping, use individual funds
        reportData = combinedEntities.map((entity) => {
          const dataPoint: any = { name: entity.name }
          builderMetrics.forEach((metric: any) => {
            dataPoint[metric.id] = entity[metric.id as keyof typeof entity] || 0
          })
          return dataPoint
        })
      }
      
      chartConfig = {
        xAxisField: 'name',
        yAxisFields: builderMetrics.map((m: any) => m.id),
        chartType,
        groupDimensions: builderDimensions.map((d: any) => d.id),
      }
    } else {
      // Legacy groupBy format
      let groupedData: any[] = []
      if (config.groupBy && config.groupBy !== 'none') {
        const groups: { [key: string]: any[] } = {}

        combinedEntities.forEach((entity) => {
          const groupKey = entity[config.groupBy as keyof typeof entity] as string
          if (!groups[groupKey]) {
            groups[groupKey] = []
          }
          groups[groupKey].push(entity)
        })

        groupedData = Object.entries(groups).map(([groupName, groupFunds]) => {
          const groupCommitment = groupFunds.reduce(
            (sum, f) => sum + ((f.commitment as number) || 0),
            0
          )
          const groupPaidIn = groupFunds.reduce(
            (sum, f) => sum + ((f.paidIn as number) || 0),
            0
          )
          const groupNav = groupFunds.reduce(
            (sum, f) => sum + ((f.nav as number) || 0),
            0
          )
          const groupDistributions = groupFunds.reduce(
            (sum, f) =>
              sum + (((f.dpi as number) || 0) * (((f.paidIn as number) || 0))),
            0
          )
          const groupTvpi =
            groupPaidIn > 0
              ? (groupNav + groupDistributions) / groupPaidIn
              : 0

          return {
            group: groupName,
            fundCount: groupFunds.length,
            commitment: groupCommitment,
            paidIn: groupPaidIn,
            nav: groupNav,
            tvpi: groupTvpi,
          }
        })
      }

      reportData = config.groupBy !== 'none' ? groupedData : combinedEntities
    }

    const result = {
      summary: {
        fundCount: funds.length,
        directInvestmentCount: directInvestments.length,
        totalCommitment,
        totalPaidIn,
        totalNav,
        avgTvpi,
        avgDpi,
        directInvestmentValue,
      },
      data: reportData,
      chartConfig,
      generatedAt: new Date().toISOString(),
      metadata: {
        asOfDate: (() => {
          const timestamps = [
            ...funds.map((f) => (f.updatedAt ? new Date(f.updatedAt).getTime() : 0)),
            ...directInvestments.map((di) => (di.updatedAt ? new Date(di.updatedAt).getTime() : 0)),
          ].filter(Boolean)
          return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : new Date().toISOString()
        })(),
        dataSources: ['funds', 'directInvestments'],
        reportingCurrency: baseCurrency,
        fxRatesUsed: Object.keys(FX_RATES),
        benchmark,
        maskedMetrics,
      },
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Report run error:', error)
    return NextResponse.json({ error: 'Failed to run report' }, { status: 500 })
  }
}
