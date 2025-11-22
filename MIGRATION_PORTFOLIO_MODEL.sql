CREATE TABLE IF NOT EXISTS "PortfolioModel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targets" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PortfolioModel_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PortfolioModel_userId_idx" ON "PortfolioModel"("userId");
CREATE INDEX IF NOT EXISTS "PortfolioModel_createdAt_idx" ON "PortfolioModel"("createdAt");

ALTER TABLE "PortfolioModel"
ADD CONSTRAINT "PortfolioModel_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
