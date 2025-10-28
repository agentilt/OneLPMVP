# API Quick Reference Card

## 🔐 Authentication

All endpoints require:
- NextAuth session cookie
- User role: `ADMIN`

---

## 📋 Endpoint Summary

### Clients
```
GET    /api/admin/clients                     # List all clients
POST   /api/admin/clients                     # Create client
GET    /api/admin/clients/[clientId]           # Get client
PUT    /api/admin/clients/[clientId]           # Update client
DELETE /api/admin/clients/[clientId]           # Delete client
```

### Funds (under Client)
```
GET    /api/admin/clients/[clientId]/funds                    # List funds
POST   /api/admin/clients/[clientId]/funds                    # Create fund
GET    /api/admin/clients/[clientId]/funds/[fundId]          # Get fund
PUT    /api/admin/clients/[clientId]/funds/[fundId]          # Update fund
DELETE /api/admin/clients/[clientId]/funds/[fundId]         # Delete fund
```

### Documents (under Fund)
```
GET    /api/admin/clients/[clientId]/funds/[fundId]/documents                    # List documents
POST   /api/admin/clients/[clientId]/funds/[fundId]/documents                    # Create document
GET    /api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId]      # Get document
PUT    /api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId]      # Update document
DELETE /api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId]      # Delete document
```

---

## 🗃️ Data Models

### Client
```typescript
{
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
```

### Fund
```typescript
{
  id: string
  clientId: string
  name: string
  domicile: string
  vintage: number
  manager: string
  managerEmail?: string
  managerPhone?: string
  managerWebsite?: string
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
```

### Document
```typescript
{
  id: string
  fundId: string
  type: string
  title: string
  uploadDate: string
  dueDate?: string
  callAmount?: number
  paymentStatus?: string
  url: string
  parsedData?: any
  investmentValue?: number
  createdAt: string
  updatedAt: string
}
```

---

## 📝 Create Examples

### Create Client
```bash
POST /api/admin/clients
{
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+1-555-0100",
  "address": "123 Main St"
}
```

### Create Fund
```bash
POST /api/admin/clients/[clientId]/funds
{
  "name": "Venture Fund I",
  "domicile": "Cayman Islands",
  "vintage": 2023,
  "manager": "Acme Capital",
  "commitment": 50000000,
  "paidIn": 10000000,
  "nav": 11000000
}
```

### Create Document
```bash
POST /api/admin/clients/[clientId]/funds/[fundId]/documents
{
  "type": "CAPITAL_CALL",
  "title": "Q1 2024 Capital Call",
  "url": "https://storage.example.com/documents/123.pdf",
  "callAmount": 5000000
}
```

---

## 🔍 Query Parameters

### List Clients
```
GET /api/admin/clients?q=acme&page=1&pageSize=20
```
- `q` - Search query (optional)
- `page` - Page number (default: 1)
- `pageSize` - Results per page (default: 20, max: 100)

---

## ⚠️ Error Codes

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not authenticated or not admin)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🗂️ Database Tables

- `"Client"` - Client organization table
- `"Fund"` - Investment fund table
- `"Document"` - Document table
- `"User"` - User account table

**Note:** Table names are case-sensitive and use PascalCase with quotes in SQL.

---

## 📄 Migration

Run the SQL migration:
```bash
psql $DATABASE_URL < add-client-model.sql
```

This creates:
1. `"Client"` table
2. Adds `clientId` to `"User"` table
3. Adds `clientId` to `"Fund"` table
4. Creates indexes

---

**For full documentation, see:** `ADMIN_API_ENDPOINTS_COMPLETE.md`

