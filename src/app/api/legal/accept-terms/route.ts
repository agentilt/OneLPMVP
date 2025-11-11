import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { withAuditLogging } from '@/lib/audit-middleware'

/**
 * POST /api/legal/accept-terms
 * Accept or re-accept the terms of service
 */
async function acceptTerms(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { accepted } = body

    if (accepted !== true) {
      return NextResponse.json(
        { error: 'Terms of service acceptance is required' },
        { status: 400 }
      )
    }

    // Update user's terms acceptance timestamp
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        termsAcceptedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        termsAcceptedAt: true,
      },
    })

    // Log the acceptance event
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'TERMS_ACCEPTED',
        description: 'User accepted terms of service',
        severity: 'INFO',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Terms of service accepted',
      termsAcceptedAt: user.termsAcceptedAt,
    })
  } catch (error) {
    console.error('Terms acceptance error:', error)
    return NextResponse.json(
      { error: 'An error occurred while accepting terms of service' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/legal/terms-status
 * Check terms of service acceptance status
 */
async function getTermsStatus(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        termsAcceptedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      termsAccepted: !!user.termsAcceptedAt,
      termsAcceptedAt: user.termsAcceptedAt,
    })
  } catch (error) {
    console.error('Terms status check error:', error)
    return NextResponse.json(
      { error: 'An error occurred while checking terms status' },
      { status: 500 }
    )
  }
}

export const POST = withAuditLogging(
  acceptTerms,
  {
    action: 'UPDATE',
    resource: 'USER',
    getResourceId: async (request) => {
      const session = await getServerSession(authOptions)
      return session?.user?.id
    },
    getDescription: () => 'User accepted terms of service'
  }
)

export const GET = getTermsStatus

