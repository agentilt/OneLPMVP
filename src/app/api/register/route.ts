import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validatePassword, hashPassword, isPasswordCommonlyUsed } from '@/lib/password-validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, firstName, lastName, password } = body

    // Validate input
    if (!token || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors,
          strength: passwordValidation.score
        },
        { status: 400 }
      )
    }

    // Check for commonly used passwords
    if (isPasswordCommonlyUsed(password)) {
      return NextResponse.json(
        { error: 'Password is too common and easily guessable' },
        { status: 400 }
      )
    }

    // Find and validate invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 }
      )
    }

    if (invitation.usedAt) {
      return NextResponse.json(
        { error: 'Invitation has already been used' },
        { status: 400 }
      )
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password with enhanced security
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        role: 'USER',
        emailVerified: new Date(),
      },
    })

    // Mark invitation as used
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}

