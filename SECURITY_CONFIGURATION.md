# Security Configuration Guide

This document outlines the security hardening measures implemented in the OneLP MVP application.

## Authentication Security

### Password Policy
- **Minimum Length**: 12 characters
- **Maximum Length**: 128 characters
- **Character Requirements**:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Pattern Restrictions**:
  - No more than 2 consecutive identical characters
  - No sequential numbers (123, 234, etc.)
  - No sequential letters (abc, bcd, etc.)
  - No common weak patterns (qwerty, password, admin, etc.)
- **Common Password Detection**: Rejects commonly used passwords

### Session Security
- **Session Duration**: 8 hours (reduced from 30 days)
- **Session Update**: Every 2 hours
- **JWT Duration**: 8 hours
- **Mobile Access Token**: 1 hour
- **Mobile Refresh Token**: 7 days
- **Secure Cookies**: Enabled in production
- **HttpOnly**: All authentication cookies
- **SameSite**: Lax for session cookies
- **CSRF Protection**: Built-in with NextAuth

### Rate Limiting
- **Login Attempts**: Maximum 5 attempts per email
- **Lockout Duration**: 15 minutes after failed attempts
- **Automatic Reset**: After successful login

## HTTPS Enforcement

### Production HTTPS
- **Automatic Redirect**: HTTP to HTTPS in production
- **HSTS Headers**: Strict-Transport-Security with 1-year max-age
- **Include Subdomains**: Enabled
- **Preload**: Enabled for HSTS

### Security Headers
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **X-XSS-Protection**: 1; mode=block (XSS protection)
- **Referrer-Policy**: origin-when-cross-origin
- **Permissions-Policy**: Restricts camera, microphone, geolocation
- **Content-Security-Policy**: Comprehensive CSP rules

## Environment Variables

### Required Security Variables
```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secure-secret-key-here
NEXTAUTH_URL=https://yourdomain.com

# Database
DATABASE_URL=your-database-connection-string

# Email Configuration (for password reset)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

### Security Recommendations
1. **NEXTAUTH_SECRET**: Use a cryptographically secure random string (minimum 32 characters)
2. **NEXTAUTH_URL**: Must match your production domain exactly
3. **Database**: Use encrypted connections (SSL/TLS)
4. **SMTP**: Use TLS/SSL for email authentication

## Deployment Security

### Production Checklist
- [ ] HTTPS certificate installed and working
- [ ] All environment variables set correctly
- [ ] Database connections use SSL
- [ ] Security headers are being applied
- [ ] Rate limiting is active
- [ ] Password policy is enforced
- [ ] Session timeouts are working
- [ ] Error messages don't leak sensitive information

### Monitoring
- Monitor failed login attempts
- Log security events
- Set up alerts for suspicious activity
- Regular security audits

## API Security

### Mobile API
- JWT tokens with proper validation
- Audience and issuer verification
- Algorithm specification (HS256)
- Short-lived access tokens (1 hour)
- Secure refresh token rotation

### Web API
- CSRF protection via NextAuth
- Input validation and sanitization
- Rate limiting on authentication endpoints
- Secure password hashing (bcrypt with 12 rounds)

## Additional Security Measures

### Password Hashing
- **Algorithm**: bcrypt
- **Salt Rounds**: 12 (increased from default 10)
- **Cost Factor**: 4096 iterations

### Cookie Security
- **Secure Flag**: Enabled in production
- **HttpOnly**: All authentication cookies
- **SameSite**: Lax for session cookies, Strict for CSRF
- **Domain**: Set to production domain
- **Path**: Root path for session cookies

### Content Security Policy
```
default-src 'self'
script-src 'self' 'unsafe-eval' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob:
font-src 'self'
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
upgrade-insecure-requests
```

## Security Testing

### Manual Testing
1. Test password policy enforcement
2. Verify HTTPS redirects work
3. Check security headers are present
4. Test rate limiting functionality
5. Verify session timeouts
6. Test CSRF protection

### Automated Testing
- Consider implementing security tests in your test suite
- Use tools like OWASP ZAP for vulnerability scanning
- Regular dependency updates and security patches

## Incident Response

### Security Breach Response
1. Immediately rotate all secrets and tokens
2. Force password resets for all users
3. Review access logs for suspicious activity
4. Update security measures based on findings
5. Notify users if necessary

### Regular Maintenance
- Monthly security updates
- Quarterly security reviews
- Annual penetration testing
- Regular backup verification
