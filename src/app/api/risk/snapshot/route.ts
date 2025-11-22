import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { computeRiskReport } from '@/lib/riskEngine'
import { inferFundAssetClass, mapInvestmentTypeToAssetClass } from '@/lib/assetClass'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, clientId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let fundsWhereClause: any = {}
    if (user.role === 'ADMIN') {
      fundsWhereClause = {}
    } else if (user.clientId) {
      fundsWhereClause = { clientId: user.clientId }
    } else {
      const accessibleFundIds = await prisma.fundAccess.findMany({
        where: { userId: session.user.id },
        select: { fundId: true },
      })
      fundsWhereClause = {
        OR: [
          { userId: session.user.id },
          { id: { in: accessibleFundIds.map((a) => a.fundId) } },
        ],
      }
    }

    const [fundsRaw, directInvestmentsRaw, policy] = await Promise.all([
      prisma.fund.findMany({ 
        where: fundsWhereClause,
        select: { id: true },
      }),
      prisma.directInvestment.findMany({
        where:
          user.role === 'ADMIN'
            ? {}
            : user.clientId
            ? { clientId: user.clientId }
            : { userId: session.user.id },
      }),
      prisma.riskPolicy.upsert({
        where: { userId: session.user.id },
        update: {},
        create: { userId: session.user.id },
      }),
    ])

    // Get fund IDs to filter documents and distributions
    const fundIds = fundsRaw.map((f) => f.id)

    // Now fetch funds with full data, and related documents/distributions
    const [fundsFull, capitalCallDocsRaw, distributionsRaw] = await Promise.all([
      prisma.fund.findMany({ where: fundsWhereClause }),
      fundIds.length > 0
        ? prisma.document.findMany({
            where: {
              type: 'CAPITAL_CALL',
              fundId: { in: fundIds },
            },
            select: {
              id: true,
              fundId: true,
              callAmount: true,
              dueDate: true,
              uploadDate: true,
              paymentStatus: true,
            },
          })
        : [],
      fundIds.length > 0
        ? prisma.distribution.findMany({
            where: {
              fundId: { in: fundIds },
            },
            select: {
              id: true,
              fundId: true,
              amount: true,
              distributionDate: true,
            },
          })
        : [],
    ])

    const funds = fundsFull.map((fund) => ({
      ...fund,
      assetClass: fund.assetClass || inferFundAssetClass(fund),
    }))

    const directInvestments = directInvestmentsRaw.map((di) => ({
      ...di,
      assetClass: mapInvestmentTypeToAssetClass(di.investmentType as string | null),
    }))

    const targetFundIds = new Set(funds.map((fund) => fund.id))

    const capitalCalls = capitalCallDocsRaw
      .filter((doc) => targetFundIds.has(doc.fundId))
      .map((doc) => ({
        id: doc.id,
        fundId: doc.fundId,
        amount: doc.callAmount || 0,
        dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
        uploadDate: doc.uploadDate ? doc.uploadDate.toISOString() : null,
        paymentStatus: doc.paymentStatus,
      }))

    const distributions = distributionsRaw
      .filter((dist) => targetFundIds.has(dist.fundId))
      .map((dist) => ({
        id: dist.id,
        fundId: dist.fundId,
        amount: dist.amount,
        distributionDate: dist.distributionDate ? dist.distributionDate.toISOString() : null,
      }))

    const report = computeRiskReport({
      funds: funds.map((fund) => ({
        id: fund.id,
        name: fund.name,
        manager: fund.manager,
        domicile: fund.domicile,
        commitment: fund.commitment,
        paidIn: fund.paidIn,
        nav: fund.nav,
        vintage: fund.vintage,
        assetClass: fund.assetClass,
        sector: fund.sector,
        baseCurrency: fund.baseCurrency,
        leverage: fund.leverage,
        tvpi: fund.tvpi,
        dpi: fund.dpi,
        irr: fund.irr,
      })),
      directInvestments: directInvestments.map((di) => ({
        id: di.id,
        name: di.name,
        currentValue: di.currentValue,
        investmentAmount: di.investmentAmount,
        assetClass: di.assetClass,
        sector: di.industry,
        geography: di.propertyAddress || di.industry || 'Direct Holdings',
        currency: di.currency,
      })),
      capitalCalls,
      distributions,
      policy,
    })

    const snapshot = await prisma.riskSnapshot.create({
      data: {
        userId: session.user.id,
        clientId: user.clientId,
        overallRiskScore: report.riskScores.overall,
        concentrationRiskScore: report.riskScores.concentration,
        liquidityRiskScore: report.riskScores.liquidity,
        totalPortfolio: report.metrics.totalPortfolio,
        unfundedCommitments: report.metrics.unfundedCommitments,
        liquidityCoverage: report.liquidity.liquidityCoverage,
        concentrationByAsset: JSON.parse(JSON.stringify(report.exposures.assetClass)),
        concentrationByGeo: JSON.parse(JSON.stringify(report.exposures.geography)),
        policyBreaches: JSON.parse(JSON.stringify(report.policyBreaches)),
      },
    })

    return NextResponse.json({ snapshot })
  } catch (error) {
    console.error('Risk snapshot error:', error)
    return NextResponse.json({ error: 'Failed to capture snapshot' }, { status: 500 })
  }
}
