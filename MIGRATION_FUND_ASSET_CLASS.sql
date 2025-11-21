ALTER TABLE "Fund" ADD COLUMN IF NOT EXISTS "assetClass" TEXT DEFAULT 'Multi-Strategy';
CREATE INDEX IF NOT EXISTS "Fund_assetClass_idx" ON "Fund"("assetClass");
