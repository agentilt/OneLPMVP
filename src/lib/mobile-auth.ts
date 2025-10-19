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
    expiresIn: '30d',
    issuer: 'euro-lp-mobile'
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
    expiresIn: '90d',
    issuer: 'euro-lp-mobile'
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as JWTPayload
    return decoded
  } catch (error) {
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
