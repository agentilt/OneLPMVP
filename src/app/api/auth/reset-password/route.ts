import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validatePassword, hashPassword, isPasswordCommonlyUsed } from '@/lib/password-validation'
import { verifyPasswordResetToken, markPasswordResetTokenAsUsed, isTokenRateLimited, recordTokenAttempt } from '@/lib/token-security'
import { detectSuspiciousActivity, createSecurityResponse, addSecurityHeaders } from '@/lib/security-middleware'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
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

    // Enhanced password validation
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      recordTokenAttempt(`reset-${token}`, false)
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
      recordTokenAttempt(`reset-${token}`, false)
      return NextResponse.json(
        { error: 'Password is too common and easily guessable' },
        { status: 400 }
      )
    }

    // Verify reset token
    const { userId, valid } = await verifyPasswordResetToken(token)
    if (!valid) {
      recordTokenAttempt(`reset-${token}`, false)
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password with enhanced security
    const hashedPassword = await hashPassword(password)

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      },
    })

    // Mark reset token as used
    await markPasswordResetTokenAsUsed(token)
    recordTokenAttempt(`reset-${token}`, true)

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'PASSWORD_RESET_COMPLETED',
        description: 'Password successfully reset',
        severity: 'INFO'
      }
    })

    const response = NextResponse.json({ 
      message: 'Password has been reset successfully' 
    })

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}

