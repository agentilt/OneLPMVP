# Admin App Architecture Guide

## Current Setup (OneLPMVP)

Your current project already has:
- ✅ Admin API endpoints at `src/app/api/admin/`
- ✅ Session-based authentication with role checks
- ✅ User management, fund management, document management
- ✅ Database shared with main app

## Decision: Where to Put Backend Endpoints?

### ✅ KEEP THEM IN THIS PROJECT

**Reasons:**
1. **Shared Database** - Both apps need the same Prisma schema
2. **Existing API** - You already have working admin endpoints
3. **Authentication** - Session management already set up
4. **Simplicity** - One deployment for backend logic

### Build New Admin App as Frontend-Only

The new admin app should be a **separate Next.js frontend** that:
- Calls your current project's API endpoints
- Uses API key or session-based authentication
- Focuses purely on user management UI
- Lives as a standalone app

## Recommended Architecture

```
┌─────────────────────────────────────┐
│   OneLPMVP (Current Project)       │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   API Endpoints               │ │
│  │   /api/admin/users            │ │
│  │   /api/admin/funds            │ │
│  │   /api/admin/documents        │ │
│  └───────────────────────────────┘ │
│           ↕ (REST API)              │
│  ┌───────────────────────────────┐ │
│  │   Database (Prisma)           │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
           ↕ (HTTP Requests)
┌─────────────────────────────────────┐
│   Admin App (New Project)           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Admin Dashboard UI          │ │
│  │   User Management UI         │ │
│  │   Data Grid, Filters, etc.   │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Implementation Steps

### 1. Enhance Your Current API (OneLPMVP)

Add these API endpoints if they don't exist:

```typescript
// src/app/api/admin/users/route.ts
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const users = await prisma.user.findMany({
    include: { funds: true }
  })
  
  return NextResponse.json({ users })
}

export async function POST() {
  // Create user
}

// src/app/api/admin/users/[id]/route.ts
export async function DELETE() {
  // Delete user
}

export async function PUT() {
  // Update user
}
```

### 2. Create New Admin App

```bash
npx create-next-app@latest admin-app --typescript --tailwind --app
cd admin-app
```

### 3. Set Up API Client

```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function fetchAdminUsers() {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: {
      'Authorization': `Bearer ${getApiToken()}` // Or session cookie
    }
  })
  return response.json()
}
```

### 4. Configure Environment

```bash
# admin-app/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
ADMIN_API_KEY=your-secret-key
```

## Alternative: API Key Authentication

If you want stricter control, add API key authentication:

```typescript
// src/middleware.ts or create src/lib/api-auth.ts
export function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  return apiKey === process.env.ADMIN_API_KEY
}
```

## Benefits of This Approach

✅ **Single Source of Truth** - Database and business logic in one place  
✅ **Reusable API** - Can be called from admin app, mobile app, etc.  
✅ **Clean Separation** - Admin app focuses on UI/UX  
✅ **Independent Deployments** - Update admin app without touching main app  
✅ **Shared Authentication** - Same auth system for both apps  

## Quick Start Commands

### Current Project (Keep as-is)
```bash
# Your existing project
cd OneLPMVP
npm run dev
# Running on localhost:3000
```

### New Admin App
```bash
# Create new admin app
npx create-next-app@latest admin-app
cd admin-app
npm install shadcn-ui @tanstack/react-query
# Implement admin UI
npm run dev
# Running on localhost:3001
```

## Recommended Tech Stack for Admin App

- **Next.js 15** - App Router
- **TypeScript** - Type safety
- **TanStack Table** - Data tables with sorting/filtering
- **shadcn/ui** - Beautiful UI components
- **React Query** - API state management
- **Lucide Icons** - Consistent iconography

## What You Should Build in Each

### Current Project (Backend)
- ✅ Keep all API endpoints
- ✅ Keep database access (Prisma)
- ✅ Keep authentication
- ✅ Add CORS if needed: `next.config.js`

### New Admin App (Frontend)
- ✅ User management UI
- ✅ Data grid with search/filter
- ✅ Bulk operations (select, delete, update)
- ✅ Import/Export functionality
- ✅ Analytics dashboard
- ✅ Audit log viewer

## Example: Enable CORS (Current Project)

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/admin/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3001' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

## Summary

**Answer: Keep backend endpoints in this project (OneLPMVP)** ✅

- Your existing admin API is already here
- Add any missing endpoints (user CRUD, etc.)
- Build a new admin app as a separate frontend
- The admin app calls your API endpoints
- You maintain one database and one API surface

This gives you the best of both worlds: **centralized backend** + **focused admin frontend**.

