import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReportsClientNew } from './ReportsClientNew'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Reports - OneLP',
  description: 'Custom reports and analytics',
}

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, clientId: true },
  })

  if (!currentUser) {
    redirect('/login')
  }

  // Fetch user's saved reports (handle missing table gracefully)
  let savedReports: any[] = []
  let savedReportsError = false
  try {
    savedReports = await prisma.savedReport.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
  } catch (error) {
    // Table doesn't exist yet - migrations not run
    console.log('SavedReport table not found - migrations pending')
    savedReports = []
    savedReportsError = true
  }

  let fundsWhereClause: any = {}

  if (currentUser.role === 'ADMIN') {
    fundsWhereClause = {}
  } else if (currentUser.clientId) {
    fundsWhereClause = { clientId: currentUser.clientId }
  } else {
    const fundAccess = await prisma.fundAccess.findMany({
      where: { userId: session.user.id },
      select: { fundId: true },
    })
    const accessibleIds = fundAccess.map((fa) => fa.fundId)
    fundsWhereClause = accessibleIds.length
      ? {
          OR: [{ id: { in: accessibleIds } }, { userId: session.user.id }],
        }
      : { userId: session.user.id }
  }

  const funds = await prisma.fund.findMany({
    where: fundsWhereClause,
    orderBy: { name: 'asc' },
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
      assetClass: true,
      strategy: true,
      sector: true,
      baseCurrency: true,
      updatedAt: true,
    },
  })

  // Fetch user's direct investments
  let directInvestmentWhereClause: any = {}
  if (currentUser.role === 'ADMIN') {
    directInvestmentWhereClause = {}
  } else if (currentUser.clientId) {
    directInvestmentWhereClause = { clientId: currentUser.clientId }
  } else {
    directInvestmentWhereClause = { userId: session.user.id }
  }

  const directInvestments = await prisma.directInvestment.findMany({
    where: directInvestmentWhereClause,
    orderBy: { name: 'asc' },
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

  return (
    <ReportsClientNew
      savedReports={savedReports}
      funds={funds}
      directInvestments={directInvestments}
      userRole={session.user.role || 'LIMITED_PARTNER'}
      savedReportsError={savedReportsError}
    />
  )
}
