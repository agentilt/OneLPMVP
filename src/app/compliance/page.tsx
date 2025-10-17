import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { FileText, Download } from 'lucide-react'
import Link from 'next/link'

export default async function CompliancePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Fetch compliance documents for the user's funds (now directly owned by user)
  const funds = await prisma.fund.findMany({
    where: { userId: session.user.id },
    include: {
      documents: {
        where: {
          type: 'COMPLIANCE',
        },
        orderBy: { uploadDate: 'desc' },
      },
    },
  })

  const complianceDocuments = funds.flatMap((fund) =>
    fund.documents.map((doc) => ({
      ...doc,
      fundName: fund.name,
    }))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Topbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Compliance & Regulatory Updates</h1>
            <p className="text-foreground/60">
              View compliance documents and regulatory updates for your funds
            </p>
          </div>

          {complianceDocuments.length > 0 ? (
            <div className="space-y-4">
              {complianceDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <FileText className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{doc.title}</h3>
                        <p className="text-sm text-foreground/60 mb-2">
                          {doc.fundName}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-foreground/60">
                          <span>
                            Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg p-12 text-center">
              <div className="p-4 bg-foreground/5 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-foreground/40" />
              </div>
              <p className="text-foreground/60 mb-2">
                No compliance documents available
              </p>
              <p className="text-sm text-foreground/40">
                Check back later for compliance and regulatory updates
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

