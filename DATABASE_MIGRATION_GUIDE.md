# Database Migration Guide

## Issue
The error "The column `User.mfaEnabled` does not exist in the current database" indicates that your database schema is out of sync with the Prisma schema.

## Solution
You need to run the database migrations to update your database with the latest schema changes.

## Steps to Fix

### Option 1: Using Prisma CLI (Recommended)

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Generate Prisma client**:
   ```bash
   npm run db:generate
   ```

3. **Push schema to database**:
   ```bash
   npm run db:push
   ```

### Option 2: Using Prisma Migrate

1. **Reset and migrate** (WARNING: This will reset your database):
   ```bash
   npx prisma migrate reset
   ```

2. **Or create a new migration**:
   ```bash
   npx prisma migrate dev --name add_missing_columns
   ```

### Option 3: Manual SQL (If you have database access)

Run this SQL command directly on your database:

```sql
-- Add missing columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginAttempts" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- Create indexes
CREATE INDEX IF NOT EXISTS "User_mfaEnabled_idx" ON "User"("mfaEnabled");
CREATE INDEX IF NOT EXISTS "User_lastLoginAt_idx" ON "User"("lastLoginAt");
CREATE INDEX IF NOT EXISTS "User_lockedUntil_idx" ON "User"("lockedUntil");
```

## For Vercel Deployment

If you're using Vercel, you need to run the migration on your production database:

1. **Set up Vercel CLI**:
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **Run migration on production**:
   ```bash
   vercel env pull .env.local
   npx prisma db push
   ```

## Verify Fix

After running the migration, test the login functionality. The error should be resolved.

## Environment Variables Required

Make sure these are set in your environment:

```bash
DATABASE_URL="your-database-connection-string"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="your-app-url"
```
