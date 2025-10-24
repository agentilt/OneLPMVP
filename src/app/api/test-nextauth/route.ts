import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing NextAuth configuration...')
    
    // Test if authOptions is valid
    console.log('Auth options providers:', authOptions.providers?.length)
    console.log('Auth options callbacks:', !!authOptions.callbacks)
    console.log('Auth options secret:', !!authOptions.secret)
    
    // Test session retrieval
    const session = await getServerSession(authOptions)
    console.log('Server session:', session)
    
    return NextResponse.json({
      status: 'OK',
      providersCount: authOptions.providers?.length || 0,
      hasCallbacks: !!authOptions.callbacks,
      hasSecret: !!authOptions.secret,
      session: session,
      sessionExists: !!session
    })
  } catch (error) {
    console.error('NextAuth test error:', error)
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
