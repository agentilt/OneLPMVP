import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { createPasswordResetRecord, verifyPasswordResetToken, markPasswordResetTokenAsUsed, isTokenRateLimited, recordTokenAttempt, generatePasswordResetToken } from '@/lib/token-security'
import { validatePassword, hashPassword, isPasswordCommonlyUsed } from '@/lib/password-validation'
import { rateLimit, detectSuspiciousActivity, createSecurityResponse, addSecurityHeaders } from '@/lib/security-middleware'

// Request password reset
export async function POST(request: NextRequest) {
  // Security checks
  if (detectSuspiciousActivity(request)) {
    return createSecurityResponse('Suspicious activity detected')
  }

  const rateLimitResponse = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 3, message: 'Too many password reset requests' })(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    })

    if (!user) {
      return addSecurityHeaders(successResponse)
    }

    // Check if user is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return addSecurityHeaders(successResponse)
    }

    // Generate secure reset token
    const resetToken = generatePasswordResetToken()
    await createPasswordResetRecord(user.id, resetToken)
    
    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
    
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `
    })

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'PASSWORD_RESET_REQUESTED',
        description: 'Password reset requested',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'INFO'
      }
    })

    return addSecurityHeaders(successResponse)
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

// Verify reset token
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Reset token is required' },
      { status: 400 }
    )
  }

  // Check rate limiting
  if (isTokenRateLimited(`reset-${token}`)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const { userId, valid } = await verifyPasswordResetToken(token)
    
    if (!valid) {
      recordTokenAttempt(`reset-${token}`, false)
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    recordTokenAttempt(`reset-${token}`, true)
    
    return NextResponse.json({
      valid: true,
      message: 'Token is valid'
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred while verifying the token' },
      { status: 500 }
    )
  }
}