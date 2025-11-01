# Update Direct Investment Document Upload Form

## Overview
Update the document upload form for direct investments to include metrics and executive summary fields. These fields are now stored on documents (not directly on investments) to enable historical tracking. When a document with metrics is uploaded, the direct investment automatically aggregates the latest metrics from all its documents.

## Context
- **API Endpoint**: `/api/admin/clients/[clientId]/direct-investments/[investmentId]/documents` (POST)
- **Architecture**: Metrics are stored on `DirectInvestmentDocument`, and `DirectInvestment` aggregates the latest values automatically
- **Reference**: Follow the pattern from `src/app/admin/documents/upload/page.tsx` (fund documents) but add the new metrics/executive summary sections

## Form Structure

The form should be organized into the following sections:

### 1. Basic Document Information (Required)
- Document Type (dropdown)
  - Options: `EXECUTIVE_SUMMARY`, `FINANCIAL_STATEMENT`, `INVESTOR_UPDATE`, `BOARD_PACKAGE`, `CAP_TABLE`, `TERM_SHEET`, `OTHER`
- Title (text input, required)
- Document URL (text input, required) - can be Google Drive link or file path
- Upload Date (date picker, required) - This represents the report/period date
- Due Date (date picker, optional)

### 2. Executive Summary Section (Optional - Collapsible)
Make this section collapsible with a toggle/accordion for better UX.

- **Period** (dropdown)
  - Options: `Month`, `Quarter`, `Year`, `Other`
- **Period Date** (date picker)
  - Which specific month/quarter/year this document represents
- **Highlights** (textarea, multi-line)
  - Key positive developments and achievements
- **Lowlights** (textarea, multi-line)
  - Challenges, concerns, or negative developments
- **Milestones** (textarea, multi-line)
  - Important milestones achieved during this period
- **Recent Rounds** (textarea, multi-line)
  - Information about recent funding rounds
- **Cap Table Changes** (textarea, multi-line)
  - Changes to capitalization table, ownership, etc.

### 3. Metrics Section (Optional - Collapsible)
Make this section collapsible with a toggle/accordion. Group metrics logically for better UX.

#### Revenue Metrics
- **Revenue** (number input, step="0.01")
  - Current total revenue
- **ARR** (Annual Recurring Revenue) (number input, step="0.01")
  - Annual recurring revenue
- **MRR** (Monthly Recurring Revenue) (number input, step="0.01")
  - Monthly recurring revenue
- **Gross Margin** (number input, step="0.01")
  - Gross margin percentage
- **Run Rate** (number input, step="0.01")
  - Annualized run rate based on current performance

#### Financial Metrics
- **Burn** (number input, step="0.01")
  - Monthly burn rate (negative cash flow)
- **Runway** (number input, step="0.01")
  - Months of runway remaining
- **Cash Balance** (number input, step="0.01")
  - Current cash on hand

#### Operational Metrics
- **Headcount** (number input, step="1")
  - Total number of employees
- **CAC** (Customer Acquisition Cost) (number input, step="0.01")
  - Cost to acquire a new customer
- **LTV** (Lifetime Value) (number input, step="0.01")
  - Customer lifetime value
- **NRR** (Net Revenue Retention) (number input, step="0.01")
  - Net revenue retention percentage

## Implementation Details

### Form State Management
```typescript
const [formData, setFormData] = useState({
  // Basic fields
  type: 'INVESTOR_UPDATE',
  title: '',
  url: '',
  uploadDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  
  // Executive Summary
  period: '',
  periodDate: '',
  highlights: '',
  lowlights: '',
  milestones: '',
  recentRounds: '',
  capTableChanges: '',
  
  // Metrics
  revenue: '',
  arr: '',
  mrr: '',
  grossMargin: '',
  runRate: '',
  burn: '',
  runway: '',
  headcount: '',
  cac: '',
  ltv: '',
  nrr: '',
  cashBalance: '',
})
```

### Form Submission
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const response = await fetch(
      `/api/admin/clients/${clientId}/direct-investments/${investmentId}/documents`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          url: formData.url,
          uploadDate: formData.uploadDate,
          dueDate: formData.dueDate || null,
          
          // Executive Summary
          period: formData.period || null,
          periodDate: formData.periodDate || null,
          highlights: formData.highlights || null,
          lowlights: formData.lowlights || null,
          milestones: formData.milestones || null,
          recentRounds: formData.recentRounds || null,
          capTableChanges: formData.capTableChanges || null,
          
          // Metrics - convert to numbers or null
          revenue: formData.revenue ? parseFloat(formData.revenue) : null,
          arr: formData.arr ? parseFloat(formData.arr) : null,
          mrr: formData.mrr ? parseFloat(formData.mrr) : null,
          grossMargin: formData.grossMargin ? parseFloat(formData.grossMargin) : null,
          runRate: formData.runRate ? parseFloat(formData.runRate) : null,
          burn: formData.burn ? parseFloat(formData.burn) : null,
          runway: formData.runway ? parseFloat(formData.runway) : null,
          headcount: formData.headcount ? parseInt(formData.headcount) : null,
          cac: formData.cac ? parseFloat(formData.cac) : null,
          ltv: formData.ltv ? parseFloat(formData.ltv) : null,
          nrr: formData.nrr ? parseFloat(formData.nrr) : null,
          cashBalance: formData.cashBalance ? parseFloat(formData.cashBalance) : null,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload document')
    }

    const data = await response.json()
    toast.success('Document uploaded successfully')
    // Metrics will be automatically aggregated to the investment
    router.push(`/admin/clients/${clientId}/direct-investments/${investmentId}`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to upload document')
  } finally {
    setLoading(false)
  }
}
```

## UI/UX Recommendations

1. **Collapsible Sections**: Use accordions or collapsible sections for Executive Summary and Metrics to avoid overwhelming the user
2. **Field Labels**: Use clear, descriptive labels with helper text where needed
3. **Input Types**: 
   - Use `type="number"` for all numeric fields
   - Add `step="0.01"` for decimal fields
   - Add `step="1"` for integer fields (headcount)
4. **Validation**: 
   - Required fields: `type`, `title`, `url`, `uploadDate`
   - All metrics and executive summary fields are optional
5. **Grouping**: Visually group related fields (Revenue Metrics, Financial Metrics, Operational Metrics)
6. **Formatting**: Consider adding currency formatting for monetary fields
7. **Helper Text**: Add small helper text below fields explaining what each metric represents

## Example Field Rendering

```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium mb-2">
      Revenue ($)
    </label>
    <input
      type="number"
      step="0.01"
      value={formData.revenue}
      onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
      className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
      placeholder="1500000"
    />
    <p className="mt-1 text-xs text-foreground/60">
      Total revenue for this period
    </p>
  </div>

  <div>
    <label className="block text-sm font-medium mb-2">
      ARR - Annual Recurring Revenue ($)
    </label>
    <input
      type="number"
      step="0.01"
      value={formData.arr}
      onChange={(e) => setFormData({ ...formData, arr: e.target.value })}
      className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
      placeholder="18000000"
    />
    <p className="mt-1 text-xs text-foreground/60">
      Annual recurring revenue (for SaaS companies)
    </p>
  </div>

  {/* Continue for all other fields... */}
</div>
```

## Collapsible Section Example

Use a collapsible component for better UX:

```tsx
<div className="border rounded-lg p-4">
  <button
    type="button"
    onClick={() => setShowMetrics(!showMetrics)}
    className="w-full flex items-center justify-between text-left"
  >
    <h3 className="font-semibold">Metrics (Optional)</h3>
    <ChevronDown className={`w-5 h-5 transition-transform ${showMetrics ? 'rotate-180' : ''}`} />
  </button>
  
  {showMetrics && (
    <div className="mt-4 space-y-4">
      {/* Metrics fields here */}
    </div>
  )}
</div>
```

## Files to Update/Create

1. **If adding to existing client direct investment management page:**
   - Update the document upload modal/form in the client direct investments management component
   - Location: Likely in `src/app/admin/clients/[clientId]/direct-investments/` or similar

2. **If creating a standalone upload page:**
   - Create: `src/app/admin/direct-investments/[investmentId]/documents/upload/page.tsx`
   - Similar structure to `src/app/admin/documents/upload/page.tsx` but for direct investments

## After Upload

After a document is successfully uploaded:
1. The API will automatically trigger aggregation
2. The direct investment's metrics will update to the latest document's values
3. All historical metrics remain accessible via the documents
4. Users can view historical trends by querying documents over time

## Testing Checklist

- [ ] Form validates required fields (type, title, url, uploadDate)
- [ ] Optional fields work correctly (can be left empty)
- [ ] Number inputs accept decimal values correctly
- [ ] Form submission sends all fields to API correctly
- [ ] After upload, investment metrics are updated automatically
- [ ] Success/error messages display correctly
- [ ] Form handles loading states appropriately
- [ ] Collapsible sections work smoothly

## Reference Files

- API Route: `src/app/api/admin/clients/[clientId]/direct-investments/[investmentId]/documents/route.ts`
- Fund Document Upload Form: `src/app/admin/documents/upload/page.tsx`
- Architecture Documentation: `DIRECT_INVESTMENT_METRICS_ARCHITECTURE.md`

