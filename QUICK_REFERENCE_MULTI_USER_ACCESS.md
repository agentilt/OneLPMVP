# Multi-User Access Quick Reference

## One-Line Summary
**LP and advisor can now both have separate logins to view the same fund data, with relationship tracking.**

---

## Database Schema

```prisma
model FundAccess {
  id               String   @id
  userId           String
  fundId           String
  relationshipType String?  // NEW: Who is this user (ADVISOR, LP, etc.)
  permissionLevel  String?  @default("READ_ONLY")  // NEW: What can they do
  notes            String?  // NEW: Optional context
  createdAt        DateTime @default(now())
  
  @@unique([userId, fundId])
}
```

---

## Usage Example

```typescript
// Grant advisor access to LP's fund
await prisma.fundAccess.create({
  data: {
    userId: 'advisor-123',
    fundId: 'lp-fund-456',
    relationshipType: 'ADVISOR',
    permissionLevel: 'READ_ONLY',
    notes: 'LP advisor viewing fund performance'
  }
})
```

---

## Relationship Types

| Value | Description |
|-------|-------------|
| `"LP"` | Limited Partner (fund owner) |
| `"ADVISOR"` | Financial advisor or wealth manager |
| `"CO_INVESTOR"` | Co-investor or co-LP |
| `"INTERNAL_ADMIN"` | Internal administrator |
| `null` | Not specified |

---

## Permission Levels

| Value | Description |
|-------|-------------|
| `"READ_ONLY"` | View only (default) |
| `"READ_WRITE"` | Can view and modify |
| `"ADMIN"` | Full access |

---

## API Endpoint

```
POST /api/data-manager/fund-access

Body:
{
  "userId": "user-id",
  "fundId": "fund-id",
  "relationshipType": "ADVISOR",  // optional
  "permissionLevel": "READ_ONLY",  // optional
  "notes": "optional notes"         // optional
}
```

---

## Common Queries

```typescript
// Get all advisors for a fund
const advisors = await prisma.fundAccess.findMany({
  where: {
    fundId: 'fund-123',
    relationshipType: 'ADVISOR',
  },
  include: { user: true }
})

// Get all funds for a user (including via FundAccess)
const funds = await prisma.fund.findMany({
  where: {
    OR: [
      { userId: 'user-123' },  // Owned funds
      { fundAccess: { some: { userId: 'user-123' } } }  // Accessed funds
    ]
  }
})
```

---

## Files Changed

- ✅ `prisma/schema.prisma` - Added 3 fields to FundAccess
- ✅ `prisma/migrations/20250122120000_enhance_fund_access/migration.sql`
- ✅ `src/app/api/data-manager/fund-access/route.ts`

---

## To Apply

```bash
npx prisma migrate dev
npx prisma generate
npm run dev
```

---

## Status

✅ Schema updated  
✅ Migration created  
✅ API updated  
⏳ Run migration when ready  
⏳ Frontend UI updates (optional)

