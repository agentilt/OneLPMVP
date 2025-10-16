import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'ADMIN'
    const path = req.nextUrl.pathname

    // Admin routes protection
    if (path.startsWith('/admin') && !isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        
        // Public routes
        if (path === '/' || path === '/login' || path === '/register') {
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
    '/crypto/:path*',
    '/kyc/:path*',
    '/admin/:path*',
  ],
}

