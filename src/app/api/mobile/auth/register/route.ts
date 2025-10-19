import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/db'
import { generateAccessToken, generateRefreshToken, createMobileResponse, MobileUser } from '@/lib/mobile-auth'

export async function POST(request: NextRequest) {
  try {
    const { token, firstName, lastName, password } = await request.json()

    if (!token || !firstName || !lastName || !password) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Missing required fields', 'Token, firstName, lastName, and password are required'),
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Password too short', 'Password must be at least 8 characters'),
        { status: 400 }
      )
    }

    // Find and validate invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token }
    })

    if (!invitation) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invalid invitation token', 'Invalid invitation token'),
        { status: 400 }
      )
    }

    if (invitation.usedAt) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invitation already used', 'Invitation has already been used'),
        { status: 400 }
      )
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invitation expired', 'Invitation has expired'),
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    })

    if (existingUser) {
      return NextResponse.json(
        createMobileResponse(false, null, 'User already exists', 'User with this email already exists'),
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        role: 'USER',
        emailVerified: new Date()
      }
    })

    // Mark invitation as used
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() }
    })

    const mobileUser: MobileUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }

    const accessToken = generateAccessToken(mobileUser)
    const refreshToken = generateRefreshToken(mobileUser)

    return NextResponse.json(
      createMobileResponse(true, {
        user: mobileUser,
        token: accessToken,
        refreshToken: refreshToken,
        expiresIn: 30 * 24 * 60 * 60 // 30 days in seconds
      }, null, 'Registration successful')
    )
  } catch (error) {
    console.error('Mobile registration error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred during registration'),
      { status: 500 }
    )
  }
}
