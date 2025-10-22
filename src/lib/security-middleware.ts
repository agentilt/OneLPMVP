import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message: string
}

const defaultRateLimit: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
}

export function rateLimit(config: RateLimitConfig = defaultRateLimit) {
  return (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Clean up old entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }

    const key = `${ip}-${req.nextUrl.pathname}`
    const current = rateLimitStore.get(key)

    if (!current) {
      rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs })
      return null
    }

    if (current.resetTime < now) {
      rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs })
      return null
    }

    if (current.count >= config.maxRequests) {
      return NextResponse.json(
        { error: config.message },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString()
          }
        }
      )
    }

    current.count++
    rateLimitStore.set(key, current)
    return null
  }
}

export function validateCSRF(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const host = req.headers.get('host')

  // Skip CSRF check for same-origin requests
  if (origin && host && origin.includes(host)) {
    return true
  }

  if (referer && host && referer.includes(host)) {
    return true
  }

  // For API routes, check for valid API key or token
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return true
  }

  return false
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }

  return input
}

export function validateRequestSize(req: NextRequest, maxSize: number = 1024 * 1024): boolean {
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > maxSize) {
    return false
  }
  return true
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Add additional security headers for API responses
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Remove server information
  response.headers.delete('X-Powered-By')
  
  return response
}

export function logSecurityEvent(event: string, details: any, req: NextRequest) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    path: req.nextUrl.pathname,
    method: req.method,
    details
  }

  // In production, send to your logging service
  console.warn('Security Event:', JSON.stringify(logEntry))
}

export function detectSuspiciousActivity(req: NextRequest): boolean {
  const userAgent = req.headers.get('user-agent') || ''
  const path = req.nextUrl.pathname

  // Check for common attack patterns
  const suspiciousPatterns = [
    /\.\./, // Directory traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /eval\(/i, // Code injection
    /document\.cookie/i, // Cookie theft attempts
  ]

  // Check URL path
  if (suspiciousPatterns.some(pattern => pattern.test(path))) {
    logSecurityEvent('Suspicious URL pattern detected', { path }, req)
    return true
  }

  // Check User-Agent for suspicious patterns
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logSecurityEvent('Suspicious User-Agent detected', { userAgent }, req)
    return true
  }

  // Check for common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
  ]

  if (botPatterns.some(pattern => pattern.test(userAgent)) && !userAgent.includes('Googlebot')) {
    logSecurityEvent('Bot detected', { userAgent }, req)
    return true
  }

  return false
}

export function createSecurityResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString()
    },
    { 
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  )
}
