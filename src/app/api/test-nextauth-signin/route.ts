import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('Testing NextAuth signIn process...')
    
    const body = await request.json()
    const { email, password } = body
    
    console.log('Test credentials:', { email, password })
    
    // Get the credentials provider
    const credentialsProvider = authOptions.providers?.find(p => (p as any).id === 'credentials')
    
    if (!credentialsProvider) {
      return NextResponse.json({
        status: 'ERROR',
        message: 'Credentials provider not found'
      })
    }
    
    console.log('Credentials provider found, calling authorize...')
    
    // Call the authorize function directly
    try {
      const result = await (credentialsProvider as any).authorize({
        email,
        password
      })
      
      console.log('Credentials provider authorize result:', result)
      
      return NextResponse.json({
        status: 'OK',
        result: result,
        resultType: typeof result,
        resultIsNull: result === null,
        resultIsUndefined: result === undefined
      })
    } catch (error) {
      console.error('Credentials provider authorize error:', error)
      return NextResponse.json({
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  } catch (error) {
    console.error('NextAuth signIn test error:', error)
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
