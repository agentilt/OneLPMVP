import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing NextAuth providers...')
    
    const providers = authOptions.providers || []
    console.log('Providers count:', providers.length)
    
    providers.forEach((provider, index) => {
      console.log(`Provider ${index}:`, {
        id: (provider as any).id,
        name: (provider as any).name,
        type: (provider as any).type
      })
    })
    
    // Check if credentials provider exists
    const credentialsProvider = providers.find(p => (p as any).id === 'credentials')
    console.log('Credentials provider found:', !!credentialsProvider)
    
    if (credentialsProvider) {
      console.log('Credentials provider details:', {
        name: (credentialsProvider as any).name,
        type: (credentialsProvider as any).type,
        hasAuthorize: typeof (credentialsProvider as any).authorize === 'function'
      })
    }
    
    return NextResponse.json({
      status: 'OK',
      providersCount: providers.length,
      providers: providers.map((p, index) => ({
        index,
        id: (p as any).id,
        name: (p as any).name,
        type: (p as any).type
      })),
      credentialsProviderExists: !!credentialsProvider,
      credentialsProviderDetails: credentialsProvider ? {
        name: (credentialsProvider as any).name,
        type: (credentialsProvider as any).type,
        hasAuthorize: typeof (credentialsProvider as any).authorize === 'function'
      } : null
    })
  } catch (error) {
    console.error('Provider test error:', error)
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
