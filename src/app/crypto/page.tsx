import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CryptoClient } from './CryptoClient'

export default async function CryptoPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      clientId: true,
      role: true,
    },
  })

  const holdingsWhereClause =
    session.user.role === 'ADMIN'
      ? {}
      : user?.clientId
        ? { user: { clientId: user.clientId } }
        : { userId: session.user.id }

  const holdings = await prisma.cryptoHolding.findMany({
    where: holdingsWhereClause,
    select: {
      id: true,
      symbol: true,
      name: true,
      amount: true,
      valueUsd: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const serializedHoldings = holdings.map((holding) => {
    const { firstName, lastName, name, email } = holding.user ?? {}
    const ownerDisplayName =
      holding.user
        ? [firstName, lastName]
            .filter(Boolean)
            .join(' ')
            .trim() || name || email
        : undefined

    return {
      id: holding.id,
      symbol: holding.symbol,
      name: holding.name,
      amount: holding.amount,
      valueUsd: holding.valueUsd,
      updatedAt: holding.updatedAt.toISOString(),
      owner: holding.user
        ? {
            id: holding.user.id,
            displayName: ownerDisplayName ?? 'Unassigned',
          }
        : undefined,
    }
  })

  const totalValue = holdings.reduce((sum, holding) => sum + holding.valueUsd, 0)
  const showOwnerColumn = session.user.role === 'ADMIN' || Boolean(user?.clientId)

  return (
    <CryptoClient
      holdings={serializedHoldings}
      totalValue={totalValue}
      showOwnerColumn={showOwnerColumn}
    />
  )
}