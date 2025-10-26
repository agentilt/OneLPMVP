# Backend API Reference
## OneLPMVP Backend API Documentation

This document provides complete documentation for the backend API that serves both the main application and any external admin applications.

**Base URL**: `http://localhost:3000` (or your production URL)

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management API](#user-management-api)
3. [Fund Management API](#fund-management-api)
4. [Document Management API](#document-management-api)
5. [Invitation API](#invitation-api)
6. [Security & Audit API](#security--audit-api)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)
9. [Environment Configuration](#environment-configuration)

---

## Authentication

### Authentication Method
The API uses **NextAuth.js** with session-based authentication via HTTP cookies.

### Required Headers
```typescript
{
  "Content-Type": "application/json",
  "Cookie": "next-auth.session-token=..." // Automatically handled by browser
}
```

### User Roles
- `USER` - Regular user (limited access)
- `ADMIN` - Administrator (full access)
- `DATA_MANAGER` - Data manager (limited admin access)

### Protected Endpoints
All `/api/admin/*` endpoints require `ADMIN` role.
All `/api/data-manager/*` endpoints require `ADMIN` or `DATA_MANAGER` role.

---

## User Management API

### Get All Users
**GET** `/api/admin/users`

**Authorization**: Admin only

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "email": "string",
      "name": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "USER" | "ADMIN" | "DATA_MANAGER",
      "emailVerified": "DateTime",
      "lastLoginAt": "DateTime",
      "loginAttempts": 0,
      "lockedUntil": "DateTime",
      "createdAt": "DateTime",
      "updatedAt": "DateTime",
      "funds": [
        {
          "id": "string",
          "name": "string"
        }
      ]
    }
  ]
}
```

### Get User by ID
**GET** `/api/admin/users/[id]`

**Authorization**: Admin only

**Response:**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "funds": [],
    "createdAt": "DateTime"
  }
}
```

### Update User
**PUT** `/api/admin/users/[id]`

**Authorization**: Admin only

**Request Body:**
```json
{
  "email": "string",
  "name": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "USER" | "ADMIN" | "DATA_MANAGER"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string"
  }
}
```

### Delete User
**DELETE** `/api/admin/users/[id]`

**Authorization**: Admin only

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Fund Management API

### Create Fund for User
**POST** `/api/admin/users/[id]/funds`

**Authorization**: Admin only

**Request Body:**
```json
{
  "name": "string",
  "domicile": "string",
  "vintage": 2024,
  "manager": "string",
  "commitment": 1000000.00,
  "paidIn": 800000.00,
  "nav": 1200000.00,
  "tvpi": 1.50,
  "dpi": 0.80
}
```

**Response:**
```json
{
  "success": true,
  "fund": {
    "id": "string",
    "userId": "string",
    "name": "string",
    "domicile": "string",
    "vintage": 2024,
    "manager": "string",
    "commitment": 1000000.00,
    "paidIn": 800000.00,
    "nav": 1200000.00,
    "irr": 0,
    "tvpi": 1.50,
    "dpi": 0.80,
    "lastReportDate": "DateTime",
    "createdAt": "DateTime",
    "updatedAt": "DateTime"
  }
}
```

### List Funds
**GET** `/api/admin/funds/list`

**Authorization**: Admin only

**Response:**
```json
{
  "funds": [
    {
      "id": "string",
      "name": "string"
    }
  ]
}
```

### Update Fund
**PUT** `/api/admin/users/[id]/funds/[fundId]`

**Authorization**: Admin only

**Request Body:**
```json
{
  "name": "string",
  "domicile": "string",
  "vintage": 2024,
  "manager": "string",
  "commitment": 1000000.00,
  "paidIn": 800000.00,
  "nav": 1200000.00,
  "tvpi": 1.50,
  "dpi": 0.80
}
```

**Response:**
```json
{
  "success": true,
  "fund": {
    "id": "string",
    "name": "string",
    "domicile": "string",
    // ... other fields
  }
}
```

### Delete Fund
**DELETE** `/api/admin/users/[id]/funds/[fundId]`

**Authorization**: Admin only

**Response:**
```json
{
  "success": true,
  "message": "Fund deleted successfully"
}
```

---

## Document Management API

### Create Document
**POST** `/api/admin/documents`

**Authorization**: Admin only

**Request Body:**
```json
{
  "fundId": "string",
  "type": "CAPITAL_CALL" | "QUARTERLY_REPORT" | "ANNUAL_REPORT" | "KYC" | "COMPLIANCE" | "OTHER",
  "title": "string",
  "uploadDate": "2024-01-01T00:00:00Z",
  "dueDate": "2024-02-01T00:00:00Z",
  "callAmount": 50000.00,
  "paymentStatus": "PENDING" | "PAID" | "LATE" | "OVERDUE",
  "url": "string",
  "parsedData": {},
  "investmentValue": 100000.00
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "string",
    "fundId": "string",
    "type": "string",
    "title": "string",
    "uploadDate": "DateTime",
    "dueDate": "DateTime",
    "callAmount": 50000.00,
    "paymentStatus": "string",
    "url": "string",
    "parsedData": {},
    "investmentValue": 100000.00,
    "createdAt": "DateTime",
    "updatedAt": "DateTime"
  }
}
```

### Get Documents for Fund
**GET** `/api/admin/users/[id]/funds/[fundId]/documents`

**Authorization**: Admin only

**Response:**
```json
{
  "documents": [
    {
      "id": "string",
      "fundId": "string",
      "type": "string",
      "title": "string",
      "uploadDate": "DateTime",
      "dueDate": "DateTime",
      "callAmount": 50000.00,
      "paymentStatus": "string",
      "url": "string",
      "parsedData": {},
      "investmentValue": 100000.00
    }
  ]
}
```

### Create Document for Fund
**POST** `/api/admin/users/[id]/funds/[fundId]/documents`

**Authorization**: Admin only

**Request Body:**
```json
{
  "type": "CAPITAL_CALL",
  "title": "Q1 2024 Capital Call",
  "url": "/uploads/documents/doc.pdf",
  "dueDate": "2024-02-01T00:00:00Z",
  "callAmount": 50000.00,
  "paymentStatus": "PENDING",
  "investmentValue": 100000.00
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    // ... document object
  }
}
```

### Delete Document
**DELETE** `/api/admin/users/[id]/funds/[fundId]/documents?documentId={documentId}`

**Authorization**: Admin only

**Query Parameters:**
- `documentId` (required) - Document ID to delete

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## Invitation API

### Create Invitation
**POST** `/api/invitations`

**Authorization**: Admin only

**Request Body:**
```json
{
  "email": "investor@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "invitation": {
    "id": "string",
    "email": "string",
    "expiresAt": "DateTime"
  }
}
```

### Get All Invitations
**GET** `/api/invitations`

**Authorization**: Admin only

**Response:**
```json
{
  "invitations": [
    {
      "id": "string",
      "email": "string",
      "token": "string",
      "role": "USER",
      "expiresAt": "DateTime",
      "usedAt": "DateTime",
      "used": false,
      "invitedBy": "string",
      "createdAt": "DateTime",
      "creator": {
        "name": "string",
        "email": "string"
      }
    }
  ]
}
```

### Validate Invitation Token
**GET** `/api/invitations/validate?token={token}`

**Authorization**: Public (registration flow)

**Query Parameters:**
- `token` (required) - Invitation token

**Response:**
```json
{
  "valid": true,
  "email": "string"
}
```

**Error Response:**
```json
{
  "valid": false,
  "error": "Invitation error message"
}
```

---

## Security & Audit API

### Get Audit Logs
**GET** `/api/admin/audit-logs`

**Authorization**: Admin or Data Manager

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50)
- `userId` (optional) - Filter by user ID
- `action` (optional) - Filter by action type
- `resource` (optional) - Filter by resource type
- `startDate` (optional) - Filter by start date
- `endDate` (optional) - Filter by end date

**Response:**
```json
{
  "auditLogs": [
    {
      "id": "string",
      "userId": "string",
      "action": "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "UPLOAD" | "DOWNLOAD" | "EXPORT" | "IMPORT" | "RESET_PASSWORD" | "CHANGE_PASSWORD" | "GRANT_ACCESS" | "REVOKE_ACCESS",
      "resource": "USER" | "FUND" | "DOCUMENT" | "CRYPTO_HOLDING" | "FUND_ACCESS" | "INVITATION" | "SYSTEM",
      "resourceId": "string",
      "description": "string",
      "oldValues": {},
      "newValues": {},
      "metadata": {},
      "ipAddress": "string",
      "userAgent": "string",
      "createdAt": "DateTime",
      "User": {
        "id": "string",
        "email": "string",
        "name": "string",
        "role": "string"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### Get Security Metrics
**GET** `/api/admin/security?type=overview`

**Authorization**: Admin only

**Query Parameters:**
- `type` (optional) - Report type: `overview` | `metrics` | `events` | `sessions`

**Response:**
```json
{
  "metrics": {},
  "events": [],
  "sessions": []
}
```

### Cleanup Security Data
**POST** `/api/admin/security`

**Authorization**: Admin only

**Request Body:**
```json
{
  "action": "cleanup"
}
```

**Response:**
```json
{
  "message": "Security data cleanup completed successfully"
}
```

---

## Data Models

### User Model
```typescript
interface User {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  password: string;
  role: "USER" | "ADMIN" | "DATA_MANAGER";
  emailVerified: DateTime | null;
  resetToken: string | null;
  resetTokenExpiry: DateTime | null;
  mfaEnabled: boolean;
  lastLoginAt: DateTime | null;
  loginAttempts: number;
  lockedUntil: DateTime | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Fund Model
```typescript
interface Fund {
  id: string;
  userId: string;
  name: string;
  domicile: string;
  vintage: number;
  manager: string;
  managerEmail: string | null;
  managerPhone: string | null;
  managerWebsite: string | null;
  commitment: number;
  paidIn: number;
  nav: number;
  irr: number;
  tvpi: number;
  dpi: number;
  lastReportDate: DateTime;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Document Model
```typescript
interface Document {
  id: string;
  fundId: string;
  type: "CAPITAL_CALL" | "QUARTERLY_REPORT" | "ANNUAL_REPORT" | "KYC" | "COMPLIANCE" | "OTHER";
  title: string;
  uploadDate: DateTime;
  dueDate: DateTime | null;
  callAmount: number | null;
  paymentStatus: "PENDING" | "PAID" | "LATE" | "OVERDUE" | null;
  url: string;
  parsedData: any | null;
  investmentValue: number | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Invitation Model
```typescript
interface Invitation {
  id: string;
  email: string;
  token: string;
  tokenHash: string | null;
  role: string;
  expiresAt: DateTime;
  usedAt: DateTime | null;
  used: boolean;
  invitedBy: string;
  createdAt: DateTime;
}
```

### Audit Log Model
```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string | null;
  description: string;
  oldValues: any | null;
  newValues: any | null;
  metadata: any | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: DateTime;
}
```

### Enums

```typescript
enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  DATA_MANAGER = "DATA_MANAGER"
}

enum DocumentType {
  CAPITAL_CALL = "CAPITAL_CALL",
  QUARTERLY_REPORT = "QUARTERLY_REPORT",
  ANNUAL_REPORT = "ANNUAL_REPORT",
  KYC = "KYC",
  COMPLIANCE = "COMPLIANCE",
  OTHER = "OTHER"
}

enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  LATE = "LATE",
  OVERDUE = "OVERDUE"
}

enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  UPLOAD = "UPLOAD",
  DOWNLOAD = "DOWNLOAD",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  RESET_PASSWORD = "RESET_PASSWORD",
  CHANGE_PASSWORD = "CHANGE_PASSWORD",
  GRANT_ACCESS = "GRANT_ACCESS",
  REVOKE_ACCESS = "REVOKE_ACCESS"
}

enum AuditResource {
  USER = "USER",
  FUND = "FUND",
  DOCUMENT = "DOCUMENT",
  CRYPTO_HOLDING = "CRYPTO_HOLDING",
  FUND_ACCESS = "FUND_ACCESS",
  INVITATION = "INVITATION",
  SYSTEM = "SYSTEM"
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message here"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### Example Error Responses

**Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**Missing Fields:**
```json
{
  "error": "Missing required fields (userId, name, domicile, vintage, manager are required)"
}
```

**Not Found:**
```json
{
  "error": "User not found"
}
```

**Already Exists:**
```json
{
  "error": "User with this email already exists"
}
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/onelp?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (for invitations)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourcompany.com"

# Optional: API Key for external apps
ADMIN_API_KEY="optional-api-key-for-external-apps"
```

### Example `.env.local` File

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/onelp_dev"

# Application
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-string"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-app@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@onelp.com"

# Development
NODE_ENV="development"
```

---

## CORS Configuration

If you're building a separate admin app, you'll need to configure CORS in `next.config.js`:

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3001' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ]
  },
}
```

---

## Example API Usage

### TypeScript/Fetch Example

```typescript
// lib/api-client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for authentication
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }
  
  return response.json()
}

// Get all users
export async function getUsers() {
  return fetchWithAuth('/api/admin/users')
}

// Create user invitation
export async function createInvitation(email: string) {
  return fetchWithAuth('/api/invitations', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

// Update user
export async function updateUser(userId: string, data: any) {
  return fetchWithAuth(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Create fund for user
export async function createFund(userId: string, fundData: any) {
  return fetchWithAuth(`/api/admin/users/${userId}/funds`, {
    method: 'POST',
    body: JSON.stringify(fundData),
  })
}

// Get audit logs
export async function getAuditLogs(filters: any) {
  const params = new URLSearchParams(filters)
  return fetchWithAuth(`/api/admin/audit-logs?${params}`)
}
```

### React Hook Example

```typescript
// hooks/useUsers.ts
import { useState, useEffect } from 'react'
import { getUsers } from '@/lib/api-client'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        const data = await getUsers()
        setUsers(data.users)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [])

  return { users, loading, error, refetch: () => fetchUsers() }
}
```

---

## Authentication Flow for External Apps

If you're building a separate admin app, you have two options:

### Option 1: Session-Based (Same Domain)
- Use NextAuth.js in both apps
- Sessions shared via cookies
- Both apps on same domain (e.g., `app.domain.com` and `admin.domain.com`)

### Option 2: API Key Authentication
Add API key authentication for external apps:

```typescript
// middleware.ts or create new api-auth.ts
export function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  return apiKey === process.env.ADMIN_API_KEY
}

// Then in your API routes:
export async function GET(request: NextRequest) {
  // Check API key or session
  const apiKey = request.headers.get('x-api-key')
  const hasValidApiKey = apiKey === process.env.ADMIN_API_KEY
  
  const session = await getServerSession(authOptions)
  
  if (!hasValidApiKey && (!session || session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // ... rest of handler
}
```

---

## Rate Limiting

The API implements rate limiting for certain operations:

- **Login Attempts**: 5 attempts, 15-minute lockout
- **Admin Actions**: Varies by endpoint
- **Security Endpoints**: 20 requests per minute
- **Data Cleanup**: 5 requests per 5 minutes

---

## Additional Notes

### Database
- Uses **PostgreSQL** with **Prisma ORM**
- Schema file: `prisma/schema.prisma`
- Seed file: `prisma/seed.ts`

### Deployment
- Can be deployed to **Vercel**, **Railway**, or any Node.js host
- Requires PostgreSQL database
- Environment variables must be configured

### Development
```bash
# Install dependencies
npm install

# Setup database
npm run db:push
npm run db:seed

# Run development server
npm run dev
# Opens on http://localhost:3000
```

---

## Support

For questions or issues:
- Check existing admin pages for reference: `src/app/admin/`
- Review Prisma schema: `prisma/schema.prisma`
- Check API route implementations: `src/app/api/`

---

**Last Updated**: January 2025  
**API Version**: 1.0

