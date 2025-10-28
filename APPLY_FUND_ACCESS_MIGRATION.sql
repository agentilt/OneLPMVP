-- Manual migration to add new FundAccess fields
-- This can be run directly in your database

-- Add new columns to FundAccess table
ALTER TABLE "FundAccess" 
ADD COLUMN IF NOT EXISTS "relationshipType" TEXT;

ALTER TABLE "FundAccess" 
ADD COLUMN IF NOT EXISTS "permissionLevel" TEXT DEFAULT 'READ_ONLY';

ALTER TABLE "FundAccess" 
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Create index for relationshipType
CREATE INDEX IF NOT EXISTS "FundAccess_relationshipType_idx" ON "FundAccess"("relationshipType");

-- Mark migration as applied
-- You'll need to update the _prisma_migrations table manually or run:
-- npx prisma migrate resolve --applied 20250122120000_enhance_fund_access

