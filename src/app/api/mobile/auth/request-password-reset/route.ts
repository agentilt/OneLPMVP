import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { createMobileResponse } from '@/lib/mobile-auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Email is required', 'Email is required'),
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return NextResponse.json(
        createMobileResponse(true, null, null, 'If an account exists with this email, a reset link will be sent.')
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
    
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - OneLP Mobile',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your OneLP account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    })

    return NextResponse.json(
      createMobileResponse(true, null, null, 'Password reset instructions have been sent to your email')
    )
  } catch (error) {
    console.error('Mobile password reset request error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'Failed to process password reset request'),
      { status: 500 }
    )
  }
}
