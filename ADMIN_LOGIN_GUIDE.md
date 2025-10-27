# Admin Login Endpoint Guide

## Backend URL

```
Production: https://onelp.capital
```

## Login Endpoint

### Endpoint Details

**URL**: `https://onelp.capital/api/auth/signin/credentials`

**Method**: `POST`

**Content-Type**: `application/x-www-form-urlencoded`

**Cookies**: Automatically handled by browser (no manual cookie management needed)

### Request Body

The backend uses NextAuth.js with the Credentials provider. You need to send credentials as form data:

```
email: string (user's email address)
password: string (user's password)
csrfToken: string (CSRF token from /api/auth/csrf)
```

### CSRF Token Flow

Before login, you must get a CSRF token:

**GET** `https://onelp.capital/api/auth/csrf`

**Response**:
```json
{
  "csrfToken": "abc123xyz..."
}
```

### Login Request Example

```typescript
// Step 1: Get CSRF token
const csrfResponse = await fetch('https://onelp.capital/api/auth/csrf', {
  credentials: 'include'
})
const { csrfToken } = await csrfResponse.json()

// Step 2: Login
const formData = new URLSearchParams()
formData.append('email', 'admin@example.com')
formData.append('password', 'your-password')
formData.append('csrfToken', csrfToken)

const response = await fetch('https://onelp.capital/api/auth/signin/credentials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  credentials: 'include', // Important for cookies
  body: formData,
})

const result = await response.json()
```

### Successful Response

**Status**: `200 OK`

**Response Body**:
```json
{
  "url": "https://onelp.capital/dashboard",
  "ok": true,
  "status": 200,
  "error": null
}
```

### Error Responses

**Invalid Credentials**:
```json
{
  "url": null,
  "ok": false,
  "status": 401,
  "error": "CredentialsSignin"
}
```

**User Not Found**:
```json
{
  "error": "CredentialsSignin"
}
```

**Rate Limited**:
After 5 failed attempts, account locked for 15 minutes.

## Session Endpoint

### Get Current Session

**GET** `https://onelp.capital/api/auth/session`

**Method**: `GET`

**Credentials**: `include` (cookies sent automatically)

**Response** (when logged in):
```json
{
  "user": {
    "id": "user123",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "ADMIN",
    "mfaEnabled": false,
    "mfaRequired": false
  },
  "expires": "2024-01-15T12:00:00.000Z"
}
```

**Response** (when not logged in):
```json
{}
```

## Admin-Only Login Validation

### Check User Role After Login

```typescript
// After successful login, check session
const sessionResponse = await fetch('https://onelp.capital/api/auth/session', {
  credentials: 'include'
})
const session = await sessionResponse.json()

// Verify user is ADMIN
if (session?.user?.role === 'ADMIN') {
  // Admin logged in successfully
  console.log('Admin session:', session.user)
} else {
  // Not an admin, redirect or show error
  console.error('User is not an admin')
}
```

## Complete Login Flow Example

```typescript
async function adminLogin(email: string, password: string) {
  try {
    // 1. Get CSRF token
    const csrfResponse = await fetch('https://onelp.capital/api/auth/csrf', {
      credentials: 'include'
    })
    const { csrfToken } = await csrfResponse.json()

    // 2. Attempt login
    const formData = new URLSearchParams()
    formData.append('email', email)
    formData.append('password', password)
    formData.append('csrfToken', csrfToken)

    const loginResponse = await fetch(
      'https://onelp.capital/api/auth/signin/credentials',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: formData,
      }
    )

    const result = await loginResponse.json()

    // 3. Check if login was successful
    if (!result.ok || result.error) {
      throw new Error(result.error || 'Login failed')
    }

    // 4. Verify admin role
    const sessionResponse = await fetch(
      'https://onelp.capital/api/auth/session',
      { credentials: 'include' }
    )
    const session = await sessionResponse.json()

    if (session?.user?.role !== 'ADMIN') {
      throw new Error('User does not have admin privileges')
    }

    // 5. Success - admin is logged in
    return {
      success: true,
      user: session.user,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}
```

## Logout Endpoint

### Sign Out

**POST** `https://onelp.capital/api/auth/signout`

**Method**: `POST`

**Credentials**: `include`

**Response**:
```json
{
  "url": "https://onelp.capital/login",
  "ok": true
}
```

## React Hook Example (for Next.js Frontend)

```typescript
import { useSession, signIn, signOut } from 'next-auth/react'

// In your login component
const handleLogin = async (email: string, password: string) => {
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  })

  if (result?.error) {
    setError('Invalid credentials')
    return
  }

  // Check if user is admin
  const { data: session } = useSession()
  if (session?.user?.role !== 'ADMIN') {
    signOut({ redirect: false })
    setError('Admin access required')
    return
  }

  // Redirect to admin dashboard
  window.location.href = '/admin/dashboard'
}
```

## API Client Example (vanilla JavaScript)

```typescript
class AdminAPIClient {
  private baseURL = 'https://onelp.capital'

  async getCSRFToken(): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/auth/csrf`, {
      credentials: 'include',
    })
    const { csrfToken } = await response.json()
    return csrfToken
  }

  async login(email: string, password: string) {
    const csrfToken = await this.getCSRFToken()
    
    const formData = new URLSearchParams()
    formData.append('email', email)
    formData.append('password', password)
    formData.append('csrfToken', csrfToken)

    const response = await fetch(
      `${this.baseURL}/api/auth/signin/credentials`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: formData,
      }
    )

    return response.json()
  }

  async getSession() {
    const response = await fetch(`${this.baseURL}/api/auth/session`, {
      credentials: 'include',
    })
    return response.json()
  }

  async logout() {
    const response = await fetch(`${this.baseURL}/api/auth/signout`, {
      method: 'POST',
      credentials: 'include',
    })
    return response.json()
  }
}

// Usage
const client = new AdminAPIClient()

// Login
const result = await client.login('admin@example.com', 'password')
if (result.ok) {
  const session = await client.getSession()
  if (session.user?.role === 'ADMIN') {
    console.log('Admin logged in!')
  }
}
```

## Security Notes

### Important for Cross-Domain

Since your admin app is on `admin.onelp.capital` and backend is on `onelp.capital`:

1. **Always use `credentials: 'include'`** in fetch requests
2. **Cookies are shared** via `.onelp.capital` domain
3. **CORS is configured** to allow `https://admin.onelp.capital`
4. **SameSite cookies** are set to `lax` for security

### Rate Limiting

- **Max attempts**: 5 failed logins
- **Lockout duration**: 15 minutes
- **Reset**: Automatic after lockout period or successful login

### Password Requirements

- Minimum 8 characters
- Stored as bcrypt hash (12 rounds)
- Never sent in API responses

## Error Codes

| Status | Error | Meaning |
|--------|-------|---------|
| 401 | `CredentialsSignin` | Invalid email/password |
| 401 | `AccessDenied` | Account locked or no access |
| 429 | N/A | Rate limited |
| 500 | N/A | Server error |

## Testing in Browser Console

```javascript
// Test CSRF token
fetch('https://onelp.capital/api/auth/csrf', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('CSRF:', d))

// Test session
fetch('https://onelp.capital/api/auth/session', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Session:', d))
```

---

**Summary**:

- **Backend URL**: `https://onelp.capital`
- **Login Endpoint**: `POST /api/auth/signin/credentials`
- **Request Format**: Form data with email, password, csrfToken
- **Successful Response**: `{ ok: true, status: 200 }`
- **Session Check**: `GET /api/auth/session` returns `{ user: { role: 'ADMIN' } }`

