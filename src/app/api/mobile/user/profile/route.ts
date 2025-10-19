import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, createMobileResponse } from '@/lib/mobile-auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Authorization header required', 'Authorization header with Bearer token is required'),
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invalid token', 'Invalid or expired token'),
        { status: 401 }
      )
    }

    return NextResponse.json(
      createMobileResponse(true, { user }, null, 'Profile retrieved successfully')
    )
  } catch (error) {
    console.error('Mobile get profile error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred while retrieving profile'),
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Authorization header required', 'Authorization header with Bearer token is required'),
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invalid token', 'Invalid or expired token'),
        { status: 401 }
      )
    }

    const { firstName, lastName, name } = await request.json()

    if (!firstName || !lastName) {
      return NextResponse.json(
        createMobileResponse(false, null, 'First name and last name are required', 'First name and last name are required'),
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/db')
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        name: name || `${firstName} ${lastName}`
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    })

    return NextResponse.json(
      createMobileResponse(true, { user: updatedUser }, null, 'Profile updated successfully')
    )
  } catch (error) {
    console.error('Mobile update profile error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred while updating profile'),
      { status: 500 }
    )
  }
}
