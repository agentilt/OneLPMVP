# Admin Frontend Quick Reference

## API Endpoints Cheatsheet

### User Management
```typescript
GET    /api/admin/users                    // List all users
GET    /api/admin/users/[id]                // Get user by ID  
PUT    /api/admin/users/[id]                // Update user
DELETE /api/admin/users/[id]                // Delete user
```

### Fund Management
```typescript
GET    /api/admin/funds/list                // List all funds
POST   /api/admin/users/[id]/funds          // Create fund for user
PUT    /api/admin/users/[id]/funds/[fundId] // Update fund
DELETE /api/admin/users/[id]/funds/[fundId] // Delete fund
```

### Document Management
```typescript
POST   /api/admin/documents                             // Create document
GET    /api/admin/users/[id]/funds/[fundId]/documents   // Get fund documents
POST   /api/admin/users/[id]/funds/[fundId]/documents  // Create document for fund
DELETE /api/admin/users/[id]/funds/[fundId]/documents  // Delete document
```

### Invitations
```typescript
GET    /api/invitations                    // List all invitations
POST   /api/invitations                   // Create invitation
GET    /api/invitations/validate?token=   // Validate token
```

### Audit & Security
```typescript
GET    /api/admin/audit-logs              // Get audit logs
GET    /api/admin/security                 // Get security metrics
POST   /api/admin/security                // Cleanup security data
```

## TypeScript Types

```typescript
// User
interface User {
  id: string
  email: string
  name: string | null
  role: 'USER' | 'ADMIN' | 'DATA_MANAGER'
  createdAt: string
  funds: Fund[]
}

// Fund
interface Fund {
  id: string
  userId: string
  name: string
  domicile: string
  vintage: number
  manager: string
  commitment: number
  paidIn: number
  nav: number
  tvpi: number
  dpi: number
}

// Document
interface Document {
  id: string
  fundId: string
  type: string
  title: string
  url: string
  uploadDate: string
  dueDate: string | null
  paymentStatus: string | null
}
```

## Common Patterns

### Fetch with Auth
```typescript
const response = await fetch('http://localhost:3000/api/admin/users', {
  credentials: 'include', // Important for cookies
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.NEXT_PUBLIC_API_KEY, // Optional
  },
})
```

### Using TanStack Query
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const res = await fetch('/api/admin/users', { credentials: 'include' })
    return res.json()
  },
})
```

### Error Handling
```typescript
try {
  const data = await api.post('/endpoint', payload)
  toast.success('Success!')
} catch (error: any) {
  toast.error(error.response?.data?.error || 'Error occurred')
}
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=your-key-here
NEXTAUTH_URL=http://localhost:3001
```

## Common Errors

| Status | Meaning | Fix |
|--------|---------|-----|
| 401 | Unauthorized | Check authentication headers/cookies |
| 403 | Forbidden | User doesn't have required role |
| 400 | Bad Request | Missing or invalid parameters |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Check backend logs |

## Quick Copy-Paste Components

### Loading State
```typescript
{isLoading && <div className="text-center py-8">Loading...</div>}
```

### Error State
```typescript
{error && <div className="text-red-500">{error.message}</div>}
```

### Table Row
```typescript
{data?.users.map((user) => (
  <tr key={user.id}>
    <td>{user.email}</td>
    <td>{user.name}</td>
    <td>{user.role}</td>
  </tr>
))}
```

### Form Submit
```typescript
const handleSubmit = async (e) => {
  e.preventDefault()
  try {
    await createUser(formData)
    toast.success('User created!')
  } catch (error) {
    toast.error('Failed to create user')
  }
}
```

## API Response Formats

### Success
```json
{
  "success": true,
  "data": { /* object */ }
}
```

### Error
```json
{
  "error": "Error message"
}
```

### Paginated
```json
{
  "items": [ /* array */ ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

## Backend Configuration

### Enable CORS
```javascript
// next.config.js
async headers() {
  return [{
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3001' },
      { key: 'Access-Control-Allow-Credentials', value: 'true' },
    ],
  }]
}
```

### Check Running Ports
```bash
# Backend should be on 3000
# Frontend should be on 3001
lsof -ti:3000,3001
```

## Quick Debug Checklist

- [ ] Backend running on port 3000?
- [ ] Frontend running on port 3001?
- [ ] CORS configured in backend?
- [ ] Environment variables set?
- [ ] Cookies enabled in browser?
- [ ] API key set (if using)?
- [ ] Console shows errors?

## Common Commands

```bash
# Install dependencies
npm install

# Run development
npm run dev

# Type checking
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

---

**See also:**
- `BACKEND_API_REFERENCE.md` - Full API documentation
- `ADMIN_FRONTEND_SETUP.md` - Setup guide
- `ADMIN_APP_ARCHITECTURE.md` - Architecture overview

