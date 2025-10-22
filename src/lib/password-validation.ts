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
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
  forbiddenPatterns: [
    /(.)\1{2,}/, // No more than 2 consecutive identical characters
    /123|234|345|456|567|678|789|890/, // No sequential numbers
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // No sequential letters
    /qwerty|asdf|zxcv|password|admin|user|test/i, // Common weak patterns
  ]
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

  // Pattern validation
  for (const pattern of policy.forbiddenPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains forbidden patterns (sequential characters, common words, etc.)')
      break
    }
  }

  // Additional strength checks
  const uniqueChars = new Set(password).size
  if (uniqueChars < 4) {
    errors.push('Password must contain at least 4 unique characters')
  } else {
    score += 1
  }

  // Check for common substitutions
  const commonSubstitutions = {
    'a': '@',
    'e': '3',
    'i': '1',
    'o': '0',
    's': '$',
    't': '7'
  }

  let hasCommonSubstitution = false
  for (const [original, substitute] of Object.entries(commonSubstitutions)) {
    if (password.toLowerCase().includes(substitute) && password.toLowerCase().includes(original)) {
      hasCommonSubstitution = true
      break
    }
  }

  if (hasCommonSubstitution) {
    score += 1
  }

  // Calculate final score (0-10)
  const maxScore = 8 // Maximum possible score
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
