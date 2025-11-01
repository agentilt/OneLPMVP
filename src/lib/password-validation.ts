import bcrypt from 'bcrypt'

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  score: number
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxLength: number
  forbiddenPatterns: RegExp[]
}

export const defaultPasswordPolicy: PasswordPolicy = {
  minLength: 8, // Minimum reasonable length
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
  forbiddenPatterns: [] // Removed strict pattern requirements
}

export function validatePassword(password: string, policy: PasswordPolicy = defaultPasswordPolicy): PasswordValidationResult {
  const errors: string[] = []
  let score = 0

  // Length validation
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`)
  } else {
    score += 1
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must be no more than ${policy.maxLength} characters long`)
  } else {
    score += 1
  }

  // Character type validation
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else if (policy.requireUppercase) {
    score += 1
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else if (policy.requireLowercase) {
    score += 1
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else if (policy.requireNumbers) {
    score += 1
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else if (policy.requireSpecialChars) {
    score += 1
  }

  // Pattern validation (optional - only if patterns are defined)
  if (policy.forbiddenPatterns && policy.forbiddenPatterns.length > 0) {
    for (const pattern of policy.forbiddenPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains forbidden patterns (sequential characters, common words, etc.)')
        break
      }
    }
  }

  // Calculate final score based on requirements met
  const maxScore = 5 // Length (2) + 4 character type requirements
  const finalScore = Math.min(score, maxScore)

  return {
    isValid: errors.length === 0,
    errors,
    score: finalScore
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12 // Increased from default 10
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generatePasswordStrengthMessage(score: number): string {
  if (score <= 2) return 'Very weak password'
  if (score <= 4) return 'Weak password'
  if (score <= 6) return 'Fair password'
  if (score <= 8) return 'Good password'
  return 'Strong password'
}

export function isPasswordCommonlyUsed(password: string): boolean {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
    '123123', 'dragon', '1234567', 'master', 'hello', 'freedom', 'whatever',
    'qazwsx', 'trustno1', '654321', 'jordan23', 'harley', 'password1',
    'jordan', 'superman', 'qazwsx', 'michael', 'mustang', 'shadow',
    'master', 'jennifer', 'joshua', 'monkey', 'jordan23', 'harley',
    'ranger', 'daniel', 'hunter', 'hannah', 'maggie', 'jessica',
    'charlie', 'samantha', 'summer', 'jessica', 'zachary', 'thomas',
    'joshua', 'hannah', 'thomas', 'jessica', 'daniel', 'hunter'
  ]

  return commonPasswords.includes(password.toLowerCase())
}
