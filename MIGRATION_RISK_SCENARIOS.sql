-- Migration: add RiskScenario table for saved stress tests

CREATE TABLE IF NOT EXISTS "RiskScenario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "navShock" DOUBLE PRECISION NOT NULL,
    "callMultiplier" DOUBLE PRECISION NOT NULL,
    "distributionMultiplier" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RiskScenario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RiskScenario_userId_idx" ON "RiskScenario"("userId");
CREATE INDEX IF NOT EXISTS "RiskScenario_createdAt_idx" ON "RiskScenario"("createdAt");

ALTER TABLE "RiskScenario"
ADD CONSTRAINT "RiskScenario_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
