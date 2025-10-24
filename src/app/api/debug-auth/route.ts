import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test basic connectivity
    return NextResponse.json({
      status: 'OK',
      message: 'Auth debug endpoint working',
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method
    })
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
