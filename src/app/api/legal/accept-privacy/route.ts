import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { withAuditLogging } from '@/lib/audit-middleware'

/**
 * POST /api/legal/accept-privacy
 * Accept or re-accept the privacy policy
 */
async function acceptPrivacyPolicy(request: NextRequest) {
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
        { error: 'Privacy policy acceptance is required' },
        { status: 400 }
      )
    }

    // Update user's privacy acceptance timestamp
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        privacyAcceptedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        privacyAcceptedAt: true,
      },
    })

    // Log the acceptance event
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'PRIVACY_POLICY_ACCEPTED',
        description: 'User accepted privacy policy',
        severity: 'INFO',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Privacy policy accepted',
      privacyAcceptedAt: user.privacyAcceptedAt,
    })
  } catch (error) {
    console.error('Privacy policy acceptance error:', error)
    return NextResponse.json(
      { error: 'An error occurred while accepting privacy policy' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/legal/privacy-status
 * Check privacy policy acceptance status
 */
async function getPrivacyStatus(request: NextRequest) {
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
        privacyAcceptedAt: true,
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
      privacyAccepted: !!user.privacyAcceptedAt,
      privacyAcceptedAt: user.privacyAcceptedAt,
      termsAccepted: !!user.termsAcceptedAt,
      termsAcceptedAt: user.termsAcceptedAt,
    })
  } catch (error) {
    console.error('Privacy status check error:', error)
    return NextResponse.json(
      { error: 'An error occurred while checking privacy status' },
      { status: 500 }
    )
  }
}

export const POST = withAuditLogging(
  acceptPrivacyPolicy,
  {
    action: 'UPDATE',
    resource: 'USER',
    getResourceId: (request, context, session) => {
      return session?.user?.id
    },
    getDescription: () => 'User accepted privacy policy'
  }
)

export const GET = getPrivacyStatus

