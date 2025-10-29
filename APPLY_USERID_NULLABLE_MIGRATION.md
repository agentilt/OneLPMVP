# Apply Fund.userId Nullable Migration

## Issue
The database has a NOT NULL constraint on `Fund.userId`, but the Prisma schema already has it as optional. When creating funds via the Client → Fund route, we don't set userId, causing a constraint violation.

## Solution
The migration file is ready at:
```
prisma/migrations/20251029200000_make_fund_userid_nullable/migration.sql
```

## Apply to Production Database

### Option 1: Using Prisma Migrate Deploy (Recommended)

```bash
# Set your production DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:npg_rVqMblS9Jm3v@ep-lucky-poetry-adfr9ux6-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# Apply the migration
npx prisma migrate deploy
```

### Option 2: Apply SQL Directly

Run this SQL in your Neon database console:

```sql
ALTER TABLE "Fund" ALTER COLUMN "userId" DROP NOT NULL;
```

## Verify

After applying, you can verify:

```sql
-- Check column is nullable
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Fund' AND column_name = 'userId';
-- Should show: is_nullable = 'YES'
```

## What This Does

- Makes `Fund.userId` nullable in the database
- Allows funds to be created without a userId (when using Client → Fund hierarchy)
- Existing funds with userId remain unchanged
- Schema and database are now in sync

## After Applying

1. ✅ Redeploy your backend (Vercel will auto-redeploy if connected to git)
2. ✅ Test creating a fund via `/api/admin/clients/[clientId]/funds`
3. ✅ Should now return 201 with the created fund

