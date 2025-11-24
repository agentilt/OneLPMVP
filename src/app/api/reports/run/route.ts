import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const ALLOWED_DIMENSIONS = new Set(['name', 'vintage', 'domicile', 'manager', 'investmentType', 'entityType'])
const ALLOWED_METRICS = new Set(['commitment', 'paidIn', 'nav', 'tvpi', 'dpi', 'pic', 'rvpi', 'irr'])
const RATIO_METRICS = new Set(['tvpi', 'dpi', 'pic', 'rvpi', 'irr'])

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await request.json()
    const rawBuilderConfig = config.builderConfig || {}
    const builderDimensions = Array.isArray(rawBuilderConfig.dimensions)
      ? rawBuilderConfig.dimensions.filter((dim: any) => ALLOWED_DIMENSIONS.has(dim.id))
      : []
    const builderMetrics = Array.isArray(rawBuilderConfig.metrics)
      ? rawBuilderConfig.metrics.filter((metric: any) => ALLOWED_METRICS.has(metric.id))
      : []
    const chartType = rawBuilderConfig.chartType || 'bar'

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, clientId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const funds = await prisma.fund.findMany({
      where: fundWhereClause,
      select: {
        id: true,
        name: true,
        domicile: true,
        vintage: true,
        manager: true,
        commitment: true,
        paidIn: true,
        nav: true,
        tvpi: true,
        dpi: true,
        irr: true,
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
        },
      })
    }

    // Calculate summary metrics
    const totalCommitment = funds.reduce((sum, f) => sum + (f.commitment || 0), 0)
    const totalPaidIn = funds.reduce((sum, f) => sum + (f.paidIn || 0), 0)
    const totalNav = funds.reduce((sum, f) => sum + (f.nav || 0), 0)
    const avgTvpi = funds.length > 0 ? funds.reduce((sum, f) => sum + (f.tvpi || 0), 0) / funds.length : 0
    const avgDpi = funds.length > 0 ? funds.reduce((sum, f) => sum + (f.dpi || 0), 0) / funds.length : 0
    const directInvestmentValue = directInvestments.reduce((sum, di) => sum + (di.currentValue || 0), 0)

    const normalizedFunds = funds.map((fund) => {
      const commitment = fund.commitment || 0
      const paidIn = fund.paidIn || 0
      const nav = fund.nav || 0
      
      return {
      ...fund,
        pic: commitment > 0 ? paidIn / commitment : 0,
        rvpi: paidIn > 0 ? nav / paidIn : 0,
      investmentType: 'Fund',
      entityType: 'Fund',
      }
    })

    const normalizedInvestments = directInvestments.map((di) => {
      const commitment = di.investmentAmount || 0
      const paidIn = di.investmentAmount || 0
      const nav = di.currentValue || 0
      
      return {
      id: di.id,
      name: di.name,
      domicile: di.industry || di.investmentType || 'Direct Investment',
      vintage: di.investmentDate ? new Date(di.investmentDate).getFullYear() : null,
      manager: di.stage || di.investmentType || 'Direct Investment',
        commitment,
        paidIn,
        nav,
        tvpi: paidIn > 0 ? nav / paidIn : 0,
      dpi: 0,
        irr: 0,
        pic: commitment > 0 ? paidIn / commitment : 1, // Usually 1 for direct investments (fully funded)
        rvpi: paidIn > 0 ? nav / paidIn : 0,
      investmentType: di.investmentType || 'Direct Investment',
      entityType: 'Direct Investment',
      }
    })

    const combinedEntities = [...normalizedFunds, ...normalizedInvestments]

    // Handle drag-and-drop builder configuration
    let reportData: any[] = []
    let chartConfig: any = {}
    
    if (builderMetrics.length > 0) {
      if (builderDimensions.length > 0) {
        const groupByField = builderDimensions[0].id
        // Group by first dimension
        const groups: { [key: string]: any[] } = {}

        combinedEntities.forEach((entity) => {
          const rawValue = entity[groupByField as keyof typeof entity]
          const groupKey = rawValue === null || typeof rawValue === 'undefined' ? 'Unknown' : String(rawValue)
          if (!groups[groupKey]) {
            groups[groupKey] = []
          }
          groups[groupKey].push(entity)
        })

        reportData = Object.entries(groups).map(([groupName, groupFunds]) => {
          const dataPoint: any = { name: groupName }
          
          // Calculate metrics for each selected metric
          builderMetrics.forEach((metric: any) => {
            const metricId = metric.id
            if (RATIO_METRICS.has(metricId)) {
              // Average for ratios
              dataPoint[metricId] = groupFunds.length > 0 
                ? groupFunds.reduce((sum, f) => sum + (f[metricId as keyof typeof f] as number || 0), 0) / groupFunds.length 
                : 0
            } else {
              // Sum for amounts
              dataPoint[metricId] = groupFunds.reduce((sum, f) => sum + (f[metricId as keyof typeof f] as number || 0), 0)
            }
          })
          
          return dataPoint
        })
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
        const groupCommitment = groupFunds.reduce((sum, f) => sum + (f.commitment || 0), 0)
        const groupPaidIn = groupFunds.reduce((sum, f) => sum + (f.paidIn || 0), 0)
        const groupNav = groupFunds.reduce((sum, f) => sum + (f.nav || 0), 0)
        const groupAvgTvpi = groupFunds.length > 0 
          ? groupFunds.reduce((sum, f) => sum + (f.tvpi || 0), 0) / groupFunds.length 
          : 0

        return {
          group: groupName,
          fundCount: groupFunds.length,
          commitment: groupCommitment,
          paidIn: groupPaidIn,
          nav: groupNav,
          tvpi: groupAvgTvpi,
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
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Report run error:', error)
    return NextResponse.json({ error: 'Failed to run report' }, { status: 500 })
  }
}
