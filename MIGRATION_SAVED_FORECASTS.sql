-- Run this SQL on your Postgres database to enable saved forecast scenarios
CREATE TABLE IF NOT EXISTS "SavedForecast" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "config" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_savedforecast_user FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SavedForecast_userId_idx" ON "SavedForecast"("userId");
CREATE INDEX IF NOT EXISTS "SavedForecast_createdAt_idx" ON "SavedForecast"("createdAt");

CREATE OR REPLACE FUNCTION set_savedforecast_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_savedforecast_updated_at_trigger ON "SavedForecast";
CREATE TRIGGER set_savedforecast_updated_at_trigger
BEFORE UPDATE ON "SavedForecast"
FOR EACH ROW EXECUTE PROCEDURE set_savedforecast_updated_at();
