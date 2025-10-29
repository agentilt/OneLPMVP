-- Migration: Add Client Model
-- This migration adds the Client table and updates relationships

-- Step 1: Create Client table
CREATE TABLE IF NOT EXISTS "Client" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 2: Add clientId to User table (one account, one client)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clientId" TEXT;

-- Step 3: Add clientId to Fund table (one client, many funds)
ALTER TABLE "Fund" ADD COLUMN IF NOT EXISTS "clientId" TEXT;

-- Step 4: Add foreign key constraints
-- Note: We're keeping userId in Fund for backward compatibility (owner field)
-- But the primary relationship is now: Client -> Fund -> Document

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_client_id ON "User"("clientId");
CREATE INDEX IF NOT EXISTS idx_fund_client_id ON "Fund"("clientId");

-- Add comments
COMMENT ON TABLE "Client" IS 'Organizational clients that hold accounts and funds';
COMMENT ON COLUMN "User"."clientId" IS 'The client this user account belongs to';
COMMENT ON COLUMN "Fund"."clientId" IS 'The client this fund belongs to';

