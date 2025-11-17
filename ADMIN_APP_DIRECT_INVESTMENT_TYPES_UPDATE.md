# Admin Application Update: Direct Investment Types & Fields

## Overview

This document details the changes made to support multiple direct investment types (Private Debt, Private Credit, Public Equity, Real Estate, Real Assets, and Cash) in addition to the existing Private Equity type. The changes include database schema updates, API modifications, and UI requirements.

## Summary of Changes

1. **New Investment Types**: Added support for 6 additional investment types beyond Private Equity
2. **Type-Specific Fields**: Each investment type has its own set of relevant fields
3. **Separated Real Estate and Real Assets**: Previously combined, now distinct types
4. **Database Schema**: Added new enum value and multiple new fields to both `DirectInvestment` and `DirectInvestmentDocument` models
5. **API Updates**: Updated POST and PUT endpoints to handle all new fields

---

## 1. Database Schema Changes

### 1.1 Enum Update

**Enum Name**: `DirectInvestmentType`

**New Values** (in addition to existing `PRIVATE_EQUITY`):
- `PRIVATE_DEBT` - Private debt instruments
- `PRIVATE_CREDIT` - Private credit investments
- `PUBLIC_EQUITY` - Publicly traded stocks
- `REAL_ESTATE` - Property investments (separated from Real Assets)
- `REAL_ASSETS` - Other real assets (infrastructure, commodities, art, collectibles, etc.)
- `CASH` - Cash accounts and equivalents

**Default Value**: `PRIVATE_EQUITY`

### 1.2 DirectInvestment Model - New Fields

All new fields are **optional** (nullable). Fields are organized by investment type:

#### Private Debt/Credit Fields
```prisma
principalAmount Float?    // Principal amount for debt/credit
interestRate    Float?    // Annual interest rate (as decimal, e.g., 0.05 for 5%)
couponRate      Float?    // Coupon rate for bonds
maturityDate    DateTime? // Maturity date for debt/credit
creditRating    String?   // Credit rating (e.g., "AAA", "BB+")
defaultStatus   String?   // "CURRENT", "DEFAULTED", "RESTRUCTURED"
currentValue    Float?    // Current market value for debt/credit
yield           Float?    // Current yield
```

#### Public Equity Fields
```prisma
tickerSymbol  String?  // Stock ticker symbol (e.g., "AAPL", "MSFT")
shares        Float?   // Number of shares owned
purchasePrice Float?   // Average purchase price per share
currentPrice  Float?   // Current market price per share
dividends     Float?   // Total dividends received
marketValue   Float?   // Current market value (shares * currentPrice)
```

#### Real Estate Fields
```prisma
propertyType       String?   // e.g., "Commercial", "Residential", "Industrial", "Land"
propertyAddress    String?   // Property address/location
squareFootage      Float?    // Square footage of the property
purchaseDate       DateTime? // When the property was purchased
purchaseValue      Float?    // Purchase price/value
currentAppraisal   Float?    // Current appraised value
rentalIncome       Float?    // Annual rental income
occupancyRate      Float?    // Occupancy rate (as decimal, e.g., 0.95 for 95%)
propertyTax        Float?    // Annual property tax
maintenanceCost    Float?    // Annual maintenance costs
netOperatingIncome Float?    // NOI (Net Operating Income)
```

#### Real Assets Fields
```prisma
assetType         String?   // e.g., "Infrastructure", "Commodity", "Art", "Collectible", "Natural Resource"
assetDescription  String?   // Description of the asset
assetLocation     String?   // Location of the asset
acquisitionDate   DateTime? // When the asset was acquired
acquisitionValue  Float?    // Acquisition price/value
assetCurrentValue Float?    // Current market value for real assets
assetIncome       Float?    // Annual income generated (if applicable)
holdingCost       Float?    // Annual holding/storage costs
```

#### Cash Fields
```prisma
accountType      String?   // e.g., "Savings", "Checking", "Money Market", "CD", "Treasury"
accountName      String?   // Account name/number identifier
cashInterestRate Float?    // Interest rate for cash accounts (as decimal)
balance          Float?    // Current balance
currency         String?   // Currency code (e.g., "USD", "EUR")
cashMaturityDate DateTime? // Maturity date for CDs/Treasury bills
```

### 1.3 DirectInvestmentDocument Model - New Fields

**Important**: The same fields listed above for `DirectInvestment` are also added to `DirectInvestmentDocument` for historical tracking. When documents are created/updated, they can store type-specific metrics that will be tracked over time.

---

## 2. API Endpoint Changes

### 2.1 Create Direct Investment

**Endpoint**: `POST /api/admin/clients/[clientId]/direct-investments`

**Request Body** (all fields optional except `name`):

```typescript
{
  // Required
  name: string
  
  // Basic fields
  investmentType?: 'PRIVATE_EQUITY' | 'PRIVATE_DEBT' | 'PRIVATE_CREDIT' | 'PUBLIC_EQUITY' | 'REAL_ESTATE' | 'REAL_ASSETS' | 'CASH'
  industry?: string | null
  stage?: string | null
  investmentDate?: string | null  // ISO date string
  investmentAmount?: number | null
  
  // Private Debt/Credit fields
  principalAmount?: number | null
  interestRate?: number | null
  couponRate?: number | null
  maturityDate?: string | null  // ISO date string
  creditRating?: string | null
  defaultStatus?: string | null
  currentValue?: number | null
  yield?: number | null  // Note: 'yield' is a reserved word in JavaScript, use 'yieldValue' in request body
  
  // Public Equity fields
  tickerSymbol?: string | null
  shares?: number | null
  purchasePrice?: number | null
  currentPrice?: number | null
  dividends?: number | null
  marketValue?: number | null
  
  // Real Estate fields
  propertyType?: string | null
  propertyAddress?: string | null
  squareFootage?: number | null
  purchaseDate?: string | null  // ISO date string
  purchaseValue?: number | null
  currentAppraisal?: number | null
  rentalIncome?: number | null
  occupancyRate?: number | null  // As decimal (0.95 = 95%)
  propertyTax?: number | null
  maintenanceCost?: number | null
  netOperatingIncome?: number | null
  
  // Real Assets fields
  assetType?: string | null
  assetDescription?: string | null
  assetLocation?: string | null
  acquisitionDate?: string | null  // ISO date string
  acquisitionValue?: number | null
  assetCurrentValue?: number | null
  assetIncome?: number | null
  holdingCost?: number | null
  
  // Cash fields
  accountType?: string | null
  accountName?: string | null
  cashInterestRate?: number | null
  balance?: number | null
  currency?: string | null
  cashMaturityDate?: string | null  // ISO date string
}
```

**Response**: Returns the created `DirectInvestment` object with all fields.

**Example Request**:
```json
{
  "name": "Apple Inc. Stock",
  "investmentType": "PUBLIC_EQUITY",
  "tickerSymbol": "AAPL",
  "shares": 100,
  "purchasePrice": 150.00,
  "currentPrice": 175.50,
  "marketValue": 17550.00
}
```

### 2.2 Update Direct Investment

**Endpoint**: `PUT /api/admin/clients/[clientId]/direct-investments/[investmentId]`

**Request Body**: Same structure as POST, but all fields are optional. Only include fields you want to update.

**Response**: Returns the updated `DirectInvestment` object.

**Note**: Metrics and executive summary fields (revenue, arr, mrr, highlights, etc.) should NOT be updated via this endpoint. They are aggregated from documents.

### 2.3 Get Direct Investment

**Endpoint**: `GET /api/admin/clients/[clientId]/direct-investments/[investmentId]`

**Response**: Returns the `DirectInvestment` object with all fields, including related documents.

### 2.4 Create Document

**Endpoint**: `POST /api/admin/clients/[clientId]/direct-investments/[investmentId]/documents`

**Request Body**:
```typescript
{
  // Required
  type: string  // Document type enum value
  title: string
  url: string
  
  // Optional
  uploadDate?: string  // ISO date string, defaults to now
  dueDate?: string | null  // ISO date string
  parsedData?: any  // JSON object
  
  // Executive Summary Fields (optional)
  period?: string | null
  periodDate?: string | null  // ISO date string
  highlights?: string | null
  lowlights?: string | null
  milestones?: string | null
  recentRounds?: string | null
  capTableChanges?: string | null
  
  // Private Equity Metrics (optional)
  revenue?: number | null
  arr?: number | null
  mrr?: number | null
  grossMargin?: number | null
  runRate?: number | null
  burn?: number | null
  runway?: number | null
  headcount?: number | null
  cac?: number | null
  ltv?: number | null
  nrr?: number | null
  cashBalance?: number | null
  
  // Type-specific metrics can also be included for historical tracking
  // (same fields as DirectInvestment, but stored per document)
}
```

**Note**: Documents can store type-specific metrics for historical tracking. The API currently accepts Private Equity metrics, but you can extend it to accept type-specific fields for other investment types as well.

---

## 3. TypeScript Interface Updates

### 3.1 DirectInvestment Interface

Update your `DirectInvestment` interface to include all new fields:

```typescript
interface DirectInvestment {
  id: string
  userId?: string | null
  clientId?: string | null
  name: string
  investmentType: 'PRIVATE_EQUITY' | 'PRIVATE_DEBT' | 'PRIVATE_CREDIT' | 'PUBLIC_EQUITY' | 'REAL_ESTATE' | 'REAL_ASSETS' | 'CASH'
  industry?: string | null
  stage?: string | null
  investmentDate?: Date | null
  investmentAmount?: number | null
  
  // Private Debt/Credit fields
  principalAmount?: number | null
  interestRate?: number | null
  couponRate?: number | null
  maturityDate?: Date | null
  creditRating?: string | null
  defaultStatus?: string | null
  currentValue?: number | null
  yield?: number | null
  
  // Public Equity fields
  tickerSymbol?: string | null
  shares?: number | null
  purchasePrice?: number | null
  currentPrice?: number | null
  dividends?: number | null
  marketValue?: number | null
  
  // Real Estate fields
  propertyType?: string | null
  propertyAddress?: string | null
  squareFootage?: number | null
  purchaseDate?: Date | null
  purchaseValue?: number | null
  currentAppraisal?: number | null
  rentalIncome?: number | null
  occupancyRate?: number | null
  propertyTax?: number | null
  maintenanceCost?: number | null
  netOperatingIncome?: number | null
  
  // Real Assets fields
  assetType?: string | null
  assetDescription?: string | null
  assetLocation?: string | null
  acquisitionDate?: Date | null
  acquisitionValue?: number | null
  assetCurrentValue?: number | null
  assetIncome?: number | null
  holdingCost?: number | null
  
  // Cash fields
  accountType?: string | null
  accountName?: string | null
  cashInterestRate?: number | null
  balance?: number | null
  currency?: string | null
  cashMaturityDate?: Date | null
  
  // Executive Summary (aggregated from documents)
  period?: string | null
  periodDate?: Date | null
  highlights?: string | null
  lowlights?: string | null
  milestones?: string | null
  recentRounds?: string | null
  capTableChanges?: string | null
  
  // Private Equity Metrics (aggregated from documents)
  revenue?: number | null
  arr?: number | null
  mrr?: number | null
  grossMargin?: number | null
  runRate?: number | null
  burn?: number | null
  runway?: number | null
  headcount?: number | null
  cac?: number | null
  ltv?: number | null
  nrr?: number | null
  cashBalance?: number | null
  
  lastReportDate?: Date | null
  createdAt: Date
  updatedAt: Date
  documents?: DirectInvestmentDocument[]
}
```

---

## 4. UI/Form Requirements

### 4.1 Investment Type Selection

Add a dropdown/select field for `investmentType` with the following options:
- Private Equity (default)
- Private Debt
- Private Credit
- Public Equity
- Real Estate
- Real Assets
- Cash

### 4.2 Conditional Form Fields

Show/hide fields based on the selected `investmentType`:

#### Private Equity
- Show: `industry`, `stage`, `investmentDate`, `investmentAmount`
- Hide: All type-specific fields

#### Private Debt / Private Credit
- Show: `industry`, `investmentDate`, `investmentAmount`
- Show type-specific: `principalAmount`, `interestRate`, `couponRate`, `maturityDate`, `creditRating`, `defaultStatus`, `currentValue`, `yield`

#### Public Equity
- Show: `industry`, `investmentDate`, `investmentAmount`
- Show type-specific: `tickerSymbol`, `shares`, `purchasePrice`, `currentPrice`, `dividends`, `marketValue`
- **Auto-calculate**: `marketValue = shares * currentPrice` (if both are provided)

#### Real Estate
- Show: `industry`, `investmentDate`, `investmentAmount`
- Show type-specific: `propertyType`, `propertyAddress`, `squareFootage`, `purchaseDate`, `purchaseValue`, `currentAppraisal`, `rentalIncome`, `occupancyRate`, `propertyTax`, `maintenanceCost`, `netOperatingIncome`
- **Auto-calculate**: `netOperatingIncome = rentalIncome - propertyTax - maintenanceCost` (if all are provided)

#### Real Assets
- Show: `industry`, `investmentDate`, `investmentAmount`
- Show type-specific: `assetType`, `assetDescription`, `assetLocation`, `acquisitionDate`, `acquisitionValue`, `assetCurrentValue`, `assetIncome`, `holdingCost`

#### Cash
- Show: `industry`, `investmentDate`, `investmentAmount`
- Show type-specific: `accountType`, `accountName`, `cashInterestRate`, `balance`, `currency`, `cashMaturityDate`

### 4.3 Form Validation

- `name`: Required
- `investmentType`: Required, defaults to `PRIVATE_EQUITY`
- All other fields: Optional
- Date fields: Validate ISO date format
- Number fields: Validate numeric values
- `occupancyRate`: Should be between 0 and 1 (or 0-100 if using percentage)
- `currency`: Should be a valid ISO currency code (e.g., "USD", "EUR")

### 4.4 Display/Detail View

When displaying a direct investment, show:
1. **Basic Information**: Name, Investment Type, Industry, Stage, Investment Date, Investment Amount
2. **Type-Specific Section**: Show relevant fields based on `investmentType`
3. **Calculated Metrics**: Display any auto-calculated values (e.g., marketValue, NOI)
4. **Documents**: List of associated documents

---

## 5. Migration Steps for Admin Application

### Step 1: Update Database Schema

Apply the database migration to add new enum value and fields. See `MIGRATION_REAL_ESTATE_REAL_ASSETS.md` for SQL migration script.

### Step 2: Update TypeScript Types

1. Update `DirectInvestment` interface to include all new fields
2. Update `DirectInvestmentDocument` interface if you're tracking type-specific metrics in documents
3. Update enum types to include new investment types

### Step 3: Update API Client

1. Update POST endpoint call to include `investmentType` and type-specific fields
2. Update PUT endpoint call to handle all new fields
3. Ensure date fields are sent as ISO strings
4. Handle `yield` field carefully (it's a reserved word in JavaScript)

### Step 4: Update Forms

1. Add investment type selector
2. Implement conditional field rendering based on selected type
3. Add validation for new fields
4. Implement auto-calculation for computed fields (marketValue, NOI)

### Step 5: Update Display Components

1. Update detail view to show investment type
2. Add conditional sections for type-specific fields
3. Format and display calculated metrics
4. Update list views to show investment type

### Step 6: Testing

Test each investment type:
- Create new investment of each type
- Update existing investment (change type and fields)
- Verify all fields are saved correctly
- Verify conditional fields show/hide correctly
- Verify calculated fields work correctly

---

## 6. Example Implementations

### 6.1 React Form Example (TypeScript)

```typescript
import { useState } from 'react'

type InvestmentType = 'PRIVATE_EQUITY' | 'PRIVATE_DEBT' | 'PRIVATE_CREDIT' | 'PUBLIC_EQUITY' | 'REAL_ESTATE' | 'REAL_ASSETS' | 'CASH'

function DirectInvestmentForm() {
  const [investmentType, setInvestmentType] = useState<InvestmentType>('PRIVATE_EQUITY')
  const [formData, setFormData] = useState({
    name: '',
    investmentType: 'PRIVATE_EQUITY',
    // ... other fields
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Auto-calculate marketValue for Public Equity
    if (investmentType === 'PUBLIC_EQUITY' && formData.shares && formData.currentPrice) {
      formData.marketValue = formData.shares * formData.currentPrice
    }
    
    // Auto-calculate NOI for Real Estate
    if (investmentType === 'REAL_ESTATE' && formData.rentalIncome && formData.propertyTax && formData.maintenanceCost) {
      formData.netOperatingIncome = formData.rentalIncome - formData.propertyTax - formData.maintenanceCost
    }
    
    // Convert dates to ISO strings
    const payload = {
      ...formData,
      investmentDate: formData.investmentDate ? new Date(formData.investmentDate).toISOString() : null,
      maturityDate: formData.maturityDate ? new Date(formData.maturityDate).toISOString() : null,
      // ... other date conversions
    }
    
    await fetch(`/api/admin/clients/${clientId}/direct-investments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <select 
        value={investmentType} 
        onChange={(e) => setInvestmentType(e.target.value as InvestmentType)}
      >
        <option value="PRIVATE_EQUITY">Private Equity</option>
        <option value="PRIVATE_DEBT">Private Debt</option>
        <option value="PRIVATE_CREDIT">Private Credit</option>
        <option value="PUBLIC_EQUITY">Public Equity</option>
        <option value="REAL_ESTATE">Real Estate</option>
        <option value="REAL_ASSETS">Real Assets</option>
        <option value="CASH">Cash</option>
      </select>

      {/* Basic fields */}
      <input name="name" required />
      <input name="industry" />
      {investmentType === 'PRIVATE_EQUITY' && <input name="stage" />}
      <input name="investmentDate" type="date" />
      <input name="investmentAmount" type="number" />

      {/* Conditional fields based on investmentType */}
      {investmentType === 'PUBLIC_EQUITY' && (
        <>
          <input name="tickerSymbol" placeholder="Ticker Symbol" />
          <input name="shares" type="number" placeholder="Shares" />
          <input name="purchasePrice" type="number" placeholder="Purchase Price" />
          <input name="currentPrice" type="number" placeholder="Current Price" />
          {formData.marketValue && <div>Market Value: {formData.marketValue}</div>}
        </>
      )}

      {investmentType === 'REAL_ESTATE' && (
        <>
          <input name="propertyType" placeholder="Property Type" />
          <input name="propertyAddress" placeholder="Address" />
          <input name="squareFootage" type="number" />
          {/* ... other real estate fields */}
        </>
      )}

      {/* Similar conditional blocks for other types */}

      <button type="submit">Create Investment</button>
    </form>
  )
}
```

### 6.2 API Call Example

```typescript
async function createDirectInvestment(clientId: string, data: DirectInvestmentInput) {
  const response = await fetch(`/api/admin/clients/${clientId}/direct-investments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ADMIN_API_KEY || '', // Or use session auth
    },
    body: JSON.stringify({
      name: data.name,
      investmentType: data.investmentType,
      industry: data.industry,
      stage: data.stage,
      investmentDate: data.investmentDate?.toISOString(),
      investmentAmount: data.investmentAmount,
      // Type-specific fields
      ...(data.investmentType === 'PUBLIC_EQUITY' && {
        tickerSymbol: data.tickerSymbol,
        shares: data.shares,
        purchasePrice: data.purchasePrice,
        currentPrice: data.currentPrice,
        marketValue: data.marketValue,
      }),
      // ... other type-specific fields
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create direct investment')
  }
  
  return response.json()
}
```

---

## 7. Important Notes

1. **Backward Compatibility**: Existing Private Equity investments will continue to work. The `investmentType` field defaults to `PRIVATE_EQUITY`.

2. **Field Naming**: Note that `yield` is a reserved word in JavaScript. In API requests, you may need to use `yieldValue` or ensure your API client handles it correctly.

3. **Date Handling**: All date fields should be sent as ISO 8601 strings (e.g., "2024-01-15T00:00:00.000Z") in API requests.

4. **Null vs Undefined**: The API accepts `null` for optional fields. Use `null` explicitly when you want to clear a field, or omit the field entirely if you don't want to change it.

5. **Metrics Aggregation**: Metrics (revenue, arr, mrr, etc.) and executive summary fields are aggregated from documents. Don't try to set them directly on the investment.

6. **Real Estate vs Real Assets**: These are now separate types. Real Estate is for property investments, while Real Assets covers infrastructure, commodities, art, collectibles, etc.

---

## 8. Checklist for Implementation

- [ ] Update database schema (add enum value and fields)
- [ ] Update TypeScript interfaces
- [ ] Update API client functions
- [ ] Add investment type selector to forms
- [ ] Implement conditional field rendering
- [ ] Add form validation
- [ ] Implement auto-calculations (marketValue, NOI)
- [ ] Update detail/display views
- [ ] Update list views to show investment type
- [ ] Test creating each investment type
- [ ] Test updating investments
- [ ] Test changing investment type
- [ ] Verify all fields save correctly
- [ ] Test date field handling
- [ ] Test null/undefined handling

---

## 9. Support

If you encounter any issues during implementation, refer to:
- Main application code: `src/app/api/admin/clients/[clientId]/direct-investments/route.ts`
- Detail view implementation: `src/app/direct-investments/[id]/DirectInvestmentDetailClient.tsx`
- Database schema: `prisma/schema.prisma`

For migration issues, see: `MIGRATION_REAL_ESTATE_REAL_ASSETS.md`

