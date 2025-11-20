import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ForecastingClient } from './ForecastingClient'
import { Topbar } from '@/components/Topbar'

export const metadata = {
  title: 'Forecasting | OneLPM',
  description: 'Cash flow projections and scenario planning',
}

export default async function ForecastingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-background">
      <Topbar />
      <ForecastingClient />
    </div>
  )
}

