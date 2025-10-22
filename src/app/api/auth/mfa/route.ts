import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { createMFARecord, verifyMFAToken, markMFATokenAsUsed, generateMFAToken, isTokenRateLimited, recordTokenAttempt } from '@/lib/token-security'
import { rateLimit, detectSuspiciousActivity, createSecurityResponse, addSecurityHeaders } from '@/lib/security-middleware'
import crypto from 'crypto'

// Enable MFA for user
export async function POST(request: NextRequest) {
  // Security checks
  if (detectSuspiciousActivity(request)) {
    return createSecurityResponse('Suspicious activity detected')
  }

  const rateLimitResponse = rateLimit({ windowMs: 5 * 60 * 1000, maxRequests: 3, message: 'Too many MFA requests' })(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if MFA is already enabled
    const existingMFASettings = await prisma.mFASettings.findUnique({
      where: { userId }
    })

    if (existingMFASettings?.enabled) {
      return NextResponse.json(
        { error: 'MFA is already enabled for this user' },
        { status: 400 }
      )
    }

    // Generate MFA secret
    const secret = crypto.randomBytes(20).toString('base32')
    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase())

    // Create or update MFA settings
    await prisma.mFASettings.upsert({
      where: { userId },
      create: {
        userId,
        secret,
        backupCodes,
        enabled: false // Will be enabled after verification
      },
      update: {
        secret,
        backupCodes,
        enabled: false
      }
    })

    // Generate QR code URL for authenticator app
    const appName = 'OneLP MVP'
    const qrCodeUrl = `otpauth://totp/${appName}:${user.email}?secret=${secret}&issuer=${appName}`

    const response = NextResponse.json({
      secret,
      qrCodeUrl,
      backupCodes,
      message: 'MFA setup initiated. Please scan the QR code with your authenticator app.'
    })

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('MFA setup error:', error)
    return NextResponse.json(
      { error: 'An error occurred while setting up MFA' },
      { status: 500 }
    )
  }
}

// Verify MFA setup
export async function PUT(request: NextRequest) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'User ID and token are required' },
        { status: 400 }
      )
    }

    // Check rate limiting
    if (isTokenRateLimited(`mfa-setup-${userId}`)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Get MFA settings
    const mFASettings = await prisma.mFASettings.findUnique({
      where: { userId }
    })

    if (!mFASettings || !mFASettings.secret) {
      return NextResponse.json(
        { error: 'MFA not properly configured' },
        { status: 400 }
      )
    }

    // Verify TOTP token
    const isValid = verifyTOTPToken(token, mFASettings.secret)
    
    if (!isValid) {
      recordTokenAttempt(`mfa-setup-${userId}`, false)
      return NextResponse.json(
        { error: 'Invalid MFA token' },
        { status: 400 }
      )
    }

    // Enable MFA
    await prisma.mFASettings.update({
      where: { userId },
      data: {
        enabled: true,
        lastUsed: new Date()
      }
    })

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true
      }
    })

    recordTokenAttempt(`mfa-setup-${userId}`, true)

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'MFA_ENABLED',
        description: 'Multi-factor authentication enabled',
        severity: 'INFO'
      }
    })

    const response = NextResponse.json({
      message: 'MFA has been successfully enabled'
    })

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('MFA verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred while verifying MFA' },
      { status: 500 }
    )
  }
}

// Disable MFA
export async function DELETE(request: NextRequest) {
  try {
    const { userId, password } = await request.json()

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'User ID and password are required' },
        { status: 400 }
      )
    }

    // Verify user password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const bcrypt = require('bcrypt')
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      )
    }

    // Disable MFA
    await prisma.mFASettings.update({
      where: { userId },
      data: {
        enabled: false,
        secret: null,
        backupCodes: []
      }
    })

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false
      }
    })

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'MFA_DISABLED',
        description: 'Multi-factor authentication disabled',
        severity: 'WARNING'
      }
    })

    const response = NextResponse.json({
      message: 'MFA has been successfully disabled'
    })

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('MFA disable error:', error)
    return NextResponse.json(
      { error: 'An error occurred while disabling MFA' },
      { status: 500 }
    )
  }
}

// Verify TOTP token
function verifyTOTPToken(token: string, secret: string): boolean {
  const crypto = require('crypto')
  
  // Convert secret from base32 to buffer
  const secretBuffer = Buffer.from(secret, 'base32')
  
  // Get current time step
  const timeStep = Math.floor(Date.now() / 1000 / 30)
  
  // Check current and previous time steps (allow 30-second window)
  for (let i = -1; i <= 1; i++) {
    const time = timeStep + i
    const expectedToken = generateTOTP(secretBuffer, time)
    
    if (expectedToken === token) {
      return true
    }
  }
  
  return false
}

// Generate TOTP
function generateTOTP(secret: Buffer, time: number): string {
  const crypto = require('crypto')
  
  // Create time buffer
  const timeBuffer = Buffer.alloc(8)
  timeBuffer.writeUInt32BE(Math.floor(time / 0x100000000), 0)
  timeBuffer.writeUInt32BE(time & 0xffffffff, 4)
  
  // Generate HMAC
  const hmac = crypto.createHmac('sha1', secret)
  hmac.update(timeBuffer)
  const hash = hmac.digest()
  
  // Extract dynamic binary code
  const offset = hash[hash.length - 1] & 0xf
  const code = ((hash[offset] & 0x7f) << 24) |
               ((hash[offset + 1] & 0xff) << 16) |
               ((hash[offset + 2] & 0xff) << 8) |
               (hash[offset + 3] & 0xff)
  
  // Convert to 6-digit string
  return (code % 1000000).toString().padStart(6, '0')
}
