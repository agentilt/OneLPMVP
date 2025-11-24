# Admin CRUD Quick Reference

## Endpoint Structure Pattern
All admin endpoints follow this pattern:
- Base: `/api/admin/clients/[clientId]`
- Resources: `/funds`, `/direct-investments`, `/users`, `/invitations`
- Nested: `/funds/[fundId]/documents`, `/funds/[fundId]/distributions`, `/funds/[fundId]/nav-history`, `/funds/[fundId]/access`
- Direct Investment nested: `/direct-investments/[investmentId]/documents`

## Required CRUD Operations by Entity

### 1. Document (Fund Documents)
**Base Path**: `/api/admin/clients/[clientId]/funds/[fundId]/documents`

**Required Fields**:
- `type` (DocumentType enum)
- `title` (string)
- `url` (string)
- `uploadDate` (DateTime)
- `fundId` (string, from URL)

**Optional Fields**:
- `dueDate`, `callAmount`, `paymentStatus`, `parsedData`, `investmentValue`

**Operations**: GET (list), GET (single), POST, PUT, DELETE

---

### 2. Fund
**Base Path**: `/api/admin/clients/[clientId]/funds`

**Required Fields**:
- `name`, `domicile`, `vintage`, `manager`, `commitment`, `paidIn`, `nav`, `irr`, `tvpi`, `dpi`, `lastReportDate`

**Optional Fields**:
- `userId`, `clientId`, `managerEmail`, `managerPhone`, `managerWebsite`, `assetClass`, `strategy`, `sector`, `baseCurrency`, `leverage`, `preferredReturn`, `period`, `periodDate`, `highlights`, `lowlights`, `milestones`, `recentRounds`, `capTableChanges`

**Operations**: GET (list), GET (single), POST, PUT, DELETE

---

### 3. DirectInvestment
**Base Path**: `/api/admin/clients/[clientId]/direct-investments`

**Required Fields**:
- `name`, `investmentType` (DirectInvestmentType enum)

**Optional Fields**: (Many - see full reference for complete list)
- Basic: `userId`, `clientId`, `industry`, `stage`, `investmentDate`, `investmentAmount`
- Private Debt/Credit: `principalAmount`, `interestRate`, `couponRate`, `maturityDate`, `creditRating`, `defaultStatus`, `currentValue`, `yield`
- Public Equity: `tickerSymbol`, `shares`, `purchasePrice`, `currentPrice`, `dividends`, `marketValue`
- Real Estate: `propertyType`, `propertyAddress`, `squareFootage`, `purchaseDate`, `purchaseValue`, `currentAppraisal`, `rentalIncome`, `occupancyRate`, `propertyTax`, `maintenanceCost`, `netOperatingIncome`
- Real Assets: `assetType`, `assetDescription`, `assetLocation`, `acquisitionDate`, `acquisitionValue`, `assetCurrentValue`, `assetIncome`, `holdingCost`
- Cash: `accountType`, `accountName`, `cashInterestRate`, `balance`, `currency`, `cashMaturityDate`
- Aggregated metrics: `revenue`, `arr`, `mrr`, `grossMargin`, `runRate`, `burn`, `runway`, `headcount`, `cac`, `ltv`, `nrr`, `cashBalance`
- Executive summary: `period`, `periodDate`, `highlights`, `lowlights`, `milestones`, `recentRounds`, `capTableChanges`

**Operations**: GET (list), GET (single), POST, PUT, DELETE

---

### 4. DirectInvestmentDocument
**Base Path**: `/api/admin/clients/[clientId]/direct-investments/[investmentId]/documents`

**Required Fields**:
- `type` (DirectInvestmentDocumentType enum)
- `title` (string)
- `url` (string)
- `uploadDate` (DateTime)
- `directInvestmentId` (string, from URL)

**Optional Fields**: (Many - see full reference)
- Executive Summary: `period`, `periodDate`, `highlights`, `lowlights`, `milestones`, `recentRounds`, `capTableChanges`
- All metric fields (same as DirectInvestment aggregated fields)
- `dueDate`, `parsedData`

**Operations**: GET (list), GET (single), POST, PUT, DELETE

---

### 5. Client
**Base Path**: `/api/admin/clients`

**Required Fields**:
- `name`

**Optional Fields**:
- `email`, `phone`, `address`, `notes`

**Operations**: GET (list), GET (single), POST, PUT, DELETE

---

### 6. User
**Base Path**: `/api/admin/clients/[clientId]/users`

**Required Fields**:
- `email`, `password` (will be hashed)

**Optional Fields**:
- `name`, `firstName`, `lastName`, `role` (default: USER), `clientId`, `emailVerified`, `mfaEnabled`, `emailWeeklyReports`, `emailMonthlyReports`, etc.

**Operations**: GET (list), GET (single), POST, PUT, DELETE

---

### 7. Distribution
**Base Path**: `/api/admin/clients/[clientId]/funds/[fundId]/distributions`

**Required Fields**:
- `distributionDate`, `amount`

**Optional Fields**:
- `distributionType` (default: "CASH"), `description`, `taxYear`, `k1Status`

**Operations**: GET (list), GET (single), POST, PUT, DELETE

---

### 8. NavHistory
**Base Path**: `/api/admin/clients/[clientId]/funds/[fundId]/nav-history`

**Required Fields**:
- `date`, `nav`

**Optional Fields**: None

**Operations**: GET (list), GET (single), POST, PUT, DELETE

---

### 9. FundAccess
**Base Path**: `/api/admin/clients/[clientId]/funds/[fundId]/access`

**Required Fields**:
- `userId`, `fundId` (from URL)

**Optional Fields**:
- `relationshipType`, `permissionLevel` (default: "READ_ONLY"), `notes`

**Operations**: GET (list), GET (single), POST, PUT, DELETE

---

### 10. Invitation
**Base Path**: `/api/admin/clients/[clientId]/invitations`

**Required Fields**:
- `email`, `expiresAt`

**Optional Fields**:
- `role` (default: "USER"), `token` (auto-generated), `tokenHash`, `usedAt`, `used`, `invitedBy`, `clientId`

**Operations**: GET (list), GET (single), POST, PUT, DELETE

---

## Enum Values

### DocumentType
`CAPITAL_CALL`, `QUARTERLY_REPORT`, `ANNUAL_REPORT`, `KYC`, `COMPLIANCE`, `OTHER`

### DirectInvestmentType
`PRIVATE_EQUITY`, `PRIVATE_DEBT`, `PRIVATE_CREDIT`, `PUBLIC_EQUITY`, `REAL_ESTATE`, `REAL_ASSETS`, `CASH`

### DirectInvestmentDocumentType
`EXECUTIVE_SUMMARY`, `FINANCIAL_STATEMENT`, `INVESTOR_UPDATE`, `BOARD_PACKAGE`, `CAP_TABLE`, `TERM_SHEET`, `OTHER`

### PaymentStatus
`PENDING`, `PAID`, `LATE`, `OVERDUE`

### Role
`USER`, `ADMIN`, `DATA_MANAGER`

---

## Authentication
- Header: `x-api-key: <ADMIN_API_KEY>` OR
- NextAuth session with `role: "ADMIN"`

---

## Common Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `search` - Text search
- Field filters - Use field names as query params (e.g., `?type=CAPITAL_CALL`)

---

## Response Format
```json
{
  "data": { /* entity or array */ }
}
```

Error:
```json
{
  "error": "Error message"
}
```

---

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

