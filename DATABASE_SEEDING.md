# Database Seeding Guide

## Overview

The OneLPM database seeding script creates a complete, realistic dataset for development and testing. It cleans all existing data and populates the database with sample funds, direct investments, documents, and distributions.

## ⚠️ Important Notes

1. **This script DELETES ALL DATA** - Use only in development environments
2. **All documents are created WITHOUT PDF links** - The `url` field is set to an empty string to prevent broken "View PDF" buttons
3. **Migration Required for Distributions** - If you haven't run migrations yet, distributions will be skipped automatically

## Quick Start

### Option 1: Use the Helper Script (Recommended)

**On macOS/Linux:**
```bash
./scripts/reset-and-seed.sh
```

**On Windows:**
```bash
scripts\reset-and-seed.bat
```

### Option 2: Manual Execution

```bash
# Generate Prisma Client
npm run db:generate

# Run the seed script
npm run db:seed
```

## What Gets Created

### 👥 Users (4 total)

| Email | Password | Role | Client |
|-------|----------|------|--------|
| admin@onelpm.com | password123 | ADMIN | - |
| datamanager@onelpm.com | password123 | DATA_MANAGER | - |
| lp@acmecapital.com | password123 | USER | Acme Capital Partners |
| lp@globalinvest.com | password123 | USER | Global Investment Group |

### 🏢 Clients (2 total)

1. **Acme Capital Partners**
   - Contact: contact@acmecapital.com
   - Based in New York
   - Has 2 funds and multiple direct investments

2. **Global Investment Group**
   - Contact: info@globalinvest.com
   - Based in San Francisco
   - Has 1 fund

### 💼 Funds (3 total)

#### 1. TechVentures Fund III
- **Vintage:** 2020
- **Manager:** TechVentures Management LLC
- **Commitment:** $10M
- **Paid-in:** $6.5M
- **NAV:** $8.75M
- **TVPI:** 1.65x
- **DPI:** 0.30x
- **IRR:** 24%
- **Documents:** 7 (4 capital calls, 2 quarterly reports, 1 annual report)
- **Distributions:** 2 ($500K in Q1 2024, $1.45M in Q3 2024)
- **Client:** Acme Capital Partners

#### 2. Growth Equity Fund 2019
- **Vintage:** 2019
- **Manager:** Growth Partners LP
- **Commitment:** $25M
- **Paid-in:** $18M
- **NAV:** $24.5M
- **TVPI:** 1.85x
- **DPI:** 0.49x
- **IRR:** 18%
- **Documents:** 6 (4 capital calls, 1 quarterly report, 1 annual report)
- **Distributions:** 3 ($2.25M in 2023, $3.5M in H1 2024, $3M in Q3 2024)
- **Client:** Acme Capital Partners

#### 3. Emerging Markets Opportunity Fund
- **Vintage:** 2021
- **Manager:** Global Emerging Markets GP
- **Commitment:** $15M
- **Paid-in:** $5.25M
- **NAV:** $5.8M
- **TVPI:** 1.10x
- **DPI:** 0.05x
- **IRR:** 12%
- **Documents:** 4 (3 capital calls, 1 quarterly report)
- **Distributions:** 1 ($250K in Q2 2024)
- **Client:** Global Investment Group

### 📊 Direct Investments (4 total)

#### 1. Acme AI Technologies (Private Equity)
- **Type:** Series B AI/SaaS company
- **Investment Amount:** $2M
- **ARR:** $10.2M
- **MRR:** $850K
- **Burn:** $600K/month
- **Runway:** 24 months
- **Headcount:** 85
- **Client:** Acme Capital Partners
- **Documents:** 3 quarterly executive summaries with full metrics

#### 2. Beta Analytics (Private Equity)
- **Type:** Profitable Series A SaaS company
- **Investment Amount:** $1.5M
- **ARR:** $12M
- **MRR:** $1M
- **Profitable:** Yes (no burn)
- **Headcount:** 62
- **Client:** Acme Capital Partners
- **Documents:** 1 financial statement

#### 3. TechCorp Real Estate (Real Estate)
- **Type:** Commercial office building in Austin, TX
- **Investment Amount:** $10M equity
- **Property Value:** $35M purchase / $42M current
- **Square Footage:** 125,000 sq ft
- **Occupancy:** 92%
- **NOI:** $2.67M
- **Client:** Global Investment Group
- **Documents:** 1 property update

#### 4. CloudBank Debt Position (Private Debt)
- **Type:** FinTech debt investment
- **Principal:** $5M
- **Interest Rate:** 9.5%
- **Maturity:** December 2026
- **Credit Rating:** BB+
- **Status:** Current
- **Client:** Global Investment Group
- **Documents:** None (debt positions typically have minimal documents)

### 📈 Additional Data

- **NAV History:** 12 quarterly data points across all funds
- **Distributions:** 6 distributions totaling $10.95M
- **Documents:** 21 total documents (16 fund docs, 5 direct investment docs)
- **Fund Access Grants:** 3 (connecting LPs to their funds)

## Document Structure

All documents are created with:
- ✅ Realistic titles and dates
- ✅ Proper document types (CAPITAL_CALL, QUARTERLY_REPORT, etc.)
- ✅ Payment status for capital calls (PAID or PENDING)
- ✅ Parsed data where applicable
- ❌ **NO PDF links** - `url` field is empty string to prevent broken viewer

This ensures the UI shows document information but doesn't display "View PDF" or "Download" buttons when there's no actual file.

## Testing Scenarios

The seed data enables testing of:

### Cash Flow Analysis
- Multiple capital calls across different funds
- Regular distributions from mature funds
- Pending capital calls (Fund 1: $500K, Fund 3: $1.5M)
- Historical cash flow patterns

### Fund Performance
- Funds at different stages (early, mid, late)
- Various performance profiles (high IRR, high DPI, early stage)
- NAV progression over time
- Multiple distributions per fund

### Direct Investment Tracking
- Different investment types (equity, debt, real estate)
- Historical metrics for trend analysis
- Executive summaries with highlights/lowlights
- Various industry sectors

### User Access Control
- Admin seeing all data
- LPs seeing only their client's investments
- Fund access relationships

### Document Management
- Various document types
- Due dates and payment statuses
- Documents without PDF files

## Customization

### Modify the Seed Data

Edit `/prisma/seed.ts` to customize:
- User credentials
- Fund details and performance metrics
- Document creation dates
- Distribution amounts and timing
- Direct investment metrics

### Add More Data

The seed script is structured to easily add:
- More funds by copying fund creation blocks
- Additional documents by duplicating document creation
- More distributions
- Additional users and clients

### Skip Distributions

If the Distribution table hasn't been migrated yet, the script automatically skips distribution creation with a console warning.

## Troubleshooting

### Error: "url field is required"

If you get an error about the `url` field, the schema may have changed. Options:
1. Set `url` to empty string `''` (current approach)
2. Modify schema to make `url` optional: `url String?`
3. Use a placeholder URL

### Error: "Distribution table doesn't exist"

This is expected if you haven't run the migration yet. The script catches this error and continues. To enable distributions:

```bash
npx prisma migrate dev --name add_distributions
```

### Error: "bcrypt not found"

Install dependencies:

```bash
npm install
```

### Performance Issues

The seed script creates ~100 database records. If it's slow:
- Check database connection
- Ensure Prisma Client is generated: `npm run db:generate`
- Run in production mode for faster execution

## Next Steps After Seeding

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Login as different users to test:**
   - Admin: See all funds and investments
   - LP 1: See TechVentures and Growth Equity funds
   - LP 2: See Emerging Markets fund

3. **Test the Cash Flow page:**
   - Navigate to `/cash-flow`
   - View capital calls and distributions
   - Filter by fund and timeframe
   - Check pending capital calls alert

4. **Test Fund Details:**
   - View fund pages to see documents
   - Check NAV history charts
   - Verify executive summaries appear
   - Confirm no "View PDF" buttons show (since no URLs)

5. **Test Direct Investments:**
   - View direct investment pages
   - Check historical metrics charts
   - Review metrics timeline
   - Verify document listings

## Production Warning

🚨 **NEVER run this script in production!** 🚨

This script is for development and testing only. It will:
- Delete ALL production data
- Create sample/fake data
- Reset all user accounts
- Clear all documents and investments

For production:
- Use proper database backups
- Import real data via admin interfaces
- Create users through registration flow
- Upload actual documents through the upload system

## Schema Changes

If you modify the Prisma schema:

1. Generate new Prisma Client:
   ```bash
   npm run db:generate
   ```

2. Create migration:
   ```bash
   npm run db:migrate
   ```

3. Update seed script to match new schema

4. Re-run seed:
   ```bash
   npm run db:seed
   ```

## Support

If you encounter issues with seeding:
1. Check the console output for specific error messages
2. Verify database connection in `.env`
3. Ensure all migrations are up to date
4. Check Prisma schema matches database structure

## Summary

This comprehensive seeding script provides:
- ✅ Realistic, enterprise-grade sample data
- ✅ Multiple user roles and permissions
- ✅ Complete fund lifecycle data
- ✅ Diverse investment types
- ✅ Historical metrics and trends
- ✅ Documents without broken PDF links
- ✅ Cash flow events for visualization
- ✅ Easy cleanup and recreation

Perfect for development, demos, and testing of all OneLPM features!

