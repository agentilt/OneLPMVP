import { NextRequest, NextResponse } from 'next/server'
import { signIn } from 'next-auth/react'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('Test login attempt:', { email, password: password ? '***' : 'empty' })
    
    // Test basic validation
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }
    
    // Test database connection
    let dbStatus = 'Unknown'
    try {
      const { prisma } = await import('@/lib/db')
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, role: true, mfaEnabled: true }
      })
      
      if (user) {
        dbStatus = 'User found'
        return NextResponse.json({
          success: true,
          message: 'User exists in database',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            mfaEnabled: user.mfaEnabled
          }
        })
      } else {
        dbStatus = 'User not found'
        return NextResponse.json({
          success: false,
          error: 'User not found in database'
        }, { status: 404 })
      }
    } catch (error) {
      dbStatus = `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: dbStatus
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Test login error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test login failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
