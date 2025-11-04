import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Security headers configuration
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'off',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://client.crisp.chat https://embed.tawk.to",
    "style-src 'self' 'unsafe-inline' https://client.crisp.chat",
    "img-src 'self' data: blob: https://client.crisp.chat https://image.crisp.chat",
    "font-src 'self' https://client.crisp.chat",
    "connect-src 'self' https://*.crisp.chat wss://*.crisp.chat https://*.tawk.to wss://*.tawk.to",
    "frame-src 'self' https://*.crisp.chat https://*.tawk.to",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'ADMIN'
    const isDataManager = token?.role === 'DATA_MANAGER'
    const path = req.nextUrl.pathname

    // Note: API routes (including /api/auth/*) are NOT in the matcher,
    // so they bypass this middleware entirely
    // CORS headers are handled in next.config.js

    // HTTPS enforcement in production
    if (process.env.NODE_ENV === 'production') {
      const proto = req.headers.get('x-forwarded-proto') || req.headers.get('x-forwarded-protocol')
      if (proto !== 'https') {
        return NextResponse.redirect(`https://${req.headers.get('host')}${req.nextUrl.pathname}`, 301)
      }
    }

    // Apply security headers to all responses
    const response = NextResponse.next()
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Redirect DATA_MANAGER away from user portal routes (except settings which is accessible to all)
    if (isDataManager && (path === '/dashboard' || path.startsWith('/funds') || path.startsWith('/crypto') || path.startsWith('/compliance'))) {
      return NextResponse.redirect(new URL('/data-manager', req.url))
    }

    // Admin routes protection
    if (path.startsWith('/admin')) {
      const isDocumentsRoute = path.startsWith('/admin/documents')
      if (isDocumentsRoute) {
        // Allow ADMIN and DATA_MANAGER for documents area
        if (!(isAdmin || isDataManager)) {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      } else {
        // Other admin routes require ADMIN
        if (!isAdmin) {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    }

    // Data manager routes protection
    if (path.startsWith('/data-manager')) {
      // Allow ADMIN and DATA_MANAGER
      if (!(isAdmin || isDataManager)) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        
        // Public routes
        if (path === '/' || path === '/login' || path === '/register' || path === '/reset-password') {
          return true
        }

        // Protected routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/funds/:path*',
    '/direct-investments/:path*',
    '/crypto/:path*',
    '/compliance/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/data-manager/:path*',
  ],
}

