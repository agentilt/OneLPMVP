import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, name, password } = body

    // Validate input
    if (!token || !name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        name,
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
        name: user.name,
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

