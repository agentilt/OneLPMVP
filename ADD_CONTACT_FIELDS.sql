-- Add contact fields to Fund model for production database
-- Run this SQL query in your Neon database admin console

ALTER TABLE "Fund" ADD COLUMN IF NOT EXISTS "managerEmail" TEXT;
ALTER TABLE "Fund" ADD COLUMN IF NOT EXISTS "managerPhone" TEXT;
ALTER TABLE "Fund" ADD COLUMN IF NOT EXISTS "managerWebsite" TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Fund'
AND column_name IN ('managerEmail', 'managerPhone', 'managerWebsite');

