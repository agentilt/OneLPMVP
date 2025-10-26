# Admin Frontend Setup Guide

This guide will help you set up a new admin frontend project to connect to your OneLPMVP backend.

## Quick Start

### 1. Create New Project

```bash
npx create-next-app@latest admin-dashboard --typescript --tailwind --app
cd admin-dashboard
```

### 2. Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-table
npm install axios class-variance-authority clsx tailwind-merge
npm install lucide-react date-fns
npm install @hookform/resolvers react-hook-form zod
```

### 3. Setup Environment

Create `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# If using API key authentication
NEXT_PUBLIC_API_KEY=your-api-key-here

# Session configuration (if using NextAuth)
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-here
```

### 4. Project Structure

```
admin-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/           # shadcn components
│   │   ├── DataTable.tsx
│   │   ├── UserTable.tsx
│   │   └── FundTable.tsx
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── utils.ts
│   │   └── types.ts
│   ├── hooks/
│   │   ├── useUsers.ts
│   │   ├── useFunds.ts
│   │   └── useAuth.ts
│   └── types/
│       └── index.ts
```

### 5. Create API Client

Create `src/lib/api-client.ts`:

```typescript
import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY
  if (apiKey) {
    config.headers['x-api-key'] = apiKey
  }
  return config
})

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API Methods
export const usersApi = {
  getAll: () => apiClient.get('/api/admin/users').then((res) => res.data),
  getById: (id: string) => apiClient.get(`/api/admin/users/${id}`).then((res) => res.data),
  update: (id: string, data: any) => apiClient.put(`/api/admin/users/${id}`, data).then((res) => res.data),
  delete: (id: string) => apiClient.delete(`/api/admin/users/${id}`).then((res) => res.data),
}

export const fundsApi = {
  list: () => apiClient.get('/api/admin/funds/list').then((res) => res.data),
  create: (userId: string, data: any) => 
    apiClient.post(`/api/admin/users/${userId}/funds`, data).then((res) => res.data),
  update: (userId: string, fundId: string, data: any) => 
    apiClient.put(`/api/admin/users/${userId}/funds/${fundId}`, data).then((res) => res.data),
  delete: (userId: string, fundId: string) => 
    apiClient.delete(`/api/admin/users/${userId}/funds/${fundId}`).then((res) => res.data),
}

export const invitationsApi = {
  getAll: () => apiClient.get('/api/invitations').then((res) => res.data),
  create: (email: string) => apiClient.post('/api/invitations', { email }).then((res) => res.data),
}

export const auditLogsApi = {
  get: (filters?: any) => apiClient.get('/api/admin/audit-logs', { params: filters }).then((res) => res.data),
}

export const documentsApi = {
  create: (data: any) => apiClient.post('/api/admin/documents', data).then((res) => res.data),
  getByFund: (userId: string, fundId: string) => 
    apiClient.get(`/api/admin/users/${userId}/funds/${fundId}/documents`).then((res) => res.data),
  delete: (userId: string, fundId: string, documentId: string) => 
    apiClient.delete(`/api/admin/users/${userId}/funds/${fundId}/documents?documentId=${documentId}`).then((res) => res.data),
}

export default apiClient
```

### 6. Create Type Definitions

Create `src/lib/types.ts`:

```typescript
export interface User {
  id: string
  email: string
  name: string | null
  firstName: string | null
  lastName: string | null
  role: 'USER' | 'ADMIN' | 'DATA_MANAGER'
  emailVerified: string | null
  lastLoginAt: string | null
  loginAttempts: number
  lockedUntil: string | null
  createdAt: string
  updatedAt: string
  funds?: Fund[]
}

export interface Fund {
  id: string
  userId: string
  name: string
  domicile: string
  vintage: number
  manager: string
  managerEmail: string | null
  managerPhone: string | null
  managerWebsite: string | null
  commitment: number
  paidIn: number
  nav: number
  irr: number
  tvpi: number
  dpi: number
  lastReportDate: string
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  fundId: string
  type: string
  title: string
  uploadDate: string
  dueDate: string | null
  callAmount: number | null
  paymentStatus: string | null
  url: string
  parsedData: any | null
  investmentValue: number | null
  createdAt: string
  updatedAt: string
}

export interface Invitation {
  id: string
  email: string
  token: string
  role: string
  expiresAt: string
  usedAt: string | null
  used: boolean
  invitedBy: string
  createdAt: string
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId: string | null
  description: string
  oldValues: any | null
  newValues: any | null
  metadata: any | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  User: User
}
```

### 7. Create React Hook

Create `src/hooks/useUsers.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api-client'
import { toast } from 'sonner'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user')
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    },
  })
}
```

### 8. Example User Table Component

Create `src/components/UserTable.tsx`:

```typescript
'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table'
import { useUsers, useDeleteUser } from '@/hooks/useUsers'
import { User } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
]

export function UserTable() {
  const { data, isLoading, error } = useUsers()
  const deleteUser = useDeleteUser()

  const table = useReactTable({
    data: data?.users || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading users</div>

  return (
    <div className="container mx-auto p-6">
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border p-2 text-left">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### 9. Configure Query Provider

Update `src/app/layout.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

const queryClient = new QueryClient()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

### 10. Add CORS to Backend

Update `next.config.js` in your backend project:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3001' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, x-api-key' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ]
  },
}
```

### 11. Run Projects

Terminal 1 (Backend):
```bash
cd OneLPMVP
npm run dev
# Running on http://localhost:3000
```

Terminal 2 (Admin Frontend):
```bash
cd admin-dashboard
npm run dev
# Running on http://localhost:3001
```

## Features to Build

1. **User Management**
   - List all users
   - View user details
   - Edit user information
   - Delete users
   - Invite new users

2. **Fund Management**
   - View all funds
   - Assign funds to users
   - Create/edit/delete funds
   - Fund metrics and analytics

3. **Document Management**
   - Upload documents
   - View documents by fund
   - Manage document metadata

4. **Audit Logs**
   - View activity logs
   - Filter by user, action, date
   - Export logs

5. **Analytics Dashboard**
   - User statistics
   - Fund performance
   - Document tracking

## Recommended UI Libraries

- **shadcn/ui** - Beautiful, accessible components
  ```bash
  npx shadcn-ui@latest init
  ```

- **TanStack Table** - Powerful data tables
- **Recharts** - Charts and graphs
- **Sonner** - Toast notifications

## Next Steps

1. Implement authentication (login/logout)
2. Create layout with sidebar navigation
3. Build user management page
4. Add fund management features
5. Implement document upload
6. Add analytics dashboard

## Troubleshooting

### CORS Issues
- Ensure CORS headers are configured in backend
- Check that `withCredentials: true` is set in axios

### Authentication Issues
- Verify cookies are being sent (check DevTools > Network)
- Ensure API key or session is valid

### API Errors
- Check browser console for detailed error messages
- Verify backend is running on correct port
- Check environment variables are set

## Resources

- **Backend API Docs**: See `BACKEND_API_REFERENCE.md`
- **Architecture Guide**: See `ADMIN_APP_ARCHITECTURE.md`
- **Prisma Schema**: See backend `prisma/schema.prisma`

---

Happy Building! 🚀

