import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/db'
import { generateAccessToken, generateRefreshToken, createMobileResponse, MobileUser } from '@/lib/mobile-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Email and password are required', 'Missing credentials'),
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invalid credentials', 'Email or password is incorrect'),
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invalid credentials', 'Email or password is incorrect'),
        { status: 401 }
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

    const accessToken = generateAccessToken(mobileUser)
    const refreshToken = generateRefreshToken(mobileUser)

    return NextResponse.json(
      createMobileResponse(true, {
        user: mobileUser,
        token: accessToken,
        refreshToken: refreshToken,
        expiresIn: 30 * 24 * 60 * 60 // 30 days in seconds
      }, null, 'Login successful')
    )
  } catch (error) {
    console.error('Mobile login error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred during login'),
      { status: 500 }
    )
  }
}
