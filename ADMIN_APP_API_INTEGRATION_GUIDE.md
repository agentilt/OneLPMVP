# Admin App API Integration Guide

## Overview

Your architecture:
```
Admin App (admin.onelp.capital)
  ↓ HTTP API calls
Main Backend (OneLPMVP) - THIS PROJECT
  ↓ Prisma
Neon PostgreSQL Database
```

## Current State

✅ **Backend (OneLPMVP) - COMPLETE**
- Created `/api/admin/clients` routes
- Uses Prisma ORM
- Requires ADMIN authentication
- Located in: `src/app/api/admin/clients/`

⚠️ **Admin App (admin.onelp.capital) - NEEDS UPDATE**
- Currently: Connects directly to Neon database with raw SQL
- Should be: Call backend API endpoints via HTTP

---

## What You Need to Do in the Admin App

### Step 1: Remove Direct Database Access

Remove direct Neon database connections from your admin app:

**❌ Don't do this anymore:**
```typescript
// Remove these types of calls:
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)
const result = await sql`SELECT * FROM "Client"`
```

### Step 2: Create API Client

Create an API client utility in your admin app:

```typescript
// src/lib/api-client.ts (in admin app)

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL // e.g., 'https://onelp.capital'
// Or for local dev: 'http://localhost:3000'

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}/api/admin/clients${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for NextAuth
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API request failed')
  }
  
  return response.json()
}

// Client Management
export async function getClients(searchParams?: { q?: string; page?: number; pageSize?: number }) {
  const params = new URLSearchParams()
  if (searchParams?.q) params.set('q', searchParams.q)
  if (searchParams?.page) params.set('page', searchParams.page.toString())
  if (searchParams?.pageSize) params.set('pageSize', searchParams.pageSize.toString())
  
  const query = params.toString()
  return apiCall(query ? `?${query}` : '')
}

export async function getClient(clientId: string) {
  return apiCall(`/${clientId}`)
}

export async function createClient(data: { name: string; email?: string; phone?: string; address?: string; notes?: string }) {
  return apiCall('', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateClient(clientId: string, data: any) {
  return apiCall(`/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteClient(clientId: string) {
  return apiCall(`/${clientId}`, {
    method: 'DELETE',
  })
}

// Fund Management
export async function getClientFunds(clientId: string) {
  return apiCall(`/${clientId}/funds`)
}

export async function getFund(clientId: string, fundId: string) {
  return apiCall(`/${clientId}/funds/${fundId}`)
}

export async function createFund(clientId: string, fundData: any) {
  return apiCall(`/${clientId}/funds`, {
    method: 'POST',
    body: JSON.stringify(fundData),
  })
}

export async function updateFund(clientId: string, fundId: string, fundData: any) {
  return apiCall(`/${clientId}/funds/${fundId}`, {
    method: 'PUT',
    body: JSON.stringify(fundData),
  })
}

export async function deleteFund(clientId: string, fundId: string) {
  return apiCall(`/${clientId}/funds/${fundId}`, {
    method: 'DELETE',
  })
}
```

### Step 3: Update Your Components

Replace direct database calls with API calls:

**❌ OLD WAY (Direct DB Access):**
```typescript
// In a component
const [clients, setClients] = useState([])

useEffect(() => {
  async function fetchClients() {
    const sql = neon(process.env.DATABASE_URL)
    const result = await sql`SELECT * FROM "Client"`
    setClients(result)
  }
  fetchClients()
}, [])
```

**✅ NEW WAY (API Calls):**
```typescript
// In a component
import { getClients, createClient } from '@/lib/api-client'

const [clients, setClients] = useState([])

useEffect(() => {
  async function fetchClients() {
    const result = await getClients()
    setClients(result.data)
  }
  fetchClients()
}, [])

async function handleCreateClient(data) {
  const result = await createClient(data)
  // Handle success
}
```

### Step 4: Handle Authentication

Since you're making cross-domain requests, you need to handle authentication properly:

**Option A: API Key Authentication**
1. In OneLPMVP backend: Create an API key endpoint
2. In Admin app: Store the API key and send it in headers

**Option B: Session Cookies**
1. Both apps share the same domain cookie
2. Use `credentials: 'include'` in fetch requests

**Option C: Bearer Token**
1. Admin app authenticates with OneLPMVP backend
2. Backend returns a JWT token
3. Admin app stores token and sends it in Authorization header

---

## API Endpoints Available

All endpoints require ADMIN role.

### Client Management

1. **List Clients**
   ```
   GET /api/admin/clients?q=search&page=1&pageSize=20
   Response: { data: Client[], page, pageSize, total }
   ```

2. **Get Client**
   ```
   GET /api/admin/clients/[clientId]
   Response: { data: Client }
   ```

3. **Create Client**
   ```
   POST /api/admin/clients
   Body: { name, email?, phone?, address?, notes? }
   Response: { data: Client } (201 Created)
   ```

4. **Update Client**
   ```
   PUT /api/admin/clients/[clientId]
   Body: { name, email?, phone?, address?, notes? }
   Response: { data: Client }
   ```

5. **Delete Client**
   ```
   DELETE /api/admin/clients/[clientId]
   Response: { ok: true }
   ```

### Fund Management

6. **List Funds for Client**
   ```
   GET /api/admin/clients/[clientId]/funds
   Response: { data: Fund[] }
   ```

7. **Get Fund**
   ```
   GET /api/admin/clients/[clientId]/funds/[fundId]
   Response: { data: Fund }
   ```

8. **Create Fund**
   ```
   POST /api/admin/clients/[clientId]/funds
   Body: { name, domicile, vintage, manager, managerEmail?, ... }
   Response: { data: Fund } (201 Created)
   ```

9. **Update Fund**
   ```
   PUT /api/admin/clients/[clientId]/funds/[fundId]
   Body: { name?, domicile?, ... }
   Response: { data: Fund }
   ```

10. **Delete Fund**
    ```
    DELETE /api/admin/clients/[clientId]/funds/[fundId]
    Response: { ok: true }
    ```

---

## Environment Variables

### In Admin App (admin.onelp.capital)

```env
NEXT_PUBLIC_API_BASE_URL=https://onelp.capital
# OR for production: https://onelp.capital
# OR for local dev: http://localhost:3000
```

### In Backend (OneLPMVP)

Already configured! Uses existing DATABASE_URL and NextAuth setup.

---

## Migration Checklist

### Backend (OneLPMVP) ✅
- [x] Add Client model to Prisma schema
- [x] Create database migration
- [x] Generate Prisma Client
- [x] Create API routes
- [x] Test endpoints

### Admin App (admin.onelp.capital) 📋
- [ ] Remove direct Neon DB connections
- [ ] Create API client utility
- [ ] Update components to use API calls
- [ ] Handle authentication (API key/token)
- [ ] Test integration
- [ ] Update environment variables

---

## Testing

### Test Backend API

```bash
# In OneLPMVP project
npm run dev

# In another terminal
curl http://localhost:3000/api/admin/clients
```

### Test from Admin App

```typescript
// In admin app
import { getClients } from '@/lib/api-client'

const result = await getClients({ page: 1, pageSize: 10 })
console.log(result.data) // Array of clients
```

---

## Troubleshooting

### CORS Issues
If you get CORS errors:
1. Check `next.config.js` in OneLPMVP for CORS settings
2. Ensure credentials are included in fetch requests

### Authentication Issues
- Verify admin session exists
- Check that user role is ADMIN
- Ensure cookies/headers are being sent

### Database Not Found Errors
- Run `npx prisma generate` in OneLPMVP
- Verify migration was applied: `npx prisma migrate deploy`

---

## Next Steps

1. **Test the backend API** - Verify all endpoints work
2. **Create API client** in admin app
3. **Update one component at a time** to use the API
4. **Handle authentication** properly
5. **Test end-to-end** flow

---

For questions or issues, refer to the ADMIN_API_ENDPOINTS_COMPLETE.md document for full API reference.

