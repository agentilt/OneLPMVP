import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateInvitationToken } from '@/lib/utils'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
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
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { clientId } = await params
    const { email } = await request.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Check client exists
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check user exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Existing active invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        usedAt: null,
        expiresAt: { gt: new Date() },
        clientId,
      },
    })
    if (existingInvitation) {
      return NextResponse.json({ error: 'Active invitation exists for this email and client' }, { status: 400 })
    }

    const token = generateInvitationToken()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48) // Two days expiry
    
    try {
      const invitation = await prisma.invitation.create({
        data: {
          email,
          token,
          role: 'USER',
          expiresAt,
          invitedBy: userId,
          clientId,
          used: false,
        },
      })

      // Send email (non-blocking - invitation is created regardless)
      const emailResult = await sendInvitationEmail(email, token, invitingUser.name || 'Admin')
      if (!emailResult.success) {
        console.warn(`Invitation created but email not sent: ${emailResult.error}`)
      }
      
      // Returning just token for frontend copy (not full invitation)
      return NextResponse.json({ 
        data: { 
          token,
          emailSent: emailResult.success 
        } 
      }, { status: 201 })
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
    console.error('Client invitation creation error:', error)
    
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
        error: 'An error occurred creating invitation',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
