import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

// POST: Request account deletion
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { confirmationText, password } = body

    // Verify the user typed "DELETE" to confirm
    if (confirmationText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Please type DELETE to confirm account deletion' },
        { status: 400 }
      )
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        funds: true,
        directInvestments: true,
        fundAccess: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify password
    const bcrypt = require('bcrypt')
    const passwordValid = await bcrypt.compare(password, user.password)
    
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Generate deletion token for final confirmation
    const deletionToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(deletionToken).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store deletion request
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: tokenHash,
        resetTokenExpiry: expiresAt
      }
    })

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'ACCOUNT_DELETION_REQUESTED',
        description: 'User requested account deletion',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'WARNING'
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        resource: 'USER',
        resourceId: user.id,
        description: 'Account deletion requested',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Send confirmation email with deletion link
    const deletionUrl = `${process.env.NEXTAUTH_URL}/settings/delete-account/confirm?token=${deletionToken}`
    
    await sendEmail({
      to: user.email,
      subject: 'Confirm Account Deletion - OneLP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Account Deletion Request</h2>
          <p>You have requested to delete your OneLP account.</p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
            <h3 style="color: #991b1b; margin-top: 0;">⚠️ Warning: This action is permanent</h3>
            <p style="margin: 0;">Once confirmed, the following data will be permanently deleted:</p>
            <ul style="color: #991b1b; margin: 10px 0;">
              <li>Your account and profile information</li>
              <li>Access to ${user.funds.length + user.fundAccess.length} fund(s)</li>
              <li>Access to ${user.directInvestments.length} direct investment(s)</li>
              <li>All personal preferences and settings</li>
            </ul>
            <p style="color: #991b1b; margin: 10px 0 0 0;">
              <strong>Audit logs will be anonymized but retained for compliance purposes.</strong>
            </p>
          </div>

          <p><strong>To confirm deletion, click the button below:</strong></p>
          
          <a href="${deletionUrl}" 
             style="display: inline-block; background-color: #dc2626; color: white; 
                    padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                    font-weight: bold; margin: 20px 0;">
            Confirm Account Deletion
          </a>
          
          <p style="color: #6b7280; font-size: 14px;">
            This link will expire in 24 hours. If you did not request this deletion, 
            please ignore this email and change your password immediately.
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this URL into your browser:<br>
            <span style="word-break: break-all;">${deletionUrl}</span>
          </p>
        </div>
      `
    })

    return NextResponse.json({ 
      success: true,
      message: 'Account deletion confirmation email sent. Please check your email to complete the deletion.',
      expiresAt: expiresAt.toISOString()
    })

  } catch (error) {
    console.error('Account deletion request error:', error)
    return NextResponse.json(
      { error: 'Failed to process account deletion request' },
      { status: 500 }
    )
  }
}

// DELETE: Actually delete the account (called after email confirmation)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Deletion token required' },
        { status: 400 }
      )
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        resetToken: tokenHash,
        resetTokenExpiry: {
          gt: new Date() // Token not expired
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired deletion token' },
        { status: 400 }
      )
    }

    const deletedEmail = user.email
    const userId = user.id

    // Perform deletion in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Anonymize audit logs (retain for compliance but remove PII)
      await tx.auditLog.updateMany({
        where: { userId },
        data: {
          ipAddress: 'REDACTED',
          userAgent: 'REDACTED',
          metadata: { anonymized: true, deletionDate: new Date().toISOString() }
        }
      })

      // 2. Anonymize security events
      await tx.securityEvent.updateMany({
        where: { userId },
        data: {
          ipAddress: 'REDACTED',
          userAgent: 'REDACTED',
          metadata: { anonymized: true, deletionDate: new Date().toISOString() }
        }
      })

      // 3. Delete activity events
      await tx.activityEvent.deleteMany({
        where: { userId }
      })

      // 4. Delete user sessions
      await tx.userSession.deleteMany({
        where: { userId }
      })

      // 5. Delete MFA settings
      await tx.mFASettings.deleteMany({
        where: { userId }
      })

      // 6. Delete MFA tokens
      await tx.mFAToken.deleteMany({
        where: { userId }
      })

      // 7. Delete password reset tokens
      await tx.passwordReset.deleteMany({
        where: { userId }
      })

      // 8. Delete invitations sent by user
      await tx.invitation.deleteMany({
        where: { invitedBy: userId }
      })

      // 9. Delete fund access records
      await tx.fundAccess.deleteMany({
        where: { userId }
      })

      // 10. Handle funds owned by user
      // Option A: Delete funds if user is sole owner
      // Option B: Transfer to admin or mark as orphaned
      // For now, we'll delete them
      const userFunds = await tx.fund.findMany({
        where: { userId }
      })

      for (const fund of userFunds) {
        // Delete related records first
        await tx.navHistory.deleteMany({
          where: { fundId: fund.id }
        })
        await tx.document.deleteMany({
          where: { fundId: fund.id }
        })
        await tx.fundAccess.deleteMany({
          where: { fundId: fund.id }
        })
      }

      await tx.fund.deleteMany({
        where: { userId }
      })

      // 11. Handle direct investments
      const userInvestments = await tx.directInvestment.findMany({
        where: { userId }
      })

      for (const investment of userInvestments) {
        await tx.directInvestmentDocument.deleteMany({
          where: { directInvestmentId: investment.id }
        })
      }

      await tx.directInvestment.deleteMany({
        where: { userId }
      })

      // 12. Finally, delete the user account
      await tx.user.delete({
        where: { id: userId }
      })
    })

    // Send final confirmation email
    await sendEmail({
      to: deletedEmail,
      subject: 'Account Deleted - OneLP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Account Successfully Deleted</h2>
          <p>Your OneLP account has been permanently deleted.</p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0;">
            <h3 style="color: #065f46; margin-top: 0;">What was deleted:</h3>
            <ul style="color: #065f46;">
              <li>Your account and profile information</li>
              <li>All personal data and preferences</li>
              <li>Fund access and investment data</li>
              <li>Active sessions and authentication tokens</li>
            </ul>
            <p style="color: #065f46; margin: 10px 0 0 0;">
              <strong>Note:</strong> Anonymized audit logs have been retained for legal and compliance purposes as required by law.
            </p>
          </div>

          <p>Thank you for using OneLP. If you change your mind in the future, you're welcome to create a new account.</p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you did not request this deletion, please contact us immediately at info@onelp.capital
          </p>
        </div>
      `
    })

    return NextResponse.json({ 
      success: true,
      message: 'Account successfully deleted'
    })

  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}

