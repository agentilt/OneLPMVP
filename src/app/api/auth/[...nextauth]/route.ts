import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

console.log('NextAuth API route - authOptions providers:', authOptions.providers?.length)
console.log('NextAuth API route - authOptions callbacks:', !!authOptions.callbacks)

const handler = NextAuth(authOptions)

// Wrap handlers to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', 'https://admin.onelp.capital')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}

export async function GET(request: NextRequest) {
  const response = await handler.GET(request)
  return addCorsHeaders(response as NextResponse)
}

export async function POST(request: NextRequest) {
  const response = await handler.POST(request)
  return addCorsHeaders(response as NextResponse)
}

