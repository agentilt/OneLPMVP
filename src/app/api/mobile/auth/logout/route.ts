import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createMobileResponse } from '@/lib/mobile-auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createMobileResponse(false, null, 'Authorization header required', 'Authorization header with Bearer token is required'),
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    if (!payload || payload.type !== 'access') {
      return NextResponse.json(
        createMobileResponse(false, null, 'Invalid token', 'Invalid or expired token'),
        { status: 401 }
      )
    }

    // For JWT tokens, we can't invalidate them server-side without a blacklist
    // In a production app, you might want to implement a token blacklist
    // For now, we'll just return success as the client should discard the token

    return NextResponse.json(
      createMobileResponse(true, null, null, 'Logout successful')
    )
  } catch (error) {
    console.error('Mobile logout error:', error)
    return NextResponse.json(
      createMobileResponse(false, null, 'Internal server error', 'An error occurred during logout'),
      { status: 500 }
    )
  }
}
