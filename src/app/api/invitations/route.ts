import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateInvitationToken } from '@/lib/utils'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Get user ID from header (preferred for admin app) or session
    const userIdFromHeader = request.headers.get('x-user-id')
    const session = await getServerSession(authOptions)
    
    // Determine user ID - prefer header over session
    let userId: string | undefined
    if (userIdFromHeader) {
      userId = userIdFromHeader
    } else if (session?.user?.id) {
      userId = session.user.id
    }

    // Verify user exists and is admin
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID not found. Please ensure you are logged in.' },
        { status: 401 }
      )
    }

    // Verify user exists in database
    const invitingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true, email: true }
    })

    if (!invitingUser) {
      return NextResponse.json(
        { 
          error: 'Invalid user session. The user ID does not exist in the database.',
          details: 'Please log out and log back in with a valid account.'
        },
        { status: 401 }
      )
    }

    // Check admin role
    if (invitingUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Check for existing valid invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An active invitation already exists for this email' },
        { status: 400 }
      )
    }

    // Create invitation
    const token = generateInvitationToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48) // 48 hours expiry

    try {
      const invitation = await prisma.invitation.create({
        data: {
          email,
          token,
          role: 'USER', // Default role for invitations
          expiresAt,
          invitedBy: userId,
          used: false,
        },
      })

      // Send email (non-blocking - invitation is created regardless)
      const emailResult = await sendInvitationEmail(email, token, invitingUser.name || 'Admin')
      if (!emailResult.success) {
        console.warn(`Invitation created but email not sent: ${emailResult.error}`)
      }

      return NextResponse.json({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expiresAt,
        },
        emailSent: emailResult.success,
      })
    } catch (error: any) {
      // Handle foreign key constraint violation specifically
      if (error.code === 'P2003') {
        console.error('Foreign key constraint violation:', error)
        return NextResponse.json(
          { 
            error: 'Invalid user ID for invitation creation',
            details: 'The user ID does not exist in the database. Please log out and log back in.',
            code: 'FOREIGN_KEY_VIOLATION'
          },
          { status: 401 }
        )
      }
      throw error
    }
  } catch (error: any) {
    console.error('Invitation creation error:', error)
    
    // Handle Prisma errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { 
          error: 'Database constraint violation',
          details: 'The user ID in your session does not exist. Please log out and log back in.',
          code: 'FOREIGN_KEY_VIOLATION'
        },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'An error occurred while creating invitation',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Failed to fetch invitations:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

