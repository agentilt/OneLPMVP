import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

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
  } catch (error) {
    console.error('Delete report error:', error)
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
  }
}

