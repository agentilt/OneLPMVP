# Admin API Endpoints - Complete Reference

## Overview

This document details all the API endpoints created for the new hierarchical admin workflow: **Client → Fund → Document**.

**Database**: PostgreSQL (Neon)  
**Authentication**: NextAuth with ADMIN role requirement  
**Pattern**: RESTful API routes in Next.js

---

## Table of Contents

1. [Client Management Endpoints](#client-management-endpoints)
2. [Fund Management Endpoints](#fund-management-endpoints)
3. [Document Management Endpoints](#document-management-endpoints)
4. [Prisma Schema Definitions](#prisma-schema-definitions)
5. [Data Models](#data-models)
6. [Migration Steps](#migration-steps)

---

## Client Management Endpoints

### 1. List All Clients
**GET** `/api/admin/clients`

**Query Parameters:**
- `q` (string, optional) - Search query (searches name and email)
- `page` (number, default: 1) - Page number
- `pageSize` (number, default: 20, max: 100) - Results per page

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "email": "string | null",
      "phone": "string | null",
      "address": "string | null",
      "notes": "string | null",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 0
}
```

**Authorization:** ADMIN role required

---

### 2. Get Single Client
**GET** `/api/admin/clients/[clientId]`

**Response:**
```json
{
  "data": {
    "id": "string",
    "name": "string",
    "email": "string | null",
    "phone": "string | null",
    "address": "string | null",
    "notes": "string | null",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Error Responses:**
- `404` - Client not found
- `401` - Unauthorized

---

### 3. Create Client
**POST** `/api/admin/clients`

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string | null",
  "phone": "string | null",
  "address": "string | null",
  "notes": "string | null"
}
```

**Response:**
```json
{
  "data": {
    "id": "string",
    "name": "string",
    "email": "string | null",
    "phone": "string | null",
    "address": "string | null",
    "notes": "string | null",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Status Code:** `201 Created`

**Error Responses:**
- `400` - Name is required
- `401` - Unauthorized

---

### 4. Update Client
**PUT** `/api/admin/clients/[clientId]`

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string | null",
  "phone": "string | null",
  "address": "string | null",
  "notes": "string | null"
}
```

**Response:**
```json
{
  "data": {
    "id": "string",
    "name": "string",
    "email": "string | null",
    "phone": "string | null",
    "address": "string | null",
    "notes": "string | null",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Error Responses:**
- `404` - Client not found
- `400` - Name is required
- `401` - Unauthorized

---

### 5. Delete Client
**DELETE** `/api/admin/clients/[clientId]`

**Response:**
```json
{
  "ok": true
}
```

**Error Responses:**
- `404` - Client not found
- `401` - Unauthorized

---

## Fund Management Endpoints

### 1. List Funds for a Client
**GET** `/api/admin/clients/[clientId]/funds`

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "userId": "string | null",
      "clientId": "string",
      "name": "string",
      "domicile": "string",
      "vintage": "number",
      "manager": "string",
      "managerEmail": "string | null",
      "managerPhone": "string | null",
      "managerWebsite": "string | null",
      "commitment": "number",
      "paidIn": "number",
      "nav": "number",
      "irr": "number",
      "tvpi": "number",
      "dpi": "number",
      "lastReportDate": "string",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

**Authorization:** ADMIN role required

---

### 2. Create Fund for a Client
**POST** `/api/admin/clients/[clientId]/funds`

**Request Body:**
```json
{
  "name": "string (required)",
  "domicile": "string",
  "vintage": "number",
  "manager": "string",
  "managerEmail": "string | null",
  "managerPhone": "string | null",
  "managerWebsite": "string | null",
  "commitment": "number (default: 0)",
  "paidIn": "number (default: 0)",
  "nav": "number (default: 0)",
  "irr": "number (default: 0)",
  "tvpi": "number (default: 0)",
  "dpi": "number (default: 0)",
  "lastReportDate": "string (ISO date) | null"
}
```

**Response:**
```json
{
  "data": {
    "id": "string",
    "userId": "string | null",
    "clientId": "string",
    "name": "string",
    "domicile": "string",
    "vintage": "number",
    "manager": "string",
    "managerEmail": "string | null",
    "managerPhone": "string | null",
    "managerWebsite": "string | null",
    "commitment": "number",
    "paidIn": "number",
    "nav": "number",
    "irr": "number",
    "tvpi": "number",
    "dpi": "number",
    "lastReportDate": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Status Code:** `201 Created`

**Error Responses:**
- `400` - Name is required
- `401` - Unauthorized

---

### 3. Get Single Fund
**GET** `/api/admin/clients/[clientId]/funds/[fundId]`

**Response:**
```json
{
  "data": {
    "id": "string",
    "userId": "string | null",
    "clientId": "string",
    "name": "string",
    "domicile": "string",
    "vintage": "number",
    "manager": "string",
    "managerEmail": "string | null",
    "managerPhone": "string | null",
    "managerWebsite": "string | null",
    "commitment": "number",
    "paidIn": "number",
    "nav": "number",
    "irr": "number",
    "tvpi": "number",
    "dpi": "number",
    "lastReportDate": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Error Responses:**
- `404` - Fund not found
- `401` - Unauthorized

---

### 4. Update Fund
**PUT** `/api/admin/clients/[clientId]/funds/[fundId]`

**Request Body:** (Same as Create Fund)
```json
{
  "name": "string",
  "domicile": "string",
  "vintage": "number",
  "manager": "string",
  "managerEmail": "string | null",
  "managerPhone": "string | null",
  "managerWebsite": "string | null",
  "commitment": "number",
  "paidIn": "number",
  "nav": "number",
  "irr": "number",
  "tvpi": "number",
  "dpi": "number",
  "lastReportDate": "string (ISO date) | null"
}
```

**Response:** (Same as Get Single Fund)

**Error Responses:**
- `404` - Fund not found
- `401` - Unauthorized

---

### 5. Delete Fund
**DELETE** `/api/admin/clients/[clientId]/funds/[fundId]`

**Response:**
```json
{
  "ok": true
}
```

**Error Responses:**
- `404` - Fund not found
- `401` - Unauthorized

---

## Document Management Endpoints

### 1. List Documents for a Fund
**GET** `/api/admin/clients/[clientId]/funds/[fundId]/documents`

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "fundId": "string",
      "type": "string",
      "title": "string",
      "uploadDate": "timestamp",
      "dueDate": "timestamp | null",
      "callAmount": "number | null",
      "paymentStatus": "string | null",
      "url": "string",
      "parsedData": "object | null",
      "investmentValue": "number | null",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

**Authorization:** ADMIN role required

---

### 2. Create Document for a Fund
**POST** `/api/admin/clients/[clientId]/funds/[fundId]/documents`

**Request Body:**
```json
{
  "type": "string (required)",
  "title": "string (required)",
  "url": "string (required)",
  "uploadDate": "string (ISO date, defaults to now)",
  "dueDate": "string (ISO date) | null",
  "callAmount": "number | null",
  "paymentStatus": "string | null",
  "parsedData": "object | null",
  "investmentValue": "number | null"
}
```

**Response:**
```json
{
  "data": {
    "id": "string",
    "fundId": "string",
    "type": "string",
    "title": "string",
    "uploadDate": "timestamp",
    "dueDate": "timestamp | null",
    "callAmount": "number | null",
    "paymentStatus": "string | null",
    "url": "string",
    "parsedData": "object | null",
    "investmentValue": "number | null",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Status Code:** `201 Created`

**Error Responses:**
- `400` - Type, title, and URL are required
- `404` - Fund not found
- `401` - Unauthorized

---

### 3. Get Single Document
**GET** `/api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId]`

**Response:** (Same as Document in List)

**Error Responses:**
- `404` - Document not found
- `401` - Unauthorized

---

### 4. Update Document
**PUT** `/api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId]`

**Request Body:** (Same as Create Document)

**Response:** (Same as Get Single Document)

**Error Responses:**
- `404` - Document not found
- `401` - Unauthorized

---

### 5. Delete Document
**DELETE** `/api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId]`

**Response:**
```json
{
  "ok": true
}
```

**Error Responses:**
- `404` - Document not found
- `401` - Unauthorized

---

## Prisma Schema Definitions

### Current Database Tables

Your database uses PostgreSQL with these table names (case-sensitive):
- `"Client"` - Client table
- `"Fund"` - Fund table  
- `"Document"` - Document table
- `"User"` - User/Account table

### Proposed Prisma Schema

If you want to migrate to Prisma ORM, here's the schema:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Client {
  id        String   @id @default(uuid())
  name      String
  email     String?
  phone     String?
  address   String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  accounts User[]
  funds    Fund[]

  @@map("Client")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String?
  firstName    String?
  lastName     String?
  password     String
  role         Role     @default(USER)
  emailVerified DateTime?
  resetToken   String?
  resetTokenExpiry DateTime?
  mfaEnabled   Boolean  @default(false)
  lastLoginAt  DateTime?
  loginAttempts Int    @default(0)
  lockedUntil   DateTime?
  clientId     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relationships
  client       Client?  @relation(fields: [clientId], references: [id])
  auditLogs    AuditLog[]
  cryptoHoldings CryptoHolding[]
  funds        Fund[]
  fundAccess   FundAccess[]
  invitations  Invitation[]
  passwordResets PasswordReset[]
  mfaTokens    MFAToken[]
  mfaSettings  MFASettings?
  sessions     UserSession[]
  securityEvents SecurityEvent[]

  @@map("User")
}

model Fund {
  id             String   @id @default(uuid())
  userId         String?
  clientId       String
  name           String
  domicile       String
  vintage        Int
  manager        String
  managerEmail   String?
  managerPhone   String?
  managerWebsite String?
  commitment     Float
  paidIn         Float
  nav            Float
  irr            Float
  tvpi           Float
  dpi            Float
  lastReportDate DateTime
  createdAt      DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relationships
  client      Client      @relation(fields: [clientId], references: [id])
  documents   Document[]
  fundAccess  FundAccess[]
  navHistory  NavHistory[]

  @@map("Fund")
}

model Document {
  id              String   @id @default(uuid())
  fundId          String
  type            String
  title           String
  uploadDate      DateTime
  dueDate         DateTime?
  callAmount      Float?
  paymentStatus   String?
  url             String
  parsedData      Json?
  investmentValue Float?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relationships
  fund            Fund     @relation(fields: [fundId], references: [id])

  @@map("Document")
}

// Add other existing models...
model AuditLog {
  id          String   @id @default(uuid())
  userId      String
  action      String
  resource    String
  resourceId  String?
  description String
  oldValues   Json?
  newValues   Json?
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  User User @relation(fields: [userId], references: [id])

  @@map("AuditLog")
}

model Invitation {
  id        String   @id @default(uuid())
  email     String
  token     String   @unique
  tokenHash String?
  role      String   @default("USER")
  expiresAt DateTime
  usedAt    DateTime?
  used      Boolean  @default(false)
  invitedBy String
  createdAt DateTime @default(now())

  User User @relation(fields: [invitedBy], references: [id])

  @@map("Invitation")
}

// Add remaining models...
enum Role {
  USER
  ADMIN
  DATA_MANAGER
}
```

---

## Data Models

### Client Model
```typescript
interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  accounts?: User[]
  funds?: Fund[]
}
```

### Fund Model
```typescript
interface Fund {
  id: string
  userId: string | null
  clientId: string
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
  client?: Client
}
```

### Document Model
```typescript
interface Document {
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
```

---

## Migration Steps

### Step 1: Create Client Table

Run the SQL migration:
```bash
# Execute this SQL on your Neon database
psql $DATABASE_URL < add-client-model.sql
```

Or manually run:
```sql
CREATE TABLE IF NOT EXISTS "Client" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE "Fund" ADD COLUMN IF NOT EXISTS "clientId" TEXT;

CREATE INDEX IF NOT EXISTS idx_user_client_id ON "User"("clientId");
CREATE INDEX IF NOT EXISTS idx_fund_client_id ON "Fund"("clientId");
```

### Step 2: Update Existing Data

If you have existing Funds, you'll need to associate them with Clients:
```sql
-- Create a default client for existing funds
INSERT INTO "Client" (id, name, "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Default Client', NOW(), NOW());

-- Associate existing funds with the default client
UPDATE "Fund" 
SET "clientId" = (SELECT id FROM "Client" WHERE name = 'Default Client')
WHERE "clientId" IS NULL;
```

### Step 3: Verify Endpoints

Test the endpoints:
```bash
# List clients
curl http://localhost:3000/api/admin/clients

# Create a client
curl -X POST http://localhost:3000/api/admin/clients \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Client","email":"test@example.com"}'

# List funds for a client
curl http://localhost:3000/api/admin/clients/[clientId]/funds
```

---

## File Structure

```
onelp-admin/
├── src/
│   └── app/
│       └── api/
│           └── admin/
│               ├── clients/
│               │   ├── route.ts                    # List/Create clients
│               │   └── [clientId]/
│               │       ├── route.ts                # Get/Update/Delete client
│               │       └── funds/
│               │           ├── route.ts            # List/Create funds
│               │           └── [fundId]/
│               │               ├── route.ts        # Get/Update/Delete fund
│               │               └── documents/
│               │                   ├── route.ts    # List/Create documents
│               │                   └── [documentId]/
│               │                       └── route.ts # Get/Update/Delete document
│               └── ... (other routes)
├── add-client-model.sql                            # Migration SQL
└── ADMIN_API_ENDPOINTS_COMPLETE.md                 # This file
```

---

## Authorization

All endpoints require:
1. Valid NextAuth session
2. User role must be `ADMIN`

The `requireAdmin` function checks:
```typescript
const token = await getToken({ req: nextReq, secret: process.env.NEXTAUTH_SECRET })
if (!token || token.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## Error Handling

Common error responses:

- **400 Bad Request** - Invalid input data
- **401 Unauthorized** - Missing or invalid authentication
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

All errors follow this format:
```json
{
  "error": "Error message"
}
```

---

## Testing

### Using cURL
```bash
# List clients
curl http://localhost:3000/api/admin/clients \
  -b "auth-cookie=your-session-cookie"

# Create a client
curl -X POST http://localhost:3000/api/admin/clients \
  -H "Content-Type: application/json" \
  -b "auth-cookie=your-session-cookie" \
  -d '{"name":"Acme Corp","email":"contact@acme.com"}'
```

### Using the Frontend

The frontend page at `/clients` uses the `useClients` hook:
```typescript
import { useClients } from '@/hooks/useClients'

const { data, isLoading, error } = useClients(page, pageSize, searchQuery)
```

---

**Last Updated:** January 2025  
**API Version:** 2.0 (Hierarchical Structure)

