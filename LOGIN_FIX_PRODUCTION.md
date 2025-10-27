# Login Fix for Production (onelp.capital)

## Problem
Login works on Vercel URL but fails on custom domain `onelp.capital` with "CredentialsSignin" error.

## Root Cause
Cookie domain configuration was conditional and may not be setting correctly for the custom domain.

## Solution Applied

Updated `/src/lib/auth.ts` to:
1. Always use secure cookies in production
2. Set cookie domain to `.onelp.capital` for production (allows subdomains)

## Changes Made

```typescript
// BEFORE (line 220)
useSecureCookies: process.env.NODE_ENV === 'production',

// AFTER
useSecureCookies: true, // Always use secure cookies

// BEFORE (line 228)
secure: process.env.NODE_ENV === 'production',

// AFTER  
secure: true, // Always use secure cookies in production

// BEFORE (line 230)
domain: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.includes('onelp.capital') ? '.onelp.capital' : undefined,

// AFTER
domain: process.env.NODE_ENV === 'production' ? '.onelp.capital' : undefined,
```

## Deployment Steps

1. **Commit and push the changes**:
```bash
git add src/lib/auth.ts
git commit -m "Fix cookie configuration for production custom domain"
git push
```

2. **Verify environment variables on Vercel**:
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Ensure these are set:
     ```
     NEXTAUTH_URL=https://onelp.capital
     NEXTAUTH_SECRET=your-secret-key
     NODE_ENV=production
     ```

3. **Redeploy on Vercel** (should happen automatically on push)

## Testing

After deployment:
1. Clear browser cookies for `onelp.capital`
2. Visit `https://onelp.capital/login`
3. Try logging in with admin credentials
4. Should redirect to dashboard without "CredentialsSignin" error

## How This Fix Works

- **Secure cookies**: Ensures cookies are only sent over HTTPS
- **Domain `.onelp.capital`**: Allows cookies to be shared across:
  - `onelp.capital` (main site)
  - `admin.onelp.capital` (admin app)
  - Any other subdomains
- **HTTPS only**: Prevents cookie issues with mixed HTTP/HTTPS

## If Still Not Working

Check Vercel environment variables:
```bash
# In Vercel dashboard, check that these exist:
NEXTAUTH_URL=https://onelp.capital
NEXTAUTH_SECRET=... (should be set)
NODE_ENV=production
```

Check browser console for cookie errors (F12 → Console tab)

