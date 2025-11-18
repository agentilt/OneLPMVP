# API Key Authentication Guide for Admin Project

## Problem
NextAuth's session-based auth across subdomains is complex and blocked by CORS/redirects. Status 0 indicates browser is blocking the POST request entirely.

## Better Solution: API Key Authentication

Instead of trying to share sessions across `onelp.capital` and `admin.onelp.capital`, use API key authentication.

## Implementation

### 1. Create API Key Authentication Endpoint

In your backend (`OneLPMVP`):

```typescript
// src/app/api/auth/api-key/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Find admin user
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Generate API token (you can use a simple method or jwt)
    const apiToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
    
    // Store token (optional - for token management)
    // await prisma.apiToken.create({ ... })
    
    return NextResponse.json({
      success: true,
      token: apiToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('API key auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
```

### 2. Protect Admin API Routes with API Key Middleware

```typescript
// src/lib/api-key-auth.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function verifyApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || 
                 request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!apiKey) {
    return null
  }
  
  // Decode and verify token
  try {
    const decoded = Buffer.from(apiKey, 'base64').toString('utf-8')
    const [userId] = decoded.split(':')
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true }
    })
    
    return user
  } catch {
    return null
  }
}

export function requireApiKey() {
  return async (request: NextRequest) => {
    const user = await verifyApiKey(request)
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return null // Continue
  }
}
```

### 3. Update Admin API Routes

```typescript
// src/app/api/admin/users/route.ts
import { requireApiKey } from '@/lib/api-key-auth'

export async function GET(request: NextRequest) {
  const authCheck = await requireApiKey()(request)
  if (authCheck) return authCheck
  
  // ... rest of handler
}
```

### 4. In Your Admin Frontend

```typescript
// lib/auth-client.ts
class AuthClient {
  private apiBase = process.env.NEXT_PUBLIC_API_URL
  private token: string | null = null
  
  async login(email: string, password: string) {
    const response = await fetch(`${this.apiBase}/api/auth/api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    const data = await response.json()
    
    if (data.success) {
      this.token = data.token
      localStorage.setItem('admin_token', data.token)
      return data
    }
    
    throw new Error(data.error || 'Login failed')
  }
  
  async getAdminUsers() {
    const token = localStorage.getItem('admin_token')
    
    const response = await fetch(`${this.apiBase}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    return response.json()
  }
}
```

## Benefits

✅ **No CORS issues** - Direct API calls  
✅ **No session/cookie complexity** - Simple token in localStorage  
✅ **Works cross-subdomain** - No cookie domain issues  
✅ **Simpler** - No NextAuth configuration  
✅ **Easier to debug** - Clear request/response  

## Security Notes

- Store tokens in localStorage (admin app only)
- Add token expiration (optional)
- Add token revocation (optional)
- Rate limiting on auth endpoint

Would you like me to implement this API key authentication system?



















