# Client API Setup - Complete

## Summary

I've successfully set up the Client management system for your admin API. Here's what was implemented:

## Changes Made

### 1. Database Schema Updates

**File:** `prisma/schema.prisma`

Added the `Client` model:
```prisma
model Client {
  id        String   @id @default(cuid())
  name      String
  email     String?
  phone     String?
  address   String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  funds     Fund[]

  @@index([name])
  @@index([email])
}
```

Updated the `Fund` model to support both `userId` and `clientId`:
```prisma
model Fund {
  id             String       @id @default(cuid())
  userId         String?       // Now optional
  clientId       String?       // New field
  // ... rest of fields
  client         Client?      @relation(...)
}
```

### 2. Database Migration

**File:** `prisma/migrations/20251028204957_add_client_model/migration.sql`

- Created `Client` table
- Added `clientId` column to `Fund` table
- Created indexes for performance
- Added foreign key constraint

The migration has been applied successfully to your Neon PostgreSQL database.

### 3. API Routes Created

All routes require ADMIN authentication:

#### Client Management

1. **`GET /api/admin/clients`** - List all clients
   - Query params: `q` (search), `page`, `pageSize`
   - Returns: `{ data: Client[], page: number, pageSize: number, total: number }`

2. **`POST /api/admin/clients`** - Create a client
   - Body: `{ name, email?, phone?, address?, notes? }`
   - Returns: `{ data: Client }` (201 Created)

3. **`GET /api/admin/clients/[clientId]`** - Get single client
   - Returns: `{ data: Client }`

4. **`PUT /api/admin/clients/[clientId]`** - Update client
   - Body: `{ name, email?, phone?, address?, notes? }`
   - Returns: `{ data: Client }`

5. **`DELETE /api/admin/clients/[clientId]`** - Delete client
   - Returns: `{ ok: true }`

#### Fund Management (Client-scoped)

6. **`GET /api/admin/clients/[clientId]/funds`** - List funds for a client
   - Returns: `{ data: Fund[] }`

7. **`POST /api/admin/clients/[clientId]/funds`** - Create fund for a client
   - Body: `{ name, domicile, vintage, manager, managerEmail?, managerPhone?, managerWebsite?, commitment?, paidIn?, nav?, irr?, tvpi?, dpi?, lastReportDate? }`
   - Returns: `{ data: Fund }` (201 Created)

8. **`GET /api/admin/clients/[clientId]/funds/[fundId]`** - Get single fund
   - Returns: `{ data: Fund }`

9. **`PUT /api/admin/clients/[clientId]/funds/[fundId]`** - Update fund
   - Body: Same as POST
   - Returns: `{ data: Fund }`

10. **`DELETE /api/admin/clients/[clientId]/funds/[fundId]`** - Delete fund
    - Returns: `{ ok: true }`

### 4. Files Created

```
src/app/api/admin/clients/
├── route.ts                              # List & Create clients
└── [clientId]/
    ├── route.ts                          # Get, Update, Delete client
    └── funds/
        ├── route.ts                      # List & Create funds
        └── [fundId]/
            └── route.ts                  # Get, Update, Delete fund
```

## How to Test

### 1. Start your development server:

```bash
npm run dev
```

### 2. Test with cURL (after logging in as admin):

```bash
# List all clients
curl http://localhost:3000/api/admin/clients \
  -b cookies.txt

# Create a client
curl -X POST http://localhost:3000/api/admin/clients \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-0100"
  }'

# Get client by ID (replace CLIENT_ID)
curl http://localhost:3000/api/admin/clients/CLIENT_ID \
  -b cookies.txt

# Create a fund for a client (replace CLIENT_ID)
curl -X POST http://localhost:3000/api/admin/clients/CLIENT_ID/funds \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Acme Growth Fund",
    "domicile": "Cayman Islands",
    "vintage": 2024,
    "manager": "Acme Capital Management",
    "commitment": 1000000
  }'
```

### 3. Test in Browser

1. Navigate to `http://localhost:3000`
2. Log in as an admin user
3. Visit `http://localhost:3000/api/admin/clients`

## Authentication

All endpoints require:
- Valid NextAuth session
- User role: `ADMIN`

The API uses the same authentication pattern as your existing admin endpoints (`getServerSession` with `authOptions`).

## Next Steps

1. **Optional:** Create document management endpoints under funds:
   - `/api/admin/clients/[clientId]/funds/[fundId]/documents`
   
2. **Optional:** Migrate existing funds to associate them with clients using the `clientId` field

3. **Optional:** Update frontend to use the new client-based API structure

## Important Notes

- The `Fund` model now has both `userId` and `clientId` as optional fields
- Existing funds with only `userId` will continue to work
- The new Client-based structure is hierarchical: **Client → Fund → Document**
- All funds created through the client API will automatically be associated with the client

## Schema Reference

For the complete schema documentation, see:
- `ADMIN_API_ENDPOINTS_COMPLETE.md` - Full API reference
- `NEON_DB_SCHEMA_COMPLETE.md` - Database schema details

