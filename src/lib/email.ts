import nodemailer from 'nodemailer'

// Check if Resend is configured (preferred for Vercel)
const isResendConfigured = !!process.env.RESEND_API_KEY

// Check if SMTP is configured (fallback)
const isSMTPConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASSWORD
)

// Lazy load Resend client
let resendClient: any = null
async function getResendClient() {
  if (!isResendConfigured) return null
  
  if (resendClient) return resendClient
  
  try {
    const { Resend } = await import('resend')
    resendClient = new Resend(process.env.RESEND_API_KEY)
    return resendClient
  } catch (error) {
    console.warn('⚠️  Resend package not installed. Run: npm install resend')
    return null
  }
}

// Only create transporter if SMTP is configured
const transporter = isSMTPConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : null

if (!isResendConfigured && !isSMTPConfigured && process.env.NODE_ENV !== 'test') {
  console.warn(
    '⚠️  Email service not configured. Email sending will be disabled.' +
    ' Set RESEND_API_KEY (recommended for Vercel) or SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables to enable emails.'
  )
}

export async function sendInvitationEmail(
  email: string,
  token: string,
  inviterName: string
) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/register?token=${token}`

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'You\'re invited to join OneLP',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              line-height: 1.6;
              color: #171717;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border: 1px solid #e5e5e5;
              border-radius: 8px;
              padding: 40px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #171717;
              margin-bottom: 10px;
            }
            .content {
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: #171717;
              color: #ffffff;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e5e5;
              font-size: 14px;
              color: #666;
            }
            .link {
              color: #171717;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">OneLP</div>
              <p>Limited Partner Portal</p>
            </div>
            
            <div class="content">
              <h2>You've been invited!</h2>
              <p>Hello,</p>
              <p>${inviterName} has invited you to join the OneLP Limited Partner portal. Click the button below to create your account:</p>
              
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p class="link">${inviteUrl}</p>
              
              <p><strong>This invitation will expire in 48 hours.</strong></p>
            </div>
            
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>© ${new Date().getFullYear()} OneLP. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
You've been invited to join OneLP!

${inviterName} has invited you to join the OneLP Limited Partner portal.

Accept your invitation by visiting: ${inviteUrl}

This invitation will expire in 48 hours.

If you didn't expect this invitation, you can safely ignore this email.
    `,
  }

  // Use the sendEmail function which handles both Resend and SMTP
  try {
    const result = await sendEmail({
      to: email,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
    })
    return result
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    // Don't throw - allow invitation to be created even if email fails
    return { success: false, error, skipped: true }
  }
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'onboarding@resend.dev'
  
  // Prefer Resend if configured (recommended for Vercel)
  if (isResendConfigured) {
    const client = await getResendClient()
    if (client) {
      try {
        const { data, error } = await client.emails.send({
          from: fromEmail,
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if text not provided
        })

        if (error) {
          console.error('Resend API error:', error)
          throw new Error(`Resend API error: ${error.message}`)
        }

        console.log(`✅ Email sent successfully via Resend to: ${to} (ID: ${data?.id})`)
        return { success: true, id: data?.id }
      } catch (error) {
        console.error('Failed to send email via Resend:', error)
        throw error
      }
    }
  }

  // Fallback to SMTP if Resend is not configured
  if (isSMTPConfigured && transporter) {
    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if text not provided
    }

    try {
      await transporter.sendMail(mailOptions)
      console.log(`✅ Email sent successfully via SMTP to: ${to}`)
      return { success: true }
    } catch (error) {
      console.error('Failed to send email via SMTP:', error)
      throw error
    }
  }

  // No email service configured
  const errorMsg = `Email service not configured. Please set RESEND_API_KEY (recommended for Vercel) or SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables.`
  console.error(`❌ ${errorMsg} Email would have been sent to: ${to} (Subject: ${subject})`)
  throw new Error(errorMsg)
}

