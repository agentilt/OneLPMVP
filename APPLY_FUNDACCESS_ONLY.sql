-- Apply only the FundAccess enhancements
-- Run this in your Neon database SQL editor

ALTER TABLE "FundAccess" ADD COLUMN IF NOT EXISTS "relationshipType" TEXT;
ALTER TABLE "FundAccess" ADD COLUMN IF NOT EXISTS "permissionLevel" TEXT DEFAULT 'READ_ONLY';
ALTER TABLE "FundAccess" ADD COLUMN IF NOT EXISTS "notes" TEXT;
CREATE INDEX IF NOT EXISTS "FundAccess_relationshipType_idx" ON "FundAccess"("relationshipType");







