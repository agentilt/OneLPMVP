import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/db'
import { createMobileResponse } from '@/lib/mobile-auth'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Token and password are required', 'Token and password are required'),
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Password too short', 'Password must be at least 8 characters'),
        { status: 400 }
      )
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invalid or expired token', 'Invalid or expired reset token'),
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    return NextResponse.json(
      createMobileResponse(true, null, null, 'Password reset successfully')
    )
  } catch (error) {
    console.error('Mobile password reset error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred during password reset'),
      { status: 500 }
    )
  }
}
