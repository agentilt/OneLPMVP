# Prisma Commands to Create DirectInvestment Tables

Run these commands in order:

## Step 1: Check current status
```bash
npx prisma migrate status
```

## Step 2: Push schema to database (creates missing tables)
This will sync your Prisma schema with the database and create any missing tables:
```bash
npx prisma db push
```

## Step 3: Verify tables were created
```bash
npx prisma db execute --stdin --schema prisma/schema.prisma << 'EOF'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('DirectInvestment', 'DirectInvestmentDocument')
ORDER BY table_name;
EOF
```

## Step 4: Regenerate Prisma Client
```bash
npx prisma generate
```

---

## Alternative: If db push doesn't work, manually execute the migration

If `db push` doesn't create the tables, manually execute the migration SQL:

```bash
npx prisma db execute --file prisma/migrations/20250125000000_add_direct_investments/migration.sql --schema prisma/schema.prisma
```

Then verify again with Step 3.

---

## To check what database you're connected to:
```bash
npx prisma db execute --stdin --schema prisma/schema.prisma << 'EOF'
SELECT current_database(), current_user;
EOF
```

