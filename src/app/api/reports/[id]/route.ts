import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    try {
      // Verify ownership
      const report = await prisma.savedReport.findUnique({
        where: { id },
        select: { userId: true },
      })

      if (!report || report.userId !== session.user.id) {
        return NextResponse.json({ error: 'Report not found or unauthorized' }, { status: 404 })
      }

      await prisma.savedReport.delete({
        where: { id },
      })

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      // Handle missing table gracefully
      if (dbError.code === 'P2021') {
        return NextResponse.json({ 
          error: 'Save Reports feature requires database migration.',
          code: 'MIGRATION_REQUIRED'
        }, { status: 503 })
      }
      throw dbError
    }
  } catch (error) {
    console.error('Delete report error:', error)
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
  }
}

