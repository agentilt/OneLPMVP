# Admin Application Update: Direct Investments Management

## Overview
Update the admin application to include full CRUD management for Direct Investments, following the same patterns used for Funds management.

## Existing Patterns to Follow
The Funds feature is implemented in:
- `/admin/funds/page.tsx` - Lists all funds
- `/admin/funds/AdminFundsClient.tsx` - Client component for funds list
- `/admin/users/[id]/page.tsx` - User detail page with funds management
- `/admin/users/[id]/UserFundsClient.tsx` - Client component for managing user's funds
- `/admin/clients/[clientId]/funds/route.ts` - API routes for client funds

## Implementation Requirements

### 1. Admin Direct Investments List Page
**Location**: `src/app/admin/direct-investments/page.tsx` and `AdminDirectInvestmentsClient.tsx`

**Requirements**:
- Server component that fetches all direct investments from the database
- Include client relationship and document counts
- Display in a table format similar to AdminFundsClient
- Show: Name, Industry, Stage, Investment Amount, Revenue, ARR, Cash Balance, Client, Documents count
- Link to client management page

**API Endpoint**: Should fetch all direct investments, ordered by createdAt desc
```typescript
const directInvestments = await prisma.directInvestment.findMany({
  orderBy: { createdAt: 'desc' },
  include: {
    client: {
      select: { id: true, name: true, email: true },
    },
    _count: {
      select: { documents: true },
    },
  },
})
```

### 2. Client-Based Direct Investments Management
**Location**: `src/app/admin/clients/[clientId]/direct-investments/` (similar to funds structure)

**Requirements**:
- Create pages for managing direct investments per client
- Follow the pattern from `/admin/clients/[clientId]/funds/`
- Allow admins to:
  - View all direct investments for a client
  - Create new direct investments
  - Edit existing direct investments
  - Delete direct investments
  - Upload/manage documents for direct investments

**Form Fields for Direct Investment**:
- Basic Info:
  - Name (required)
  - Industry
  - Stage (Seed, Series A, Series B, etc.)
  - Investment Date
  - Investment Amount
  
- Executive Summary (optional):
  - Period (Month/Quarter dropdown)
  - Period Date
  - Highlights (textarea)
  - Lowlights (textarea)
  - Milestones (textarea)
  - Recent Rounds (textarea)
  - Cap Table Changes (textarea)
  
- Metrics Snapshot (all optional):
  - Revenue
  - ARR (Annual Recurring Revenue)
  - MRR (Monthly Recurring Revenue)
  - Gross Margin (%)
  - Run Rate
  - Burn (monthly)
  - Runway (months)
  - Headcount
  - CAC (Customer Acquisition Cost)
  - LTV (Lifetime Value)
  - NRR (Net Revenue Retention %)
  - Cash Balance

### 3. Document Management for Direct Investments
**Location**: Similar to fund documents, but for direct investments

**Requirements**:
- Upload documents linked to direct investments
- Document types: EXECUTIVE_SUMMARY, FINANCIAL_STATEMENT, INVESTOR_UPDATE, BOARD_PACKAGE, CAP_TABLE, TERM_SHEET, OTHER
- Use the existing document upload pattern from fund documents
- API endpoint: `/api/admin/clients/[clientId]/direct-investments/[investmentId]/documents`

### 4. Navigation Updates
- Already added "Direct Investments" to AdminSidebar navigation
- Ensure routing works: `/admin/direct-investments`

### 5. API Routes Already Created
The following API routes are already implemented:
- `GET/POST /api/admin/clients/[clientId]/direct-investments`
- `GET/PUT/DELETE /api/admin/clients/[clientId]/direct-investments/[investmentId]`
- `GET/POST /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents`

### 6. UI Components to Create

#### AdminDirectInvestmentsClient Component
- Table showing all direct investments
- Columns: Name, Industry, Stage, Investment Amount, Revenue, ARR, Cash Balance, Client (with link), Documents count, Actions
- Empty state with message if no investments
- Link to create new investment (routes to client selection or specific client page)

#### Direct Investment Form Component (for Create/Edit)
- Large form with sections:
  1. Basic Information
  2. Executive Summary
  3. Metrics Snapshot
- Use same styling as fund forms
- Validation for required fields
- Toast notifications for success/error
- Redirect on successful creation

#### Client Direct Investments Page
- Show list of direct investments for a specific client
- "Add Direct Investment" button
- Edit/Delete actions for each investment
- Link to document management

### 7. Styling Guidelines
- Follow existing admin page styling
- Use same color scheme and layout patterns
- Match table styling from AdminFundsClient
- Use same form styling from fund creation forms
- Maintain consistent spacing and typography

### 8. Key Differences from Funds
- Direct investments are linked to Clients (not Users primarily)
- More complex form with Executive Summary and Metrics sections
- Different document types
- No NAV history (funds-specific feature)

### 9. Testing Checklist
- [ ] Can view all direct investments in admin
- [ ] Can create direct investment for a client
- [ ] Can edit existing direct investment
- [ ] Can delete direct investment
- [ ] Can upload documents to direct investment
- [ ] All form fields save correctly
- [ ] Navigation links work properly
- [ ] Client relationships display correctly
- [ ] Document counts show accurately

### 10. Files to Create/Update

**Create**:
- `src/app/admin/direct-investments/page.tsx`
- `src/app/admin/direct-investments/AdminDirectInvestmentsClient.tsx`
- `src/app/admin/clients/[clientId]/direct-investments/page.tsx` (if client pages exist)
- `src/app/admin/clients/[clientId]/direct-investments/ClientDirectInvestmentsClient.tsx`

**Update**:
- AdminSidebar (already done - includes Direct Investments link)
- Client detail pages (if they exist) to show direct investments count/section

## Example Structure Reference

Look at these files for patterns:
- `src/app/admin/funds/AdminFundsClient.tsx` - List view pattern
- `src/app/admin/users/[id]/UserFundsClient.tsx` - Create/Edit/Delete pattern with modals
- `src/app/admin/clients/[clientId]/funds/route.ts` - API route pattern (direct investments routes already created)

## Notes
- All API routes for direct investments are already implemented
- Database schema is complete with DirectInvestment and DirectInvestmentDocument models
- Use the same authentication and authorization patterns (ADMIN role required)
- Follow the existing error handling and loading state patterns
- Use toast notifications for user feedback (already set up with sonner)












