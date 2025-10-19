import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, generateAccessToken, generateRefreshToken, createMobileResponse, MobileUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Refresh token required', 'Refresh token is required'),
        { status: 400 }
      )
    }

    const payload = verifyToken(refreshToken)
    if (!payload || payload.type !== 'refresh') {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invalid refresh token', 'Invalid or expired refresh token'),
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json(
        createMobileResponse(false, null, 'User not found', 'User not found'),
        { status: 404 }
      )
    }

    const mobileUser: MobileUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }

    const newAccessToken = generateAccessToken(mobileUser)
    const newRefreshToken = generateRefreshToken(mobileUser)

    return NextResponse.json(
      createMobileResponse(true, {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 30 * 24 * 60 * 60 // 30 days in seconds
      }, null, 'Token refreshed successfully')
    )
  } catch (error) {
    console.error('Mobile token refresh error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred during token refresh'),
      { status: 500 }
    )
  }
}
