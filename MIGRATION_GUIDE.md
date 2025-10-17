# Database Migration Guide - Fund Ownership

## Overview
This migration changes the application architecture so that **funds belong directly to users** instead of using a separate access table.

## Changes Made

### Schema Changes
- Added `userId` field to `Fund` model
- Funds now have a direct relationship with User
- `FundAccess` table is kept for backward compatibility but is deprecated

### New Workflow
- Admins/Data Managers now manage funds **within a user's profile**
- Users can only see their own funds
- Fund CRUD operations are performed in the context of a specific user

## Migration Steps

### 1. Create the Migration
```bash
npx prisma migrate dev --name add_user_id_to_funds
```

### 2. Handle Existing Data (if any)
If you have existing funds in your database, you'll need to:
- Assign each fund to a user
- Or delete existing funds and reseed

### 3. Regenerate Prisma Client
```bash
npx prisma generate
```

### 4. Reseed the Database (Recommended for fresh start)
```bash
npx prisma migrate reset
```
This will drop the database, run all migrations, and seed with new data.

### 5. Restart Your Dev Server
```bash
npm run dev
```

## Breaking Changes
- API routes now require `userId` when creating funds
- Dashboard queries now filter by `userId` instead of using `FundAccess`
- Admin/Data Manager workflow is now user-centric

## Rollback
If you need to rollback:
```bash
git checkout HEAD~ prisma/schema.prisma
npx prisma migrate dev
```

