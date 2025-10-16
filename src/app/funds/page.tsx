import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { FundCard } from '@/components/FundCard'

export default async function FundsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Fetch user's funds with access control
  const fundsWithAccess = await prisma.fundAccess.findMany({
    where: { userId: session.user.id },
    include: {
      fund: {
        include: {
          navHistory: {
            orderBy: { date: 'asc' },
          },
        },
      },
    },
  })

  const funds = fundsWithAccess.map((fa) => fa.fund)

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">My Funds</h1>
            <p className="text-foreground/60">
              View and manage all your fund investments
            </p>
          </div>

          {funds.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {funds.map((fund) => (
                <FundCard key={fund.id} {...fund} />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg p-12 text-center">
              <p className="text-foreground/60 mb-4">
                You don't have access to any funds yet.
              </p>
              <p className="text-sm text-foreground/40">
                Contact your fund manager for access.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

