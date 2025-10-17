import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'ADMIN'
    const isDataManager = token?.role === 'DATA_MANAGER'
    const path = req.nextUrl.pathname

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

    return NextResponse.next()
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
    '/crypto/:path*',
    '/compliance/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/data-manager/:path*',
  ],
}

