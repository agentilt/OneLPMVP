import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Test environment variables
    const envCheck = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set'
    }

    // Test database connection
    let dbStatus = 'Unknown'
    try {
      const { prisma } = await import('@/lib/db')
      await prisma.$queryRaw`SELECT 1`
      dbStatus = 'Connected'
    } catch (error) {
      dbStatus = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    // Test session
    let sessionStatus = 'Unknown'
    try {
      const session = await getServerSession(authOptions)
      sessionStatus = session ? 'Active' : 'No session'
    } catch (error) {
      sessionStatus = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return NextResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbStatus,
      session: sessionStatus,
      authOptions: {
        providers: authOptions.providers?.length || 0,
        pages: authOptions.pages,
        session: authOptions.session?.strategy
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
