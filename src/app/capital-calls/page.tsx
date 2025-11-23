import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CapitalCallsClient } from './CapitalCallsClient'

export const metadata = {
  title: 'Capital Calls | OneLP',
  description: 'Track pending and upcoming capital calls across your portfolio.',
}

export default async function CapitalCallsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  return <CapitalCallsClient />
}
