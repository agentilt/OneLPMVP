import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateAISuggestions } from '@/lib/ai/suggestions'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, clientId: true, firstName: true, name: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessibleFundIds =
    user.role === 'ADMIN'
      ? []
      : await prisma.fundAccess.findMany({
          where: { userId: session.user.id },
          select: { fundId: true },
        })

  const funds = await prisma.fund.findMany({
    where:
      user.role === 'ADMIN'
        ? {}
        : user.clientId
        ? { clientId: user.clientId }
        : {
            OR: [
              { userId: session.user.id },
              { id: { in: accessibleFundIds.map((f) => f.fundId) } },
            ],
          },
    select: {
      id: true,
      name: true,
      nav: true,
      irr: true,
      tvpi: true,
      dpi: true,
      commitment: true,
      paidIn: true,
    },
    orderBy: { nav: 'desc' },
    take: 25,
  })

  const directs = await prisma.directInvestment.findMany({
    where:
      user.role === 'ADMIN'
        ? {}
        : user.clientId
        ? { clientId: user.clientId }
        : { userId: session.user.id },
    select: {
      id: true,
      name: true,
      investmentType: true,
      investmentAmount: true,
      currentValue: true,
      stage: true,
      industry: true,
    },
    take: 25,
  })

  const now = new Date()
  const soon = new Date()
  soon.setDate(soon.getDate() + 60)

  const capitalCalls = await prisma.document.findMany({
    where: {
      type: 'CAPITAL_CALL',
      fund:
        user.role === 'ADMIN'
          ? {}
          : user.clientId
          ? { clientId: user.clientId }
          : {
              OR: [
                { userId: session.user.id },
                { id: { in: accessibleFundIds.map((f) => f.fundId) } },
              ],
            },
      OR: [
        { dueDate: { gte: now, lte: soon } },
        { paymentStatus: { in: ['PENDING', 'LATE', 'OVERDUE'] } },
      ],
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      callAmount: true,
      paymentStatus: true,
      fund: { select: { name: true } },
    },
    orderBy: { dueDate: 'asc' },
    take: 15,
  })

  const distributions = await prisma.distribution.findMany({
    where: {
      fund:
        user.role === 'ADMIN'
          ? {}
          : user.clientId
          ? { clientId: user.clientId }
          : {
              OR: [
                { userId: session.user.id },
                { id: { in: accessibleFundIds.map((f) => f.fundId) } },
              ],
            },
      distributionDate: { gte: now, lte: soon },
    },
    select: {
      id: true,
      distributionDate: true,
      amount: true,
      distributionType: true,
      description: true,
      fund: { select: { name: true } },
    },
    orderBy: { distributionDate: 'asc' },
    take: 15,
  })

  const fundCommitment = funds.reduce((sum, f) => sum + (f.commitment || 0), 0)
  const fundNav = funds.reduce((sum, f) => sum + (f.nav || 0), 0)
  const fundPaidIn = funds.reduce((sum, f) => sum + (f.paidIn || 0), 0)
  const fundDistributions = funds.reduce((sum, f) => sum + (f.dpi || 0) * (f.paidIn || 0), 0)
  const fundTvpi = fundPaidIn > 0 ? (fundNav + fundDistributions) / fundPaidIn : 0

  const activeCapitalCalls = capitalCalls.filter((c) => c.paymentStatus && ['PENDING', 'LATE', 'OVERDUE'].includes(c.paymentStatus)).length

  const suggestions = await generateAISuggestions(
    {
      userFirstName: user.firstName || user.name,
      portfolioSummary: {
        combinedNav: fundNav,
        combinedCommitment: fundCommitment,
        fundTvpi,
        activeCapitalCalls,
      },
      funds: funds.map((f) => ({
        name: f.name,
        nav: f.nav,
        irr: f.irr,
        tvpi: f.tvpi,
        dpi: f.dpi,
        commitment: f.commitment,
        paidIn: f.paidIn,
      })),
      capitalCalls: capitalCalls.map((c) => ({
        fundName: c.fund?.name,
        dueDate: c.dueDate,
        callAmount: c.callAmount,
        status: c.paymentStatus,
        title: c.title,
      })),
      distributions: distributions.map((d) => ({
        fundName: d.fund?.name,
        amount: d.amount,
        distributionDate: d.distributionDate,
        distributionType: d.distributionType,
        description: d.description,
      })),
      directInvestments: directs.map((d) => ({
        name: d.name,
        investmentType: d.investmentType,
        currentValue: d.currentValue,
        investmentAmount: d.investmentAmount,
        stage: d.stage,
        industry: d.industry,
      })),
    },
    5
  )

  return NextResponse.json({ suggestions })
}


