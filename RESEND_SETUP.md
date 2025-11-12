# Resend Email Setup for Vercel

This guide will help you set up Resend (Vercel's recommended email service) for password reset functionality.

## Why Resend?

- ✅ Built for serverless/Vercel deployments
- ✅ Easy integration with Next.js
- ✅ Free tier: 3,000 emails/month, 100 emails/day
- ✅ Excellent deliverability
- ✅ Simple API

## Setup Steps

### 1. Install Resend Package

```bash
npm install resend
```

### 2. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 3. Get Your API Key

1. In the Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "OneLP Production")
4. Copy the API key (you'll only see it once!)

### 4. Add Domain (Optional but Recommended)

For production, you should add your own domain:

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Add your domain (e.g., `onelp.com`)
4. Add the DNS records Resend provides to your domain's DNS settings
5. Wait for verification (usually takes a few minutes)

### 5. Configure Environment Variables

#### For Local Development (.env.local)

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
# Or use Resend's default domain for testing:
# RESEND_FROM_EMAIL=onboarding@resend.dev

# Custom domain for email links (optional but recommended)
APP_URL=https://onelp.capital
# Or for local development:
# APP_URL=http://localhost:3000
```

#### For Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key
   - **Environment**: Production, Preview, Development (select all)

   - **Name**: `RESEND_FROM_EMAIL`
   - **Value**: `noreply@yourdomain.com` (or `onboarding@resend.dev` for testing)
   - **Environment**: Production, Preview, Development (select all)

   - **Name**: `APP_URL` ⭐ **IMPORTANT**
   - **Value**: `https://onelp.capital` (or your custom domain)
   - **Environment**: Production, Preview, Development (select all)
   - **Note**: This ensures password reset and invitation links use your custom domain instead of the Vercel URL

4. Click **Save**

### 6. Deploy to Vercel

After adding the environment variables, redeploy your application:

```bash
git add .
git commit -m "Add Resend email support"
git push
```

Vercel will automatically redeploy with the new environment variables.

## How It Works

The email service now supports both Resend and SMTP:

1. **Resend** (preferred): Used if `RESEND_API_KEY` is set
2. **SMTP** (fallback): Used if Resend is not configured but SMTP credentials are provided

This means:
- ✅ Works seamlessly on Vercel with Resend
- ✅ Still works with SMTP for other deployments
- ✅ Automatic fallback if one service isn't configured

## Testing

### Test Password Reset

1. Go to your app's login page
2. Click "Forgot Password" or go to Settings → Security
3. Request a password reset
4. Check your email inbox (and spam folder)
5. Click the reset link
6. Set a new password

### Check Resend Dashboard

1. Go to [resend.com/dashboard](https://resend.com/dashboard)
2. Navigate to **Logs** to see sent emails
3. Check delivery status and any errors

## Troubleshooting

### Emails not sending?

1. **Check environment variables**: Make sure `RESEND_API_KEY` is set in Vercel
2. **Check Resend dashboard**: Look for errors in the Logs section
3. **Verify domain**: If using a custom domain, ensure DNS records are correct
4. **Check rate limits**: Free tier has limits (100 emails/day)

### Using Resend's default domain?

If you haven't added your own domain, you can use `onboarding@resend.dev` for testing. Note that this domain has limitations and should only be used for development.

### Still using SMTP?

The code will automatically fall back to SMTP if Resend is not configured. To use SMTP instead, just don't set `RESEND_API_KEY` and configure your SMTP variables instead.

## Cost

- **Free Tier**: 3,000 emails/month, 100 emails/day
- **Pro Tier**: $20/month for 50,000 emails
- **Enterprise**: Custom pricing

For most applications, the free tier is sufficient for password resets and transactional emails.

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Next.js Guide](https://resend.com/docs/send-with-nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

