import crypto from 'crypto'
import { prisma } from '@/lib/db'

export interface TokenRotationConfig {
  rotationInterval: number // in milliseconds
  maxActiveSecrets: number
  secretLength: number
}

export const defaultTokenRotationConfig: TokenRotationConfig = {
  rotationInterval: 24 * 60 * 60 * 1000, // 24 hours
  maxActiveSecrets: 3, // Keep 3 active secrets for gradual rotation
  secretLength: 64 // 64 character secret
}

export interface ActiveSecret {
  id: string
  secret: string
  createdAt: Date
  expiresAt: Date
  isActive: boolean
}

// In-memory store for active secrets (in production, use Redis or database)
const activeSecrets: ActiveSecret[] = []

export function generateSecureSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString('hex')
}

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateMFAToken(): string {
  return crypto.randomInt(100000, 999999).toString() // 6-digit code
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function verifyTokenHash(token: string, hash: string): boolean {
  const tokenHash = hashToken(token)
  return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash))
}

export function rotateNextAuthSecret(): string {
  const newSecret = generateSecureSecret()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + defaultTokenRotationConfig.rotationInterval)
  
  const newActiveSecret: ActiveSecret = {
    id: crypto.randomUUID(),
    secret: newSecret,
    createdAt: now,
    expiresAt,
    isActive: true
  }
  
  // Add new secret
  activeSecrets.push(newActiveSecret)
  
  // Remove expired secrets
  const validSecrets = activeSecrets.filter(secret => 
    secret.expiresAt > now && secret.isActive
  )
  
  // Keep only the most recent secrets
  if (validSecrets.length > defaultTokenRotationConfig.maxActiveSecrets) {
    validSecrets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const secretsToKeep = validSecrets.slice(0, defaultTokenRotationConfig.maxActiveSecrets)
    activeSecrets.length = 0
    activeSecrets.push(...secretsToKeep)
  } else {
    activeSecrets.length = 0
    activeSecrets.push(...validSecrets)
  }
  
  return newSecret
}

export function getCurrentSecret(): string {
  const now = new Date()
  const activeSecret = activeSecrets.find(secret => 
    secret.expiresAt > now && secret.isActive
  )
  
  if (!activeSecret) {
    // Generate a new secret if none exists
    return rotateNextAuthSecret()
  }
  
  return activeSecret.secret
}

export function getAllActiveSecrets(): string[] {
  const now = new Date()
  return activeSecrets
    .filter(secret => secret.expiresAt > now && secret.isActive)
    .map(secret => secret.secret)
}

export function createPasswordResetRecord(userId: string, token: string): Promise<void> {
  const hashedToken = hashToken(token)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  
  return prisma.passwordReset.create({
    data: {
      userId,
      tokenHash: hashedToken,
      expiresAt,
      used: false
    }
  }).then(() => {})
}

export function verifyPasswordResetToken(token: string): Promise<{ userId: string; valid: boolean }> {
  const hashedToken = hashToken(token)
  const now = new Date()
  
  return prisma.passwordReset.findFirst({
    where: {
      tokenHash: hashedToken,
      expiresAt: { gt: now },
      used: false
    },
    include: {
      user: true
    }
  }).then(record => {
    if (!record) {
      return { userId: '', valid: false }
    }
    
    return { userId: record.userId, valid: true }
  })
}

export function markPasswordResetTokenAsUsed(token: string): Promise<void> {
  const hashedToken = hashToken(token)
  
  return prisma.passwordReset.updateMany({
    where: {
      tokenHash: hashedToken,
      used: false
    },
    data: {
      used: true,
      usedAt: new Date()
    }
  }).then(() => {})
}

export function createMFARecord(userId: string, token: string): Promise<void> {
  const hashedToken = hashToken(token)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  
  return prisma.mFAToken.create({
    data: {
      userId,
      tokenHash: hashedToken,
      expiresAt,
      used: false
    }
  }).then(() => {})
}

export function verifyMFAToken(token: string): Promise<{ userId: string; valid: boolean }> {
  const hashedToken = hashToken(token)
  const now = new Date()
  
  return prisma.mFAToken.findFirst({
    where: {
      tokenHash: hashedToken,
      expiresAt: { gt: now },
      used: false
    }
  }).then(record => {
    if (!record) {
      return { userId: '', valid: false }
    }
    
    return { userId: record.userId, valid: true }
  })
}

export function markMFATokenAsUsed(token: string): Promise<void> {
  const hashedToken = hashToken(token)
  
  return prisma.mFAToken.updateMany({
    where: {
      tokenHash: hashedToken,
      used: false
    },
    data: {
      used: true,
      usedAt: new Date()
    }
  }).then(() => {})
}

export function createInvitationRecord(email: string, role: string, invitedBy: string): Promise<string> {
  const token = generateInvitationToken()
  const hashedToken = hashToken(token)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  return prisma.invitation.create({
    data: {
      email,
      role,
      token,
      tokenHash: hashedToken,
      expiresAt,
      invitedBy,
      used: false
    }
  }).then(() => token)
}

export function verifyInvitationToken(token: string): Promise<{ email: string; role: string; valid: boolean }> {
  const hashedToken = hashToken(token)
  const now = new Date()
  
  return prisma.invitation.findFirst({
    where: {
      tokenHash: hashedToken,
      expiresAt: { gt: now },
      used: false
    }
  }).then(record => {
    if (!record) {
      return { email: '', role: '', valid: false }
    }
    
    return { email: record.email, role: record.role, valid: true }
  })
}

export function markInvitationAsUsed(token: string): Promise<void> {
  const hashedToken = hashToken(token)
  
  return prisma.invitation.updateMany({
    where: {
      tokenHash: hashedToken,
      used: false
    },
    data: {
      used: true,
      usedAt: new Date()
    }
  }).then(() => {})
}

// Rate limiting for token-based operations
const tokenAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_TOKEN_ATTEMPTS = 5
const TOKEN_LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export function isTokenRateLimited(identifier: string): boolean {
  const attempts = tokenAttempts.get(identifier)
  if (!attempts) return false
  
  const now = Date.now()
  if (now - attempts.lastAttempt > TOKEN_LOCKOUT_DURATION) {
    tokenAttempts.delete(identifier)
    return false
  }
  
  return attempts.count >= MAX_TOKEN_ATTEMPTS
}

export function recordTokenAttempt(identifier: string, success: boolean): void {
  const attempts = tokenAttempts.get(identifier) || { count: 0, lastAttempt: 0 }
  
  if (success) {
    tokenAttempts.delete(identifier)
  } else {
    attempts.count += 1
    attempts.lastAttempt = Date.now()
    tokenAttempts.set(identifier, attempts)
  }
}

export function cleanupExpiredTokens(): Promise<void> {
  const now = new Date()
  
  return Promise.all([
    prisma.passwordReset.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    }),
    prisma.mFAToken.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    }),
    prisma.invitation.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    })
  ]).then(() => {})
}
