import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReportsClientNew } from './ReportsClientNew'
import { prisma } from '@/lib/db'

export const metadata = {
  title: 'Reports - OneLP',
  description: 'Custom reports and analytics',
}

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Fetch user's saved reports (handle missing table gracefully)
  let savedReports: any[] = []
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
  }

  // Fetch user's accessible funds for report building
  const fundAccess = await prisma.fundAccess.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      fund: {
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
      },
    },
  })

  const funds = fundAccess.map((fa) => fa.fund)

  // Fetch user's direct investments
  const directInvestments = await prisma.directInvestment.findMany({
    where: {
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

  return (
    <ReportsClientNew
      savedReports={savedReports}
      funds={funds}
      directInvestments={directInvestments}
      userRole={session.user.role || 'LIMITED_PARTNER'}
    />
  )
}

