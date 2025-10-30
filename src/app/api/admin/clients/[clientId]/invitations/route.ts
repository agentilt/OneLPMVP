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
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      },
    })
    if (existingInvitation) {
      return NextResponse.json({ error: 'Active invitation exists for this email and client' }, { status: 400 })
    }

    const token = generateInvitationToken()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48) // 48h
    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        role: 'USER',
        expiresAt,
        invitedBy: session.user.id,
        used: false,
      },
    })

    await sendInvitationEmail(email, token, session.user.name || 'Admin')
    // Returning just token for frontend copy (not full invitation)
    return NextResponse.json({ data: { token } }, { status: 201 })
  } catch (error) {
    console.error('Client invitation creation error:', error)
    return NextResponse.json({ error: 'An error occurred creating invitation' }, { status: 500 })
  }
}
