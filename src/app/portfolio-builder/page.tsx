import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { PortfolioBuilderClient } from './PortfolioBuilderClient'
import { Topbar } from '@/components/Topbar'

export const metadata = {
  title: 'Portfolio Builder | OneLPM',
  description: 'Optimize allocations and rebalance your portfolio',
}

export default async function PortfolioBuilderPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar />
      <PortfolioBuilderClient />
    </div>
  )
}

