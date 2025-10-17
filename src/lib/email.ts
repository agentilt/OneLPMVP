import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendInvitationEmail(
  email: string,
  token: string,
  inviterName: string
) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/register?token=${token}`

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'You\'re invited to join EuroLP',
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
              <div class="logo">EuroLP</div>
              <p>Limited Partner Portal</p>
            </div>
            
            <div class="content">
              <h2>You've been invited!</h2>
              <p>Hello,</p>
              <p>${inviterName} has invited you to join the EuroLP Limited Partner portal. Click the button below to create your account:</p>
              
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p class="link">${inviteUrl}</p>
              
              <p><strong>This invitation will expire in 48 hours.</strong></p>
            </div>
            
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>© ${new Date().getFullYear()} EuroLP. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
You've been invited to join EuroLP!

${inviterName} has invited you to join the EuroLP Limited Partner portal.

Accept your invitation by visiting: ${inviteUrl}

This invitation will expire in 48 hours.

If you didn't expect this invitation, you can safely ignore this email.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if text not provided
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

