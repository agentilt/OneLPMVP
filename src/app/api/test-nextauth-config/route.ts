import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing NextAuth configuration...')
    
    // Test if authOptions is valid
    console.log('Auth options providers:', authOptions.providers?.length)
    console.log('Auth options callbacks:', !!authOptions.callbacks)
    console.log('Auth options secret:', !!authOptions.secret)
    console.log('Auth options session strategy:', authOptions.session?.strategy)
    console.log('Auth options debug:', authOptions.debug)
    
    // Test if credentials provider is properly configured
    const credentialsProvider = authOptions.providers?.find(p => (p as any).id === 'credentials')
    if (credentialsProvider) {
      console.log('Credentials provider found')
      console.log('Credentials provider name:', (credentialsProvider as any).name)
      console.log('Credentials provider type:', (credentialsProvider as any).type)
      console.log('Credentials provider has authorize:', typeof (credentialsProvider as any).authorize === 'function')
      
      // Test calling the authorize function directly
      try {
        console.log('Testing credentials provider authorize function...')
        const result = await (credentialsProvider as any).authorize({
          email: 'demo@onelp.capital',
          password: 'demo123'
        })
        console.log('Credentials provider authorize result:', result)
      } catch (error) {
        console.error('Credentials provider authorize error:', error)
      }
    } else {
      console.log('Credentials provider not found')
    }
    
    return NextResponse.json({
      status: 'OK',
      providersCount: authOptions.providers?.length || 0,
      hasCallbacks: !!authOptions.callbacks,
      hasSecret: !!authOptions.secret,
      sessionStrategy: authOptions.session?.strategy,
      debug: authOptions.debug,
      credentialsProviderExists: !!credentialsProvider,
      credentialsProviderName: credentialsProvider ? (credentialsProvider as any).name : null,
      credentialsProviderType: credentialsProvider ? (credentialsProvider as any).type : null,
      credentialsProviderHasAuthorize: credentialsProvider ? typeof (credentialsProvider as any).authorize === 'function' : false
    })
  } catch (error) {
    console.error('NextAuth config test error:', error)
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
