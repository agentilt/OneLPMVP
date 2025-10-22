import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validatePassword, hashPassword, isPasswordCommonlyUsed } from '@/lib/password-validation'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
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

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password with enhanced security
    const hashedPassword = await hashPassword(password)

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({ 
      message: 'Password has been reset successfully' 
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}

