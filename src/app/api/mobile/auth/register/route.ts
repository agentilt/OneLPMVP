import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateAccessToken, generateRefreshToken, createMobileResponse, MobileUser } from '@/lib/mobile-auth'
import { validatePassword, hashPassword, isPasswordCommonlyUsed } from '@/lib/password-validation'
import { rateLimit, validateRequestSize, detectSuspiciousActivity, createSecurityResponse, addSecurityHeaders } from '@/lib/security-middleware'

export async function POST(request: NextRequest) {
  // Security checks
  if (detectSuspiciousActivity(request)) {
    return createSecurityResponse('Suspicious activity detected')
  }

  if (!validateRequestSize(request)) {
    return createSecurityResponse('Request too large')
  }

  const rateLimitResponse = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5, message: 'Too many registration attempts' })(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  try {
    const { token, firstName, lastName, password, consentAccepted } = await request.json()

    if (!token || !firstName || !lastName || !password) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Missing required fields', 'Token, firstName, lastName, and password are required'),
        { status: 400 }
      )
    }

    // Validate consent checkbox
    if (!consentAccepted) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Consent required', 'You must accept the Terms of Service and Privacy Policy to register'),
        { status: 400 }
      )
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Password validation failed', passwordValidation.errors.join('; ')),
        { status: 400 }
      )
    }

    // Check for commonly used passwords
    if (isPasswordCommonlyUsed(password)) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Password too common', 'Password is too common and easily guessable'),
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

    // Hash password with enhanced security
    const hashedPassword = await hashPassword(password)

    // Create user with consent timestamps
    const now = new Date()
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        role: 'USER',
        emailVerified: now,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
      }
    })

    // Mark invitation as used
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() }
    })

    // Log security events for consent acceptance
    await Promise.all([
      prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'TERMS_ACCEPTED',
          description: 'User accepted terms of service during mobile registration',
          severity: 'INFO'
        }
      }),
      prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'PRIVACY_POLICY_ACCEPTED',
          description: 'User accepted privacy policy during mobile registration',
          severity: 'INFO'
        }
      })
    ])

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

    const response = NextResponse.json(
      createMobileResponse(true, {
        user: mobileUser,
        token: accessToken,
        refreshToken: refreshToken,
        expiresIn: 60 * 60 // 1 hour in seconds
      }, null, 'Registration successful')
    )

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Mobile registration error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred during registration'),
      { status: 500 }
    )
  }
}
