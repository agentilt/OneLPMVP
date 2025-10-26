import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGIN = 'https://admin.onelp.capital'

export function addCorsHeaders(response: NextResponse, origin?: string | null): NextResponse {
  // Only allow requests from admin subdomain
  if (origin === ALLOWED_ORIGIN) {
    response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
  }
  
  return response
}

export function createCorsResponse(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    return addCorsHeaders(response, origin)
  }
  
  return null
}

