# Fund Access Enhancements - Implementation Guide

## What Was Changed

### 1. Schema Updates (✅ COMPLETED)

**File: `prisma/schema.prisma`**

Enhanced the `FundAccess` model with three new fields:

```prisma
model FundAccess {
  id               String   @id @default(cuid())
  userId           String
  fundId           String
  relationshipType String?  // NEW: "ADVISOR", "LP", "CO_INVESTOR", "INTERNAL_ADMIN"
  permissionLevel  String?  @default("READ_ONLY") // NEW: "READ_ONLY", "READ_WRITE", "ADMIN"
  notes            String?   // NEW: Optional notes
  createdAt        DateTime @default(now())
  fund             Fund     @relation(fields: [fundId], references: [id], onDelete: Cascade)
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, fundId])
  @@index([userId])
  @@index([fundId])
  @@index([relationshipType]) // NEW: Index for relationship filtering
}
```

### 2. Migration Created (✅ COMPLETED)

**File: `prisma/migrations/20250122120000_enhance_fund_access/migration.sql`**

```sql
-- AlterTable
ALTER TABLE "FundAccess" 
ADD COLUMN "relationshipType" TEXT,
ADD COLUMN "permissionLevel" TEXT DEFAULT 'READ_ONLY',
ADD COLUMN "notes" TEXT;

-- CreateIndex
CREATE INDEX "FundAccess_relationshipType_idx" ON "FundAccess"("relationshipType");
```

### 3. API Updates (✅ COMPLETED)

**File: `src/app/api/data-manager/fund-access/route.ts`**

Updated the POST endpoint to accept the new fields:

```typescript
const { userId, fundId, relationshipType, permissionLevel, notes } = body

// Create fund access
const fundAccess = await prisma.fundAccess.create({
  data: {
    userId,
    fundId,
    relationshipType,
    permissionLevel: permissionLevel || 'READ_ONLY',
    notes,
  },
  // ...
})
```

---

## How to Apply Changes

### Step 1: Apply the Migration

You need to run the migration to add the new fields to your database:

```bash
# For local development
npx prisma migrate dev

# For production (apply existing migrations)
npx prisma migrate deploy

# Or to push schema changes directly (development only)
npx prisma db push
```

### Step 2: Regenerate Prisma Client

After running the migration:

```bash
npx prisma generate
```

### Step 3: Restart Your Application

```bash
npm run dev
```

---

## Usage Examples

### Creating Fund Access with New Fields

**API Endpoint:** `POST /api/data-manager/fund-access`

**Request Body:**
```json
{
  "userId": "user-123",
  "fundId": "fund-456",
  "relationshipType": "ADVISOR",
  "permissionLevel": "READ_ONLY",
  "notes": "User's financial advisor viewing fund data"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/data-manager/fund-access \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user-123",
    "fundId": "fund-456",
    "relationshipType": "ADVISOR",
    "permissionLevel": "READ_ONLY",
    "notes": "User advisor access"
  }'
```

### Querying Fund Access with New Fields

```typescript
// Get all fund access with relationship types
const fundAccesses = await prisma.fundAccess.findMany({
  where: {
    fundId: 'fund-456',
  },
  include: {
    user: {
      select: {
        id: true,
        email: true,
        name: true,
      },
    },
  },
})

// Filter by relationship type
const advisors = await prisma.fundAccess.findMany({
  where: {
    relationshipType: 'ADVISOR',
  },
})

// Filter by permission level
const readOnlyUsers = await prisma.fundAccess.findMany({
  where: {
    permissionLevel: 'READ_ONLY',
  },
})
```

---

## Field Definitions

### relationshipType

**Purpose:** Describes the relationship between the user and the fund.

**Valid Values:**
- `"LP"` - Limited Partner
- `"ADVISOR"` - Financial advisor or wealth manager
- `"CO_INVESTOR"` - Co-investor or co-LP
- `"INTERNAL_ADMIN"` - Internal administrator
- `null` - No specific relationship defined

**Example Use Cases:**
- LP sharing data with their financial advisor
- Multiple LPs viewing the same fund (co-investment)
- Internal administrators managing fund data

### permissionLevel

**Purpose:** Defines what actions the user can perform on the fund.

**Valid Values:**
- `"READ_ONLY"` - View only, no modifications allowed (default)
- `"READ_WRITE"` - Can view and make some modifications
- `"ADMIN"` - Full administrative access

**Security Note:** This is metadata for tracking purposes. Actual permissions should be enforced at the API level based on user roles and access records.

### notes

**Purpose:** Optional free-text field for additional context.

**Example Use Cases:**
- "Primary financial advisor for ABC LP"
- "Access granted for Q4 2024 reporting period"
- "Temporary access for due diligence"

---

## Admin UI Considerations

### Display Enhancement Ideas

1. **Relationship Type Column**
   - Add badge/chip showing relationship type
   - Color-coded: ADVISOR (blue), LP (green), CO_INVESTOR (orange)

2. **Permission Level Indicator**
   - Lock icon for READ_ONLY
   - Edit icon for READ_WRITE
   - Crown icon for ADMIN

3. **Access Management Form**
   - Dropdown for relationship type
   - Radio buttons for permission level
   - Textarea for notes

4. **Filtering & Sorting**
   - Filter by relationship type
   - Filter by permission level
   - Sort by creation date

### Example UI Component

```tsx
<FundAccessRow
  user={access.user}
  relationshipType={access.relationshipType}
  permissionLevel={access.permissionLevel}
  notes={access.notes}
  createdAt={access.createdAt}
/>

// Display:
// LP: John Doe (ADVISOR) - READ_ONLY 🔒
// Advisor: Jane Smith (ADVISOR) - READ_ONLY 🔒  
// Notes: "Primary financial advisor"
```

---

## Testing

### Test Cases

1. **Create Fund Access with All Fields**
   ```typescript
   await prisma.fundAccess.create({
     data: {
       userId: 'user-123',
       fundId: 'fund-456',
       relationshipType: 'ADVISOR',
       permissionLevel: 'READ_ONLY',
       notes: 'Test access',
     },
   })
   ```

2. **Create Fund Access with Minimal Fields** (backward compatible)
   ```typescript
   await prisma.fundAccess.create({
     data: {
       userId: 'user-123',
       fundId: 'fund-456',
     },
   })
   ```

3. **Query by Relationship Type**
   ```typescript
   const advisors = await prisma.fundAccess.findMany({
     where: { relationshipType: 'ADVISOR' },
   })
   ```

4. **Update Access**
   ```typescript
   await prisma.fundAccess.update({
     where: { id: 'access-123' },
     data: {
       relationshipType: 'LP',
       notes: 'Changed to LP status',
     },
   })
   ```

---

## Migration Notes

### Existing Data

- All existing `FundAccess` records will have:
  - `relationshipType`: `null`
  - `permissionLevel`: `"READ_ONLY"` (from default)
  - `notes`: `null`

### Backward Compatibility

✅ **The changes are fully backward compatible:**
- API accepts requests without new fields
- New fields are all optional
- Default values ensure existing code continues to work

---

## Next Steps (Optional Enhancements)

### 1. Add RelationshipType Enum

```prisma
enum RelationshipType {
  LP
  ADVISOR
  CO_INVESTOR
  INTERNAL_ADMIN
}

model FundAccess {
  relationshipType RelationshipType?
  // ...
}
```

### 2. Add PermissionLevel Enum

```prisma
enum PermissionLevel {
  READ_ONLY
  READ_WRITE
  ADMIN
}

model FundAccess {
  permissionLevel PermissionLevel @default(READ_ONLY)
  // ...
}
```

### 3. Add API Endpoints for Relationships

```typescript
// GET /api/admin/funds/:id/access
// Returns all users with access, including relationship types

// PUT /api/admin/fund-access/:id
// Update relationship type and permissions

// GET /api/admin/users/:id/relationships
// Get all fund relationships for a user
```

---

## Summary

✅ Schema updated with new fields  
✅ Migration file created  
✅ API endpoint updated  
⏳ Database migration pending (run `npx prisma migrate dev`)  
⏳ Frontend updates needed (optional)

**Impact:** None - fully backward compatible  
**Risk:** Low - all new fields are optional  
**Value:** High - enables proper multi-user relationship tracking

