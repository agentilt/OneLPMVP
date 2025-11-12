import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validatePassword, hashPassword, isPasswordCommonlyUsed } from '@/lib/password-validation'
import { verifyInvitationToken, markInvitationAsUsed, isTokenRateLimited, recordTokenAttempt } from '@/lib/token-security'
import { rateLimit, detectSuspiciousActivity, createSecurityResponse, addSecurityHeaders } from '@/lib/security-middleware'

export async function POST(request: NextRequest) {
  // Security checks
  if (detectSuspiciousActivity(request)) {
    return createSecurityResponse('Suspicious activity detected')
  }

  const rateLimitResponse = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 3, message: 'Too many registration attempts' })(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()
    const { token, firstName, lastName, password, consentAccepted } = body

    // Validate input
    if (!token || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate consent checkbox
    if (!consentAccepted) {
      return NextResponse.json(
        { error: 'You must accept the Terms of Service and Privacy Policy to register' },
        { status: 400 }
      )
    }

    // Check rate limiting for invitation token
    if (isTokenRateLimited(`invitation-${token}`)) {
      return NextResponse.json(
        { error: 'Too many attempts with this invitation. Please try again later.' },
        { status: 429 }
      )
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      recordTokenAttempt(`invitation-${token}`, false)
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
      recordTokenAttempt(`invitation-${token}`, false)
      return NextResponse.json(
        { error: 'Password is too common and easily guessable' },
        { status: 400 }
      )
    }

    // Verify invitation token using secure method
    const { email, role, clientId, valid } = await verifyInvitationToken(token)
    if (!valid) {
      recordTokenAttempt(`invitation-${token}`, false)
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      recordTokenAttempt(`invitation-${token}`, false)
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password with enhanced security
    const hashedPassword = await hashPassword(password)

    // Create user with consent timestamps and client assignment
    const now = new Date()
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        role: role as any,
        clientId: clientId || undefined, // Assign to client from invitation
        emailVerified: now,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
      },
    })

    // Mark invitation as used
    await markInvitationAsUsed(token)
    recordTokenAttempt(`invitation-${token}`, true)

    // Log security events
    await Promise.all([
      prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'USER_REGISTERED',
          description: 'User registered via invitation',
          severity: 'INFO'
        }
      }),
      prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'TERMS_ACCEPTED',
          description: 'User accepted terms of service during registration',
          severity: 'INFO'
        }
      }),
      prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'PRIVACY_POLICY_ACCEPTED',
          description: 'User accepted privacy policy during registration',
          severity: 'INFO'
        }
      })
    ])

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    })

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}

