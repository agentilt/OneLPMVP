-- Migration: Add SavedReport table
-- Run this SQL on your Neon database to enable saved reports feature

-- Create SavedReport table
CREATE TABLE "SavedReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedReport_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX "SavedReport_userId_idx" ON "SavedReport"("userId");
CREATE INDEX "SavedReport_createdAt_idx" ON "SavedReport"("createdAt");

-- Add foreign key constraint
ALTER TABLE "SavedReport" ADD CONSTRAINT "SavedReport_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Verify the table was created
SELECT COUNT(*) FROM "SavedReport";

