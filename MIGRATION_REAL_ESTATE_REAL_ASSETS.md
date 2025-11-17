# Migration Guide: Separate Real Estate and Real Assets

## Overview
This migration separates Real Estate and Real Assets into distinct investment types and adds the necessary database columns.

## Database Migration

### Option 1: Using Prisma Migrate (Recommended)
If you have database access, run:
```bash
npx prisma migrate dev --name separate_real_estate_and_real_assets
```

### Option 2: Manual SQL Migration
If you need to apply the migration manually to production, use the SQL file:
```bash
# Connect to your production database and run:
psql $DATABASE_URL -f migrations/add_real_estate_and_real_assets_separation.sql
```

Or apply the SQL directly in your database console:

```sql
-- Step 1: Add REAL_ESTATE to the enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'REAL_ESTATE' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'DirectInvestmentType')
    ) THEN
        ALTER TYPE "DirectInvestmentType" ADD VALUE 'REAL_ESTATE';
    END IF;
END $$;

-- Step 2: Add Real Assets specific fields to DirectInvestment table
ALTER TABLE "DirectInvestment" 
ADD COLUMN IF NOT EXISTS "assetType" TEXT,
ADD COLUMN IF NOT EXISTS "assetDescription" TEXT,
ADD COLUMN IF NOT EXISTS "assetLocation" TEXT,
ADD COLUMN IF NOT EXISTS "acquisitionDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "acquisitionValue" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "assetCurrentValue" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "assetIncome" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "holdingCost" DOUBLE PRECISION;

-- Step 3: Add Real Assets specific fields to DirectInvestmentDocument table
ALTER TABLE "DirectInvestmentDocument"
ADD COLUMN IF NOT EXISTS "assetType" TEXT,
ADD COLUMN IF NOT EXISTS "assetDescription" TEXT,
ADD COLUMN IF NOT EXISTS "assetLocation" TEXT,
ADD COLUMN IF NOT EXISTS "acquisitionDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "acquisitionValue" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "assetCurrentValue" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "assetIncome" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "holdingCost" DOUBLE PRECISION;
```

### Option 3: Using Vercel/Production Database
If you're using Vercel or another platform:
1. Connect to your production database
2. Run the SQL migration commands above
3. Or use your platform's database migration tool

## Verification
After applying the migration, verify the columns exist:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'DirectInvestmentDocument' 
AND column_name IN ('assetType', 'assetDescription', 'assetLocation', 'acquisitionDate', 'acquisitionValue', 'assetCurrentValue', 'assetIncome', 'holdingCost');
```

## Rollback (if needed)
If you need to rollback, you can drop the new columns:
```sql
ALTER TABLE "DirectInvestment" 
DROP COLUMN IF EXISTS "assetType",
DROP COLUMN IF EXISTS "assetDescription",
DROP COLUMN IF EXISTS "assetLocation",
DROP COLUMN IF EXISTS "acquisitionDate",
DROP COLUMN IF EXISTS "acquisitionValue",
DROP COLUMN IF EXISTS "assetCurrentValue",
DROP COLUMN IF EXISTS "assetIncome",
DROP COLUMN IF EXISTS "holdingCost";

ALTER TABLE "DirectInvestmentDocument"
DROP COLUMN IF EXISTS "assetType",
DROP COLUMN IF EXISTS "assetDescription",
DROP COLUMN IF EXISTS "assetLocation",
DROP COLUMN IF EXISTS "acquisitionDate",
DROP COLUMN IF EXISTS "acquisitionValue",
DROP COLUMN IF EXISTS "assetCurrentValue",
DROP COLUMN IF EXISTS "assetIncome",
DROP COLUMN IF EXISTS "holdingCost";
```

Note: You cannot remove enum values in PostgreSQL, so REAL_ESTATE will remain in the enum even after rollback.

