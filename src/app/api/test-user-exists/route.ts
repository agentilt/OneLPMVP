import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing if user exists in database...')
    
    const email = 'demo@onelp.capital'
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        mfaSettings: true
      }
    })
    
    console.log('User lookup result:', user ? 'found' : 'not found')
    
    if (user) {
      console.log('User details:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
        lockedUntil: user.lockedUntil,
        loginAttempts: user.loginAttempts
      })
    }
    
    return NextResponse.json({
      status: 'OK',
      userExists: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
        lockedUntil: user.lockedUntil,
        loginAttempts: user.loginAttempts
      } : null
    })
  } catch (error) {
    console.error('User exists test error:', error)
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
