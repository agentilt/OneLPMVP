import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await request.json()

    // Get accessible fund IDs for this user
    const fundAccessRecords = await prisma.fundAccess.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        fundId: true,
      },
    })
    
    const accessibleFundIds = fundAccessRecords.map((fa) => fa.fundId)

    // Fetch funds based on filters (intersect with accessible funds)
    let targetFundIds = accessibleFundIds
    if (config.filters.fundIds && config.filters.fundIds.length > 0) {
      // Only include funds that user has access to AND are in the filter
      targetFundIds = config.filters.fundIds.filter((id: string) => accessibleFundIds.includes(id))
    }

    const fundQuery: any = {
      id: { in: targetFundIds },
    }

    if (config.filters.vintage && config.filters.vintage.length > 0) {
      fundQuery.vintage = { in: config.filters.vintage }
    }

    if (config.filters.domicile && config.filters.domicile.length > 0) {
      fundQuery.domicile = { in: config.filters.domicile }
    }

    if (config.filters.manager && config.filters.manager.length > 0) {
      fundQuery.manager = { in: config.filters.manager }
    }

    const funds = await prisma.fund.findMany({
      where: fundQuery,
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
      },
    })

    // Fetch direct investments if included
    let directInvestments: any[] = []
    if (config.filters.investmentIds && config.filters.investmentIds.length > 0) {
      directInvestments = await prisma.directInvestment.findMany({
        where: {
          id: { in: config.filters.investmentIds },
          userId: session.user.id,
        },
        select: {
          id: true,
          name: true,
          investmentType: true,
          industry: true,
          stage: true,
          investmentAmount: true,
          currentValue: true,
        },
      })
    }

    // Calculate summary metrics
    const totalCommitment = funds.reduce((sum, f) => sum + (f.commitment || 0), 0)
    const totalPaidIn = funds.reduce((sum, f) => sum + (f.paidIn || 0), 0)
    const totalNav = funds.reduce((sum, f) => sum + (f.nav || 0), 0)
    const avgTvpi = funds.length > 0 ? funds.reduce((sum, f) => sum + (f.tvpi || 0), 0) / funds.length : 0
    const avgDpi = funds.length > 0 ? funds.reduce((sum, f) => sum + (f.dpi || 0), 0) / funds.length : 0

    // Handle drag-and-drop builder configuration
    let reportData: any[] = []
    let chartConfig: any = {}
    
    if (config.builderConfig?.dimensions && config.builderConfig?.metrics) {
      // New drag-and-drop builder format
      const { dimensions, metrics } = config.builderConfig
      
      if (dimensions.length > 0) {
        // Group by first dimension
        const groupByField = dimensions[0].id
        const groups: { [key: string]: any[] } = {}

        funds.forEach((fund) => {
          const groupKey = String(fund[groupByField as keyof typeof fund] || 'Unknown')
          if (!groups[groupKey]) {
            groups[groupKey] = []
          }
          groups[groupKey].push(fund)
        })

        reportData = Object.entries(groups).map(([groupName, groupFunds]) => {
          const dataPoint: any = { name: groupName }
          
          // Calculate metrics for each selected metric
          metrics.forEach((metric: any) => {
            const metricId = metric.id
            if (metricId === 'tvpi' || metricId === 'dpi') {
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
        reportData = funds.map((fund) => {
          const dataPoint: any = { name: fund.name }
          metrics.forEach((metric: any) => {
            dataPoint[metric.id] = fund[metric.id as keyof typeof fund] || 0
          })
          return dataPoint
        })
      }
      
      chartConfig = {
        xAxisField: 'name',
        yAxisFields: metrics.map((m: any) => m.id),
        chartType: config.builderConfig.chartType || 'bar',
      }
    } else {
      // Legacy groupBy format
      let groupedData: any[] = []
      if (config.groupBy && config.groupBy !== 'none') {
        const groups: { [key: string]: any[] } = {}

        funds.forEach((fund) => {
          const groupKey = fund[config.groupBy as keyof typeof fund] as string
          if (!groups[groupKey]) {
            groups[groupKey] = []
          }
          groups[groupKey].push(fund)
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
      
      reportData = config.groupBy !== 'none' ? groupedData : funds
    }

    const result = {
      summary: {
        fundCount: funds.length,
        totalCommitment,
        totalPaidIn,
        totalNav,
        avgTvpi,
        avgDpi,
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

