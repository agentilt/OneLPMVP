-- Migration: RiskSnapshot persistence
CREATE TABLE IF NOT EXISTS "RiskSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallRiskScore" DOUBLE PRECISION NOT NULL,
    "concentrationRiskScore" DOUBLE PRECISION NOT NULL,
    "liquidityRiskScore" DOUBLE PRECISION NOT NULL,
    "totalPortfolio" DOUBLE PRECISION NOT NULL,
    "unfundedCommitments" DOUBLE PRECISION NOT NULL,
    "liquidityCoverage" DOUBLE PRECISION NOT NULL,
    "concentrationByAsset" JSONB NOT NULL,
    "concentrationByGeo" JSONB NOT NULL,
    "policyBreaches" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RiskSnapshot_user_snapshot_idx" ON "RiskSnapshot"("userId", "snapshotDate");
CREATE INDEX IF NOT EXISTS "RiskSnapshot_snapshotDate_idx" ON "RiskSnapshot"("snapshotDate");

ALTER TABLE "RiskSnapshot"
ADD CONSTRAINT "RiskSnapshot_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RiskSnapshot"
ADD CONSTRAINT "RiskSnapshot_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
