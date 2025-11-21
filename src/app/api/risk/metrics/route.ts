import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { computeRiskReport } from '@/lib/riskEngine'
import { inferFundAssetClass, mapInvestmentTypeToAssetClass } from '@/lib/assetClass'

type FocusMode = 'portfolio' | 'fund' | 'assetClass'

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

    const body = await request.json().catch(() => ({}))
    const mode: FocusMode = ['portfolio', 'fund', 'assetClass'].includes(body.mode)
      ? body.mode
      : 'portfolio'
    const requestedFundId = typeof body.fundId === 'string' ? body.fundId : undefined
    const requestedAssetClass = typeof body.assetClass === 'string' ? body.assetClass : undefined

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

    const [fundsRaw, directInvestmentsRaw, capitalCallDocsRaw, distributionsRaw, policy] =
      await Promise.all([
        prisma.fund.findMany({
          where: fundsWhereClause,
          orderBy: { commitment: 'desc' },
        }),
        prisma.directInvestment.findMany({
          where:
            user.role === 'ADMIN'
              ? {}
              : user.clientId
              ? { clientId: user.clientId }
              : { userId: session.user.id },
          orderBy: { investmentAmount: 'desc' },
        }),
        prisma.document.findMany({
          where: {
            type: 'CAPITAL_CALL',
            fund: {
              is: fundsWhereClause,
            },
          },
          select: {
            id: true,
            fundId: true,
            callAmount: true,
            dueDate: true,
            uploadDate: true,
            paymentStatus: true,
          },
        }),
        prisma.distribution.findMany({
          where: {
            fund: {
              is: fundsWhereClause,
            },
          },
          select: {
            id: true,
            fundId: true,
            amount: true,
            distributionDate: true,
          },
        }),
        prisma.riskPolicy.upsert({
          where: { userId: session.user.id },
          update: {},
          create: { userId: session.user.id },
        }),
      ])

    const funds = fundsRaw.map((fund) => ({
      ...fund,
      assetClass: fund.assetClass || inferFundAssetClass(fund),
    }))

    let filteredFunds = funds
    let filteredDirectInvestments = directInvestmentsRaw.map((di) => ({
      ...di,
      assetClass: mapInvestmentTypeToAssetClass(di.investmentType as string | null),
    }))

    if (mode === 'fund' && requestedFundId && requestedFundId !== 'all') {
      filteredFunds = funds.filter((fund) => fund.id === requestedFundId)
      if (!filteredFunds.length) {
        return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
      }
      filteredDirectInvestments = []
    }

    if (mode === 'assetClass' && requestedAssetClass && requestedAssetClass !== 'all') {
      filteredFunds = funds.filter((fund) => fund.assetClass === requestedAssetClass)
      filteredDirectInvestments = filteredDirectInvestments.filter(
        (di) => di.assetClass === requestedAssetClass
      )
    }

    if (!filteredFunds.length && mode !== 'assetClass') {
      return NextResponse.json(
        { error: 'No funds available for this focus mode' },
        { status: 400 }
      )
    }

    const targetFundIds = new Set(filteredFunds.map((fund) => fund.id))

    const filteredCapitalCalls = capitalCallDocsRaw
      .filter((doc) => targetFundIds.has(doc.fundId))
      .map((doc) => ({
        id: doc.id,
        fundId: doc.fundId,
        amount: doc.callAmount || 0,
        dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
        uploadDate: doc.uploadDate ? doc.uploadDate.toISOString() : null,
        paymentStatus: doc.paymentStatus,
      }))

    const filteredDistributions = distributionsRaw
      .filter((dist) => targetFundIds.has(dist.fundId))
      .map((dist) => ({
        id: dist.id,
        fundId: dist.fundId,
        amount: dist.amount,
        distributionDate: dist.distributionDate ? dist.distributionDate.toISOString() : null,
      }))

    const report = computeRiskReport({
      funds: filteredFunds.map((fund) => ({
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
      directInvestments: filteredDirectInvestments.map((di) => ({
        id: di.id,
        name: di.name,
        currentValue: di.currentValue,
        investmentAmount: di.investmentAmount,
        assetClass: di.assetClass,
        sector: di.industry,
        geography: di.propertyAddress || di.industry || 'Direct Holdings',
        currency: di.currency,
      })),
      capitalCalls: filteredCapitalCalls,
      distributions: filteredDistributions,
      policy,
    })

    const focusLabel =
      mode === 'fund' && requestedFundId && requestedFundId !== 'all'
        ? filteredFunds[0]?.name || 'Selected Fund'
        : mode === 'assetClass' && requestedAssetClass && requestedAssetClass !== 'all'
        ? `${requestedAssetClass} exposure`
        : 'Entire portfolio'

    return NextResponse.json({
      focus: {
        mode,
        fundId: mode === 'fund' ? requestedFundId || null : null,
        assetClass: mode === 'assetClass' ? requestedAssetClass || null : null,
        label: focusLabel,
      },
      policy,
      report,
    })
  } catch (error) {
    console.error('Risk metrics API error:', error)
    return NextResponse.json({ error: 'Failed to compute risk metrics' }, { status: 500 })
  }
}

