# Production Environment Setup for onelp.capital

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/onelp_mvp"

# NextAuth Configuration - CRITICAL FOR LOGIN TO WORK
# For Vercel deployment: Use your Vercel app URL
# For custom domain: Use https://onelp.capital
NEXTAUTH_URL="https://your-vercel-app.vercel.app"  # or "https://onelp.capital"
NEXTAUTH_SECRET="your-super-secure-secret-key-here"

# Email Configuration (for password reset and invitations)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@onelp.capital"

# Security Configuration
JWT_SECRET="your-jwt-secret-key-here"
ENCRYPTION_KEY="your-encryption-key-here"

# Environment
NODE_ENV="production"
```

## Critical Configuration Notes

### 1. NEXTAUTH_URL
- **MUST** be set to `https://onelp.capital` for production
- This is essential for cookie domain configuration and authentication to work properly
- Without this, login will fail silently

### 2. NEXTAUTH_SECRET
- Generate a secure secret: `openssl rand -base64 32`
- This must be the same across all instances of your application
- Used for JWT token signing and encryption

### 3. Cookie Domain
- The application is now configured to use `.onelp.capital` as the cookie domain
- This allows cookies to work across all subdomains of onelp.capital
- Cookies will be secure and httpOnly in production

## Deployment Checklist

1. ✅ Set NEXTAUTH_URL to https://onelp.capital
2. ✅ Generate and set NEXTAUTH_SECRET
3. ✅ Configure database connection
4. ✅ Set up email SMTP credentials
5. ✅ Ensure HTTPS is enabled
6. ✅ Test login functionality

## Troubleshooting Login Issues

If login still doesn't work after setting up the environment:

1. Check browser developer tools console for errors
2. Verify cookies are being set with domain `.onelp.capital`
3. Ensure HTTPS is properly configured
4. Check that NEXTAUTH_URL matches your actual domain exactly
5. Verify database connection is working
6. Check server logs for authentication errors

## Security Notes

- All cookies are configured with secure flags in production
- CSRF protection is enabled
- Rate limiting is implemented for login attempts
- MFA is available for enhanced security
