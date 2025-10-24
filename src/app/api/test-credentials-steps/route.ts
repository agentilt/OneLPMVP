import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    console.log('Testing credentials provider step by step...')
    
    const body = await request.json()
    const { email, password } = body
    
    console.log('Test credentials:', { email, password })
    
    // Step 1: Check if credentials are provided
    if (!email || !password) {
      console.log('Step 1: Missing credentials')
      return NextResponse.json({
        status: 'ERROR',
        step: 1,
        message: 'Missing credentials'
      })
    }
    
    console.log('Step 1: Credentials provided ✓')
    
    // Step 2: Check if user exists
    console.log('Step 2: Looking up user in database...')
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        mfaSettings: true
      }
    })
    
    if (!user) {
      console.log('Step 2: User not found')
      return NextResponse.json({
        status: 'ERROR',
        step: 2,
        message: 'User not found'
      })
    }
    
    console.log('Step 2: User found ✓', { id: user.id, email: user.email, role: user.role })
    
    // Step 3: Check if user is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      console.log('Step 3: User is locked')
      return NextResponse.json({
        status: 'ERROR',
        step: 3,
        message: 'User is locked'
      })
    }
    
    console.log('Step 3: User not locked ✓')
    
    // Step 4: Check password
    console.log('Step 4: Checking password...')
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      console.log('Step 4: Invalid password')
      return NextResponse.json({
        status: 'ERROR',
        step: 4,
        message: 'Invalid password'
      })
    }
    
    console.log('Step 4: Password valid ✓')
    
    // Step 5: Check MFA
    const isDemoUser = user.email === 'demo@onelp.capital'
    console.log('Step 5: MFA check', { isDemoUser, mfaEnabled: user.mfaEnabled })
    
    if (user.mfaEnabled && user.mfaSettings?.enabled && !isDemoUser) {
      console.log('Step 5: MFA required')
      return NextResponse.json({
        status: 'ERROR',
        step: 5,
        message: 'MFA required'
      })
    }
    
    console.log('Step 5: MFA check passed ✓')
    
    // Step 6: Return user
    const result = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mfaRequired: false,
      mfaEnabled: user.mfaEnabled
    }
    
    console.log('Step 6: Returning user ✓', result)
    
    return NextResponse.json({
      status: 'OK',
      result: result,
      steps: {
        credentialsProvided: true,
        userFound: true,
        userNotLocked: true,
        passwordValid: true,
        mfaCheckPassed: true,
        userReturned: true
      }
    })
  } catch (error) {
    console.error('Credentials step test error:', error)
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
