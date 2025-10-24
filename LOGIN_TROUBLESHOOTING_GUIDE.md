# Login Troubleshooting Guide for onelp.capital

## Issue: Login Button Does Nothing When Accessed via onelp.capital

### Root Cause Analysis

The login functionality fails when accessing the site through onelp.capital due to several configuration issues:

1. **Cookie Domain Mismatch**: Cookies were configured to use a dynamic domain based on `NEXTAUTH_URL` environment variable
2. **Missing Environment Configuration**: `NEXTAUTH_URL` not properly set for production domain
3. **Next.js Configuration**: Hardcoded redirect URLs pointing to wrong domain
4. **Silent Failures**: No proper error logging to identify the issue

### Fixes Applied

#### 1. Fixed Cookie Domain Configuration
- **File**: `src/lib/auth.ts`
- **Change**: Set cookie domain to `.onelp.capital` for production
- **Impact**: Cookies now work across all subdomains of onelp.capital

#### 2. Updated Next.js Configuration
- **File**: `next.config.js`
- **Changes**:
  - Updated redirect URL from `https://yourdomain.com` to `https://onelp.capital`
  - Added `onelp.capital` to allowed image domains

#### 3. Added Debug Logging
- **Files**: `src/app/login/page.tsx`, `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- **Changes**: Added comprehensive console logging to identify where login fails

#### 4. Enhanced Error Handling
- **File**: `src/app/api/auth/[...nextauth]/route.ts`
- **Change**: Added try-catch blocks with detailed error logging

### Required Environment Variables

Create a `.env.local` file with:

```bash
NEXTAUTH_URL="https://onelp.capital"
NEXTAUTH_SECRET="your-secure-secret-here"
NODE_ENV="production"
```

### Testing Steps

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Attempt login
   - Look for error messages or debug logs

2. **Verify Environment Variables**
   - Ensure `NEXTAUTH_URL` is set to `https://onelp.capital`
   - Verify `NEXTAUTH_SECRET` is properly configured

3. **Check Network Tab**
   - Open Developer Tools → Network tab
   - Attempt login
   - Look for failed requests to `/api/auth/signin` or `/api/auth/callback`

4. **Verify Cookies**
   - Check Application tab → Cookies
   - Look for `next-auth.session-token` cookie
   - Verify domain is set to `.onelp.capital`

### Common Issues and Solutions

#### Issue: "Unable to sign in. Please try again."
- **Cause**: NextAuth configuration error or missing environment variables
- **Solution**: Check server logs and verify `NEXTAUTH_URL` and `NEXTAUTH_SECRET`

#### Issue: Login appears to work but user stays on login page
- **Cause**: Cookie domain mismatch or session not being created
- **Solution**: Verify cookie domain configuration and check browser cookie settings

#### Issue: CORS errors in console
- **Cause**: Cross-origin request blocked
- **Solution**: Ensure the domain is properly configured in Next.js and middleware

#### Issue: "Invalid email or password" for valid credentials
- **Cause**: Database connection issues or user not found
- **Solution**: Check database connection and verify user exists

### Debugging Commands

```bash
# Check if environment variables are loaded
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET

# Check server logs
npm run dev  # Look for NextAuth debug messages

# Test database connection
npm run db:studio
```

### Production Deployment Checklist

- [ ] Set `NEXTAUTH_URL=https://onelp.capital`
- [ ] Generate and set secure `NEXTAUTH_SECRET`
- [ ] Verify HTTPS is properly configured
- [ ] Test login functionality
- [ ] Check browser console for errors
- [ ] Verify cookies are being set correctly
- [ ] Test with different browsers

### Rollback Plan

If issues persist, you can temporarily revert to development mode:

1. Set `NODE_ENV=development` in environment
2. Remove domain-specific cookie configuration
3. Use localhost for testing

### Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Cookie Security Best Practices](https://owasp.org/www-community/controls/SecureCookieAttribute)
