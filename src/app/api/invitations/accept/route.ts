import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validatePassword, hashPassword } from '@/lib/password-validation'

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json()

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Token, email, and password are required' },
        { status: 400 }
      )
    }

    // Lookup invitation
    const invitation = await prisma.invitation.findUnique({ where: { token } })
    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }
    if (invitation.usedAt || invitation.used) {
      return NextResponse.json(
        { success: false, error: 'Invitation already used' },
        { status: 400 }
      )
    }
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Email does not match invitation' },
        { status: 400 }
      )
    }
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Invitation expired' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Password validation
    const pwResult = validatePassword(password)
    if (!pwResult.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Password failed validation',
        errors: pwResult.errors
      }, { status: 400 })
    }

    // Hash password
    const hashed = await hashPassword(password)

    // Create user, link to client via invitation if present
    const user = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
        password: hashed,
        role: invitation.role === 'ADMIN' ? 'ADMIN' : 'USER',
        clientId: invitation.clientId ?? undefined,
        emailVerified: new Date(),
      }
    })

    // Mark invitation as used
    await prisma.invitation.update({
      where: { token },
      data: { used: true, usedAt: new Date() }
    })

    // Return limited user info
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Invitation accept error:', error)
    return NextResponse.json({ success: false, error: 'Error accepting invitation' }, { status: 500 })
  }
}
