import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Test basic connectivity
    const basicInfo = {
      status: 'OK',
      message: 'Auth debug endpoint working',
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method
    }

    // Test session retrieval
    try {
      const session = await getServerSession(authOptions)
      return NextResponse.json({
        ...basicInfo,
        session: session,
        hasSession: !!session,
        hasUser: !!session?.user,
        userRole: session?.user?.role || 'none'
      })
    } catch (sessionError) {
      return NextResponse.json({
        ...basicInfo,
        sessionError: sessionError instanceof Error ? sessionError.message : 'Unknown session error'
      })
    }
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
