import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AuditService } from '@/lib/audit'

export function withAuditLogging(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    action: string
    resource: string
    getResourceId?: (request: NextRequest, context?: any) => string | undefined
    getDescription?: (request: NextRequest, context?: any) => string
  }
) {
  return async (request: NextRequest, context?: any) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return handler(request, context)
    }

    const response = await handler(request, context)
    
    // Only log if the operation was successful (2xx status)
    if (response.status >= 200 && response.status < 300) {
      try {
        const resourceId = options.getResourceId?.(request, context)
        const description = options.getDescription?.(request, context) || `${options.action} ${options.resource}`
        
        await AuditService.log({
          userId: session.user.id,
          action: options.action as any,
          resource: options.resource as any,
          resourceId,
          description,
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') || undefined
        })
      } catch (error) {
        console.error('Failed to log audit trail:', error)
      }
    }
    
    return response
  }
}

function getClientIP(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return undefined
}
