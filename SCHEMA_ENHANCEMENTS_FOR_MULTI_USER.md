# Multi-User Access Enhancements for OneLP

## Current Capabilities ✅

The current schema DOES support multiple users accessing the same fund data via the `FundAccess` model. Here's how it works:

### Example: LP and Advisor Accessing Same Fund

```
Scenario: ABC LP and their advisor both need access to Fund XYZ

1. LP User is created:
   - email: lp@abclp.com
   - role: USER
   - Fund "XYZ" is created with this user as owner (userId)

2. Advisor User is created:
   - email: advisor@wealth.com
   - role: USER
   
3. FundAccess record is created:
   - userId: advisor's id
   - fundId: Fund XYZ's id
   
Result: Both LP and advisor can log in separately and see the same fund data!
```

### Current FundAccess Model:
```prisma
model FundAccess {
  id        String   @id @default(cuid())
  userId    String   // User who gets access
  fundId    String   // Fund they can access
  createdAt DateTime @default(now())
  
  @@unique([userId, fundId])  // Prevents duplicate access
  @@index([userId])
  @@index([fundId])
}
```

---

## Recommended Enhancements 🔧

### Enhancement 1: Add Relationship Metadata to FundAccess

**Purpose**: Track the relationship type (LP, Advisor, Co-Investor, etc.)

```prisma
model FundAccess {
  id                String   @id @default(cuid())
  userId            String
  fundId            String
  createdAt         DateTime @default(now())
  
  // NEW FIELDS:
  relationshipType  String?  // "ADVISOR", "LP", "CO_INVESTOR", "INTERNAL_ADMIN", etc.
  permissionLevel   String?  // "READ_ONLY", "READ_WRITE", "ADMIN"
  notes             String?  // Optional notes about the access
  
  fund              Fund     @relation(fields: [fundId], references: [id], onDelete: Cascade)
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, fundId])
  @@index([userId])
  @@index([fundId])
  @@index([relationshipType])
}
```

**Migration SQL:**
```sql
ALTER TABLE "FundAccess" 
ADD COLUMN "relationshipType" TEXT,
ADD COLUMN "permissionLevel" TEXT,
ADD COLUMN "notes" TEXT;

CREATE INDEX "FundAccess_relationshipType_idx" ON "FundAccess"("relationshipType");
```

---

### Enhancement 2: Add Organization/Company Model

**Purpose**: Group users who belong to the same company/organization

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  type        String   // "LP", "GP", "ADVISOR", "FAMILY_OFFICE"
  email       String?
  phone       String?
  address     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       User[]
  funds       Fund[]
  
  @@index([name])
}

model User {
  // ... existing fields ...
  
  organizationId String?      // NEW
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  // ... rest of fields ...
}
```

**Benefits:**
- Group users from the same firm
- Track organizational relationships
- Enable company-wide features (billing, administration)
- Add structure to user management

---

### Enhancement 3: Expand Role Enum

**Purpose**: Support advisor-specific roles

```prisma
enum Role {
  USER
  ADMIN
  DATA_MANAGER
  ADVISOR        // NEW
  ADVISOR_ADMIN  // NEW
  LP_USER        // NEW
  GP_USER        // NEW
}
```

**Or use a more flexible approach:**

```prisma
model User {
  // ... existing fields ...
  
  // NEW: Add specialized roles
  userType      String?  // "INDIVIDUAL_LP", "INSTITUTIONAL_LP", "ADVISOR", "GP", "FAMILY_OFFICE"
  specialty     String?  // "PRIVATE_EQUITY", "Venture_Capital", "REAL_ESTATE", etc.
  
  // ... rest of fields ...
}
```

---

### Enhancement 4: Add User-to-User Relationships

**Purpose**: Track advisor-advisor relationships (if advisor manages advisors)

```prisma
model UserRelationship {
  id          String   @id @default(cuid())
  fromUserId  String
  toUserId    String
  type        String   // "MANAGED_BY", "MANAGES", "COLLABORATOR"
  notes       String?
  createdAt   DateTime @default(now())
  
  fromUser    User     @relation("UserRelationshipsFrom", fields: [fromUserId], references: [id])
  toUser      User     @relation("UserRelationshipsTo", fields: [toUserId], references: [id])
  
  @@unique([fromUserId, toUserId, type])
  @@index([fromUserId])
  @@index([toUserId])
}

model User {
  // ... existing fields ...
  
  managedBy   UserRelationship[] @relation("UserRelationshipsFrom")
  manages     UserRelationship[] @relation("UserRelationshipsTo")
  
  // ... rest of fields ...
}
```

---

## Implementation Priority

### Phase 1: Quick Wins (High Impact, Low Effort)
1. ✅ **FundAccess.relationshipType** - Track advisor vs LP access
2. ✅ **FundAccess.permissionLevel** - Control access levels
3. Add these fields via migration

### Phase 2: Organizational Structure
1. Add `Organization` model
2. Link users to organizations
3. Enable org-level features

### Phase 3: Advanced Features
1. User relationship tracking
2. Extended role system
3. Hierarchical permissions

---

## Current Workarounds (Without Schema Changes)

### Workaround 1: Use Metadata Fields
Store relationship info in JSON fields:
- Fund table could have `metadata Json?` field
- Store organizational info there

### Workaround 2: Naming Conventions
Use email/username patterns:
- `lp@client.com`
- `advisor@client.com`

### Workaround 3: Custom Fields
The User table has some flexibility:
- Use `name`, `firstName`, `lastName` to indicate role
- Or store JSON in a generic field

---

## Recommended Database Migrations

### Migration 1: FundAccess Enhancements

Create file: `prisma/migrations/[timestamp]_enhance_fund_access/migration.sql`

```sql
-- Add new columns to FundAccess
ALTER TABLE "FundAccess" 
ADD COLUMN "relationshipType" TEXT,
ADD COLUMN "permissionLevel" TEXT DEFAULT 'READ_ONLY',
ADD COLUMN "notes" TEXT;

-- Add index for relationshipType
CREATE INDEX "FundAccess_relationshipType_idx" ON "FundAccess"("relationshipType");
```

### Migration 2: Organization Support

Create file: `prisma/migrations/[timestamp]_add_organizations/migration.sql`

```sql
-- Create Organization table
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Organization_name_idx" ON "Organization"("name");

-- Add organizationId to User
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;

-- Add foreign key
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- Add organizationId to Fund
ALTER TABLE "Fund" ADD COLUMN "organizationId" TEXT;

-- Add foreign key
ALTER TABLE "Fund" ADD CONSTRAINT "Fund_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Fund_organizationId_idx" ON "Fund"("organizationId");
```

---

## Admin UI Considerations

### User Management Screen
- Show each user's associated organization
- Display relationship type for fund access
- Filter by organization
- Bulk operations per organization

### Fund Access Management
- Visualize who has access to each fund
- Show relationship types (LP vs Advisor)
- Manage permission levels
- Track access history

### Analytics Dashboard
- Funds per organization
- Users per organization
- Advisor vs LP access patterns
- Access audit trails

---

## Conclusion

**Current State**: ✅ Supports multiple users, same data (via FundAccess)

**What's Missing**: 
- Relationship tracking
- Organizational grouping
- Permission levels
- User-type distinctions

**Recommendation**: Start with Enhancement 1 (add metadata to FundAccess) - it's the simplest change with immediate value for your use case.

