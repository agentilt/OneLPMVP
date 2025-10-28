# Next Steps: Setting Up DATABASE_URL

## Current Status

✅ **Code changes are complete!**
- Schema updated with new `FundAccess` fields
- Migration file created
- API updated to accept new fields
- All backward compatible

⏳ **Waiting on:** Database connection setup

## Why You're Seeing This Error

The error `Environment variable not found: DATABASE_URL` means you need to configure your database connection before running the migration.

## Your Options

### Option 1: Set Up Local Database (Recommended for Development)

If you're working locally and need to test the changes:

1. **Install PostgreSQL locally** or use Docker:
   ```bash
   # Using Docker (recommended)
   docker run --name onelp-db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=onelp -p 5432:5432 -d postgres
   ```

2. **Create `.env.local` file** in project root:
   ```bash
   # .env.local
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/onelp"
   ```

3. **Run the migration:**
   ```bash
   npx prisma migrate dev
   ```

### Option 2: Use Neon Database (Production/Cloud)

If you're using Neon (serverless Postgres) for production:

1. **Get your Neon connection string** from your Neon dashboard
2. **Create `.env.local` file:**
   ```bash
   # .env.local
   DATABASE_URL="postgresql://user:password@your-neon-db.neon.tech/dbname?sslmode=require"
   ```

3. **Run the migration:**
   ```bash
   npx prisma migrate deploy
   ```

### Option 3: Skip for Now (Code Changes Are Ready)

If you're just reviewing the changes and don't need to test immediately:

✅ **The implementation is complete and ready**
- Schema changes are in `prisma/schema.prisma`
- Migration is ready at `prisma/migrations/20250122120000_enhance_fund_access/`
- API updates are done in `src/app/api/data-manager/fund-access/route.ts`

You can apply these changes to your database whenever you're ready!

## Quick Start Commands

Once you have `DATABASE_URL` set up:

```bash
# Apply the migration
npx prisma migrate dev

# Generate Prisma client with new types
npx prisma generate

# Start your application
npm run dev
```

## What the Migration Does

The migration adds these 3 fields to the `FundAccess` table:

```sql
ALTER TABLE "FundAccess" 
ADD COLUMN "relationshipType" TEXT,
ADD COLUMN "permissionLevel" TEXT DEFAULT 'READ_ONLY',
ADD COLUMN "notes" TEXT;

CREATE INDEX "FundAccess_relationshipType_idx" ON "FundAccess"("relationshipType");
```

**Impact:** Adds tracking for who is viewing funds (LP, ADVISOR, etc.) and what permissions they have.

**Risk:** ✅ None - all fields are optional and backward compatible.

## Summary

Your code is ready! You just need to:
1. Set up your database connection (`DATABASE_URL`)
2. Run the migration when you're ready
3. Test the new functionality

The migration is safe and can be run on your live database whenever you want.

