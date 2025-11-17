-- Migration: Separate Real Estate and Real Assets
-- This migration adds the new REAL_ESTATE investment type and separates Real Assets fields

-- Step 1: Add REAL_ESTATE to the enum (if not exists)
-- Note: PostgreSQL doesn't support IF NOT EXISTS for enum values, so this may need manual handling
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

-- Step 4: Update existing REAL_ASSETS investments to REAL_ESTATE if they have property fields
-- This is a data migration - adjust based on your data
-- UPDATE "DirectInvestment" 
-- SET "investmentType" = 'REAL_ESTATE' 
-- WHERE "investmentType" = 'REAL_ASSETS' 
-- AND "propertyType" IS NOT NULL;

