# Direct Investment Metrics Architecture

## Overview

Metrics and executive summary fields are now linked to **documents** instead of direct investments. Direct investments automatically aggregate the latest metrics from their documents, providing both current snapshots and historical tracking.

## Architecture Changes

### Before
- Metrics and executive summary were stored directly on `DirectInvestment`
- No historical tracking
- Metrics had to be manually updated on the investment

### After
- Metrics and executive summary are stored on each `DirectInvestmentDocument`
- `DirectInvestment` aggregates the latest metrics from documents automatically
- Full historical tracking via document queries
- Metrics update automatically when documents are added/updated/deleted

## Database Schema

### DirectInvestmentDocument
Each document can now contain:
- **Executive Summary Fields**: `period`, `periodDate`, `highlights`, `lowlights`, `milestones`, `recentRounds`, `capTableChanges`
- **Metrics Fields**: `revenue`, `arr`, `mrr`, `grossMargin`, `runRate`, `burn`, `runway`, `headcount`, `cac`, `ltv`, `nrr`, `cashBalance`

### DirectInvestment
Maintains aggregated (cached) fields that are automatically updated from the most recent document:
- Same fields as documents, but representing the **latest** values
- Updated automatically via aggregation function

## API Changes

### Creating Direct Investments

**Before:**
```json
POST /api/admin/clients/[clientId]/direct-investments
{
  "name": "Acme Corp",
  "industry": "SaaS",
  "revenue": 1000000,
  "arr": 12000000,
  ...
}
```

**After:**
```json
POST /api/admin/clients/[clientId]/direct-investments
{
  "name": "Acme Corp",
  "industry": "SaaS",
  "stage": "Series A",
  "investmentDate": "2024-01-01",
  "investmentAmount": 5000000
  // Metrics and executive summary removed - only basic info
}
```

### Creating Documents with Metrics

**New:**
```json
POST /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents
{
  "type": "INVESTOR_UPDATE",
  "title": "Q1 2024 Update",
  "url": "https://...",
  "uploadDate": "2024-04-01",
  // Executive Summary
  "period": "Quarter",
  "periodDate": "2024-03-31",
  "highlights": "Strong growth...",
  "lowlights": "Churn increased...",
  "milestones": "Launched new product...",
  // Metrics
  "revenue": 1500000,
  "arr": 18000000,
  "mrr": 1500000,
  "cashBalance": 8000000,
  ...
}
```

### Updating Direct Investments

**PUT `/api/admin/clients/[clientId]/direct-investments/[investmentId]`**

Now only allows updating:
- `name`
- `industry`
- `stage`
- `investmentDate`
- `investmentAmount`

Metrics and executive summary fields can **only** be updated via documents.

### Updating Documents

**PUT `/api/admin/clients/[clientId]/direct-investments/[investmentId]/documents/[documentId]`**

Allows updating all document fields including metrics and executive summary. Automatically triggers aggregation.

### Deleting Documents

**DELETE `/api/admin/clients/[clientId]/direct-investments/[investmentId]/documents/[documentId]`**

Automatically triggers aggregation to update the investment with metrics from remaining documents.

## Aggregation Function

The `aggregateDirectInvestmentMetrics()` function:
1. Fetches all documents for an investment, ordered by `uploadDate` (most recent first)
2. Takes values from the most recent document
3. Updates the `DirectInvestment` with aggregated values
4. Automatically called when documents are created/updated/deleted

## Historical Metrics

To view historical metrics over time:

```typescript
import { getHistoricalMetrics } from '@/lib/direct-investment-aggregation'

const history = await getHistoricalMetrics(directInvestmentId)
// Returns array of metrics at different points in time from documents
```

## Migration Notes

### Existing Data
- Existing direct investments with metrics will retain those values
- New documents should be created to establish historical tracking
- The aggregation function will work with any existing data

### Best Practices
1. **Create investment first** with basic info (name, industry, stage, investment date, investment amount)
2. **Add documents** with each update/quarter/month containing metrics and executive summary
3. **Metrics update automatically** - the investment will always show the latest values from documents
4. **Query documents** for historical analysis and trends

## Example Workflow

```javascript
// 1. Create investment
const investment = await fetch('/api/admin/clients/xxx/direct-investments', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Acme Corp',
    industry: 'SaaS',
    stage: 'Series A',
    investmentDate: '2024-01-01',
    investmentAmount: 5000000
  })
})

// 2. Add Q1 document with metrics
await fetch(`/api/admin/clients/xxx/direct-investments/${investment.id}/documents`, {
  method: 'POST',
  body: JSON.stringify({
    type: 'INVESTOR_UPDATE',
    title: 'Q1 2024 Update',
    url: 'https://...',
    uploadDate: '2024-04-01',
    period: 'Quarter',
    periodDate: '2024-03-31',
    revenue: 1500000,
    arr: 18000000,
    mrr: 1500000,
    // ... other metrics
  })
})
// Investment metrics are now automatically updated!

// 3. Add Q2 document
await fetch(`/api/admin/clients/xxx/direct-investments/${investment.id}/documents`, {
  method: 'POST',
  body: JSON.stringify({
    type: 'INVESTOR_UPDATE',
    title: 'Q2 2024 Update',
    uploadDate: '2024-07-01',
    revenue: 2000000, // Updated metrics
    arr: 24000000,
    // ...
  })
})
// Investment metrics automatically update to Q2 values
```

## UI Updates Needed

1. **Document Upload Forms**: Add fields for metrics and executive summary
2. **Historical View**: Display metrics over time using `getHistoricalMetrics()`
3. **Charts/Graphs**: Use document data to show trends
4. **Investment Detail Pages**: Show aggregated metrics (already working) + historical chart

## Benefits

✅ **Automatic Updates**: Metrics update when documents are added  
✅ **Historical Tracking**: Full history via document queries  
✅ **Single Source of Truth**: Documents are the source, investments are aggregated views  
✅ **Flexible**: Each document can have different metrics based on its reporting period  
✅ **Backwards Compatible**: Existing queries still work, fields are just populated differently

