# Database Verification Guide

## How to Check Which Database Your Backend Is Using

### Step 1: Check the Diagnostic Endpoint

I've created a diagnostic endpoint you can call:

```bash
curl https://onelp.capital/api/debug/db-info
```

This will return:
- Connection host (e.g., `ep-shiny-mouse-ad2fia26-pooler.c-2.us-east-1.aws.neon.tech`)
- Port (usually `5432` or empty for default)
- Database name (e.g., `neondb`)
- Current database name from the connection
- Whether the `Client` table exists
- How many clients are in the database

### Step 2: Check Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project (`OneLPMVP`)
2. Go to **Settings** → **Environment Variables**
3. Find `DATABASE_URL`
4. Click the eye icon to view it (it will show masked)
5. Compare the connection details with what you see in Neon

### Step 3: Compare with Neon Console

In your **Neon Console**:

1. Note the **connection details**:
   - **Host/Endpoint**: e.g., `ep-shiny-mouse-ad2fia26-pooler.c-2.us-east-1.aws.neon.tech`
   - **Database name**: e.g., `neondb`
   - **Branch**: (if using branching)

2. **Check your databases**:
   - Look at the list of databases/projects in Neon
   - Note which one has the `Client` table (we just created it)
   - Check the connection string format

### Step 4: Verify Database Match

The diagnostic endpoint will show:
```json
{
  "connection": {
    "host": "ep-shiny-mouse-ad2fia26-pooler.c-2.us-east-1.aws.neon.tech",
    "port": "5432",
    "database": "neondb",
    "schema": "public"
  },
  "currentDatabase": "neondb",
  "clientTable": {
    "exists": true,
    "recordCount": 0
  }
}
```

**Compare:**
- ✅ `host` should match your Neon endpoint
- ✅ `database` should match your Neon database name
- ✅ `clientTable.exists` should be `true` (if we created it)
- ✅ `clientTable.recordCount` should match what you see in Neon

### Step 5: If Databases Don't Match

If the backend is connected to a different database than what you're viewing in Neon:

1. **Update Vercel Environment Variable:**
   - Go to Vercel → Settings → Environment Variables
   - Update `DATABASE_URL` with the correct Neon connection string
   - Make sure to set it for **Production** environment
   - Redeploy the app

2. **Get the Correct Connection String from Neon:**
   - In Neon Console, click on your database
   - Copy the connection string (make sure it's for the right branch if using branching)
   - Format: `postgresql://username:password@host/database?sslmode=require`

3. **Reapply Migration to the Correct Database:**
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```

## Quick Test

Run this to see which database you're connected to:

```bash
curl https://onelp.capital/api/debug/db-info | jq
```

Or visit in browser (if you're logged in):
```
https://onelp.capital/api/debug/db-info
```

## Security Note

This diagnostic endpoint should be **removed or protected** in production after verification. For now, it only returns connection metadata (no passwords), but it's best practice to protect diagnostic endpoints.

