import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createMFARecord, verifyMFAToken, markMFATokenAsUsed, isTokenRateLimited, recordTokenAttempt } from '@/lib/token-security'
import { rateLimit, detectSuspiciousActivity, createSecurityResponse, addSecurityHeaders } from '@/lib/security-middleware'
import crypto from 'crypto'

// Verify MFA token during login
export async function POST(request: NextRequest) {
  // Security checks
  if (detectSuspiciousActivity(request)) {
    return createSecurityResponse('Suspicious activity detected')
  }

  const rateLimitResponse = rateLimit({ windowMs: 5 * 60 * 1000, maxRequests: 5, message: 'Too many MFA verification attempts' })(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { userId, token, isBackupCode } = await request.json()

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'User ID and token are required' },
        { status: 400 }
      )
    }

    // Check rate limiting
    if (isTokenRateLimited(`mfa-verify-${userId}`)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Get user and MFA settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mfaSettings: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.mfaEnabled || !user.mfaSettings?.enabled) {
      return NextResponse.json(
        { error: 'MFA is not enabled for this user' },
        { status: 400 }
      )
    }

    let isValid = false

    if (isBackupCode) {
      // Verify backup code
      isValid = user.mfaSettings.backupCodes.includes(token.toUpperCase())
      
      if (isValid) {
        // Remove used backup code
        const updatedBackupCodes = user.mfaSettings.backupCodes.filter(code => code !== token.toUpperCase())
        await prisma.mfaSettings.update({
          where: { userId },
          data: {
            backupCodes: updatedBackupCodes
          }
        })
      }
    } else {
      // Verify TOTP token
      isValid = verifyTOTPToken(token, user.mfaSettings.secret!)
    }

    if (!isValid) {
      recordTokenAttempt(`mfa-verify-${userId}`, false)
      
      // Log failed attempt
      await prisma.securityEvent.create({
        data: {
          userId,
          eventType: 'MFA_VERIFICATION_FAILED',
          description: 'Failed MFA verification attempt',
          severity: 'WARNING'
        }
      })

      return NextResponse.json(
        { error: 'Invalid MFA token' },
        { status: 400 }
      )
    }

    // Update last used time
    await prisma.mfaSettings.update({
      where: { userId },
      data: {
        lastUsed: new Date()
      }
    })

    recordTokenAttempt(`mfa-verify-${userId}`, true)

    // Log successful verification
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'MFA_VERIFICATION_SUCCESS',
        description: 'Successful MFA verification',
        severity: 'INFO'
      }
    })

    const response = NextResponse.json({
      success: true,
      message: 'MFA verification successful'
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

// Send MFA token via email (fallback)
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check rate limiting
    if (isTokenRateLimited(`mfa-email-${userId}`)) {
      return NextResponse.json(
        { error: 'Too many email requests. Please try again later.' },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFA is not enabled for this user' },
        { status: 400 }
      )
    }

    // Generate email MFA token
    const emailToken = generateMFAToken()
    await createMFARecord(userId, emailToken)

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Your MFA Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Multi-Factor Authentication Code</h2>
          <p>Your MFA code is:</p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
            ${emailToken}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `
    })

    const response = NextResponse.json({
      message: 'MFA code sent to your email'
    })

    return addSecurityHeaders(response)
  } catch (error) {
    console.error('MFA email error:', error)
    return NextResponse.json(
      { error: 'An error occurred while sending MFA code' },
      { status: 500 }
    )
  }
}

// Verify TOTP token
function verifyTOTPToken(token: string, secret: string): boolean {
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
