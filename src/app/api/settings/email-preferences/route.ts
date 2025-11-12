import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { emailWeeklyReports, emailMonthlyReports } = body

    // Validate input
    if (typeof emailWeeklyReports !== 'boolean' || typeof emailMonthlyReports !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid email preference values' },
        { status: 400 }
      )
    }

    // Update user email preferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailWeeklyReports,
        emailMonthlyReports,
      },
      select: {
        id: true,
        emailWeeklyReports: true,
        emailMonthlyReports: true,
      },
    })

    return NextResponse.json({
      success: true,
      emailPreferences: {
        emailWeeklyReports: updatedUser.emailWeeklyReports,
        emailMonthlyReports: updatedUser.emailMonthlyReports,
      },
    })
  } catch (error) {
    console.error('Error updating email preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update email preferences' },
      { status: 500 }
    )
  }
}

