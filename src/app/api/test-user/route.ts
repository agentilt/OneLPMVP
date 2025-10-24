import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function GET(request: NextRequest) {
  try {
    const email = 'demo@onelp.capital'
    const password = 'demo123'
    
    console.log('Testing user lookup for:', email)
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        mfaSettings: true
      }
    })
    
    if (!user) {
      return NextResponse.json({
        status: 'ERROR',
        message: 'User not found',
        email
      })
    }
    
    console.log('User found:', { id: user.id, email: user.email, role: user.role, mfaEnabled: user.mfaEnabled })
    
    // Test password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('Password valid:', isPasswordValid)
    
    return NextResponse.json({
      status: 'OK',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
        mfaSettings: user.mfaSettings
      },
      passwordValid: isPasswordValid
    })
  } catch (error) {
    console.error('Test user error:', error)
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
