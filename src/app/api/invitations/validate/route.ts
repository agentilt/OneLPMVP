import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    })

    if (!invitation) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid invitation token',
      })
    }

    if (invitation.usedAt) {
      return NextResponse.json({
        valid: false,
        error: 'This invitation has already been used',
      })
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'This invitation has expired',
      })
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}

