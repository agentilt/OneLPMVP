import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export interface MobileUser {
  id: string
  email: string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  role: 'USER' | 'ADMIN' | 'DATA_MANAGER'
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
  type: 'access' | 'refresh'
}

export function generateAccessToken(user: MobileUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'access'
  }

  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!, {
    expiresIn: '1h', // Reduced from 30d to 1 hour
    issuer: 'euro-lp-mobile',
    audience: 'euro-lp-mobile-app',
    algorithm: 'HS256',
    notBefore: 0,
    issuedAt: Math.floor(Date.now() / 1000)
  })
}

export function generateRefreshToken(user: MobileUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh'
  }

  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!, {
    expiresIn: '7d', // Reduced from 90d to 7 days
    issuer: 'euro-lp-mobile',
    audience: 'euro-lp-mobile-app',
    algorithm: 'HS256',
    notBefore: 0,
    issuedAt: Math.floor(Date.now() / 1000)
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!, {
      issuer: 'euro-lp-mobile',
      audience: 'euro-lp-mobile-app',
      algorithms: ['HS256']
    }) as JWTPayload
    return decoded
  } catch (error) {
    console.warn('Token verification failed:', error)
    return null
  }
}

export async function getUserFromToken(token: string): Promise<MobileUser | null> {
  const payload = verifyToken(token)
  if (!payload || payload.type !== 'access') {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      role: true
    }
  })

  return user as MobileUser | null
}

export function createMobileResponse(success: boolean, data: any = null, error: string | null = null, message: string = '') {
  return {
    success,
    data,
    error,
    message
  }
}
