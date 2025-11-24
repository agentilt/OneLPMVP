# Admin CRUD Endpoints Reference

This document lists all CRUD endpoints needed for the admin project, including all database fields for each entity.

## Table of Contents
1. [Document Model](#document-model)
2. [Fund Model](#fund-model)
3. [DirectInvestment Model](#directinvestment-model)
4. [DirectInvestmentDocument Model](#directinvestmentdocument-model)
5. [Client Model](#client-model)
6. [User Model](#user-model)
7. [Distribution Model](#distribution-model)
8. [NavHistory Model](#navhistory-model)
9. [FundAccess Model](#fundaccess-model)
10. [Invitation Model](#invitation-model)

---

## Document Model

### Fields
```typescript
{
  id: string                    // Auto-generated CUID
  fundId: string                // Required - Fund ID this document belongs to
  type: DocumentType            // Required - Enum: CAPITAL_CALL | QUARTERLY_REPORT | ANNUAL_REPORT | KYC | COMPLIANCE | OTHER
  title: string                 // Required - Document title
  uploadDate: DateTime          // Required - When document was uploaded
  dueDate: DateTime?            // Optional - Payment or action due date
  callAmount: number?           // Optional - Capital call amount (for CAPITAL_CALL type)
  paymentStatus: PaymentStatus? // Optional - Enum: PENDING | PAID | LATE | OVERDUE
  url: string                   // Required - File storage location/URL
  parsedData: Json?             // Optional - Extracted document data (JSON)
  investmentValue: number?      // Optional - Investment value
  createdAt: DateTime           // Auto-generated
  updatedAt: DateTime           // Auto-updated
}
```

### CRUD Endpoints

#### List Documents
**GET** `/api/admin/clients/[clientId]/funds/[fundId]/documents`
- Query params: `?type=CAPITAL_CALL&page=1&limit=50`
- Response: `{ data: Document[] }`

#### Get Single Document
**GET** `/api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId]`
- Response: `{ data: Document }`

#### Create Document
**POST** `/api/admin/clients/[clientId]/funds/[fundId]/documents`
- Body:
```json
{
  "type": "CAPITAL_CALL",
  "title": "Q1 2024 Capital Call",
  "url": "https://storage.example.com/doc.pdf",
  "uploadDate": "2024-01-15T00:00:00Z",
  "dueDate": "2024-02-15T00:00:00Z",
  "callAmount": 50000,
  "paymentStatus": "PENDING",
  "parsedData": { /* optional JSON */ },
  "investmentValue": null
}
```

#### Update Document
**PUT** `/api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId]`
- Body: Same as Create (all fields optional except type, title, url)

#### Delete Document
**DELETE** `/api/admin/clients/[clientId]/funds/[fundId]/documents/[documentId]`
- Response: `{ ok: true }`

---

## Fund Model

### Fields
```typescript
{
  id: string                    // Auto-generated CUID
  userId: string?               // Optional - Legacy owner (backward compatibility)
  clientId: string?             // Optional - Client this fund belongs to
  name: string                  // Required - Fund name
  domicile: string              // Required - Country/jurisdiction
  vintage: number               // Required - Year established
  manager: string               // Required - Fund manager name
  managerEmail: string?         // Optional - Manager contact email
  managerPhone: string?         // Optional - Manager contact phone
  managerWebsite: string?       // Optional - Manager website URL
  commitment: number            // Required - Total committed capital
  paidIn: number                // Required - Capital paid in
  nav: number                   // Required - Net Asset Value
  irr: number                   // Required - Internal Rate of Return (%)
  tvpi: number                  // Required - Total Value to Paid-In ratio
  dpi: number                   // Required - Distributions to Paid-In ratio
  lastReportDate: DateTime      // Required - Last financial report date
  assetClass: string            // Default: "Multi-Strategy"
  strategy: string              // Default: "Generalist"
  sector: string?               // Optional
  baseCurrency: string          // Default: "USD"
  leverage: number              // Default: 0
  preferredReturn: number       // Default: 0.08 (8%)
  
  // Executive Summary Fields (latest from documents)
  period: string?               // Optional - Latest period from documents
  periodDate: DateTime?         // Optional - Latest period date
  highlights: string?           // Optional - Latest highlights (Text)
  lowlights: string?            // Optional - Latest lowlights (Text)
  milestones: string?           // Optional - Latest milestones (Text)
  recentRounds: string?         // Optional - Latest recent rounds (Text)
  capTableChanges: string?      // Optional - Latest cap table changes (Text)
  
  createdAt: DateTime           // Auto-generated
  updatedAt: DateTime           // Auto-updated
}
```

### CRUD Endpoints

#### List Funds
**GET** `/api/admin/clients/[clientId]/funds`
- Query params: `?page=1&limit=50&search=fundname`
- Response: `{ data: Fund[] }`

#### Get Single Fund
**GET** `/api/admin/clients/[clientId]/funds/[fundId]`
- Response: `{ data: Fund }`

#### Create Fund
**POST** `/api/admin/clients/[clientId]/funds`
- Body:
```json
{
  "name": "Venture Fund I",
  "domicile": "United States",
  "vintage": 2020,
  "manager": "ABC Capital",
  "managerEmail": "contact@abccapital.com",
  "managerPhone": "+1-555-0100",
  "managerWebsite": "https://abccapital.com",
  "commitment": 10000000,
  "paidIn": 5000000,
  "nav": 7500000,
  "irr": 15.5,
  "tvpi": 1.5,
  "dpi": 0.3,
  "lastReportDate": "2024-01-01T00:00:00Z",
  "assetClass": "Venture Capital",
  "strategy": "Early Stage",
  "sector": "Technology",
  "baseCurrency": "USD",
  "leverage": 0,
  "preferredReturn": 0.08
}
```

#### Update Fund
**PUT** `/api/admin/clients/[clientId]/funds/[fundId]`
- Body: Same as Create (all fields optional)

#### Delete Fund
**DELETE** `/api/admin/clients/[clientId]/funds/[fundId]`
- Response: `{ ok: true }`

---

## DirectInvestment Model

### Fields
```typescript
{
  id: string                    // Auto-generated CUID
  userId: string?               // Optional - Legacy owner
  clientId: string?             // Optional - Client this investment belongs to
  name: string                  // Required - Company/Issuer name
  investmentType: DirectInvestmentType // Required - Enum: PRIVATE_EQUITY | PRIVATE_DEBT | PRIVATE_CREDIT | PUBLIC_EQUITY | REAL_ESTATE | REAL_ASSETS | CASH
  industry: string?             // Optional
  stage: string?                // Optional - e.g., "Seed", "Series A", "Series B"
  investmentDate: DateTime?     // Optional
  investmentAmount: number?     // Optional
  
  // Private Debt/Credit specific fields
  principalAmount: number?      // Optional
  interestRate: number?         // Optional - Annual interest rate (decimal, e.g., 0.05 for 5%)
  couponRate: number?           // Optional
  maturityDate: DateTime?       // Optional
  creditRating: string?         // Optional - e.g., "AAA", "BB+"
  defaultStatus: string?        // Optional - "CURRENT", "DEFAULTED", "RESTRUCTURED"
  currentValue: number?         // Optional - Current market value
  yield: number?                // Optional - Current yield
  
  // Public Equity specific fields
  tickerSymbol: string?         // Optional - Stock ticker
  shares: number?               // Optional - Number of shares owned
  purchasePrice: number?        // Optional - Average purchase price per share
  currentPrice: number?         // Optional - Current market price per share
  dividends: number?            // Optional - Total dividends received
  marketValue: number?          // Optional - Current market value (shares * currentPrice)
  
  // Real Estate specific fields
  propertyType: string?         // Optional - e.g., "Commercial", "Residential", "Industrial"
  propertyAddress: string?      // Optional
  squareFootage: number?        // Optional
  purchaseDate: DateTime?       // Optional
  purchaseValue: number?        // Optional
  currentAppraisal: number?     // Optional
  rentalIncome: number?         // Optional - Annual rental income
  occupancyRate: number?        // Optional - Occupancy rate (decimal, e.g., 0.95 for 95%)
  propertyTax: number?          // Optional - Annual property tax
  maintenanceCost: number?      // Optional - Annual maintenance costs
  netOperatingIncome: number?   // Optional - NOI
  
  // Real Assets specific fields
  assetType: string?            // Optional - e.g., "Infrastructure", "Commodity", "Art"
  assetDescription: string?     // Optional
  assetLocation: string?        // Optional
  acquisitionDate: DateTime?    // Optional
  acquisitionValue: number?     // Optional
  assetCurrentValue: number?    // Optional
  assetIncome: number?          // Optional - Annual income generated
  holdingCost: number?          // Optional - Annual holding/storage costs
  
  // Cash specific fields
  accountType: string?          // Optional - e.g., "Savings", "Checking", "Money Market", "CD"
  accountName: string?          // Optional - Account name/number identifier
  cashInterestRate: number?     // Optional - Interest rate (decimal)
  balance: number?              // Optional - Current balance
  currency: string?             // Optional - Currency code (e.g., "USD", "EUR")
  cashMaturityDate: DateTime?   // Optional - Maturity date for CDs/Treasury bills
  
  // Aggregated fields - calculated from documents (latest values)
  revenue: number?              // Optional - Latest revenue from documents
  arr: number?                  // Optional - Latest ARR from documents
  mrr: number?                  // Optional - Latest MRR from documents
  grossMargin: number?          // Optional
  runRate: number?              // Optional
  burn: number?                 // Optional - Monthly burn rate
  runway: number?               // Optional - Months of runway
  headcount: number?            // Optional
  cac: number?                  // Optional - Customer Acquisition Cost
  ltv: number?                  // Optional - Lifetime Value
  nrr: number?                  // Optional - Net Revenue Retention
  cashBalance: number?          // Optional - Latest cash balance from documents
  
  // Aggregated executive summary - latest from documents
  period: string?               // Optional
  periodDate: DateTime?         // Optional
  highlights: string?           // Optional (Text)
  lowlights: string?            // Optional (Text)
  milestones: string?           // Optional (Text)
  recentRounds: string?         // Optional (Text)
  capTableChanges: string?      // Optional (Text)
  
  lastReportDate: DateTime?     // Optional - Date of most recent document
  createdAt: DateTime           // Auto-generated
  updatedAt: DateTime           // Auto-updated
}
```

### CRUD Endpoints

#### List Direct Investments
**GET** `/api/admin/clients/[clientId]/direct-investments`
- Query params: `?type=PRIVATE_EQUITY&page=1&limit=50`
- Response: `{ data: DirectInvestment[] }`

#### Get Single Direct Investment
**GET** `/api/admin/clients/[clientId]/direct-investments/[investmentId]`
- Response: `{ data: DirectInvestment }`

#### Create Direct Investment
**POST** `/api/admin/clients/[clientId]/direct-investments`
- Body: (All fields optional except `name` and `investmentType`)

#### Update Direct Investment
**PUT** `/api/admin/clients/[clientId]/direct-investments/[investmentId]`
- Body: Same as Create (all fields optional)

#### Delete Direct Investment
**DELETE** `/api/admin/clients/[clientId]/direct-investments/[investmentId]`
- Response: `{ ok: true }`

---

## DirectInvestmentDocument Model

### Fields
```typescript
{
  id: string                    // Auto-generated CUID
  directInvestmentId: string    // Required - Direct investment ID
  type: DirectInvestmentDocumentType // Required - Enum: EXECUTIVE_SUMMARY | FINANCIAL_STATEMENT | INVESTOR_UPDATE | BOARD_PACKAGE | CAP_TABLE | TERM_SHEET | OTHER
  title: string                 // Required - Document title
  uploadDate: DateTime          // Required - Report date/period date
  dueDate: DateTime?            // Optional
  url: string                   // Required - File storage location
  parsedData: Json?             // Optional - Extracted document data
  
  // Executive Summary Fields - stored per document
  period: string?               // Optional - "Month" or "Quarter"
  periodDate: DateTime?         // Optional - Which month/quarter this represents
  highlights: string?           // Optional (Text)
  lowlights: string?            // Optional (Text)
  milestones: string?           // Optional (Text)
  recentRounds: string?         // Optional (Text)
  capTableChanges: string?      // Optional (Text)
  
  // Metrics Snapshot - stored per document (historical tracking)
  // Private Equity metrics
  revenue: number?              // Optional
  arr: number?                  // Optional - Annual Recurring Revenue
  mrr: number?                  // Optional - Monthly Recurring Revenue
  grossMargin: number?          // Optional
  runRate: number?              // Optional
  burn: number?                 // Optional - Monthly burn rate
  runway: number?               // Optional - Months of runway
  headcount: number?            // Optional
  cac: number?                  // Optional - Customer Acquisition Cost
  ltv: number?                  // Optional - Lifetime Value
  nrr: number?                  // Optional - Net Revenue Retention
  cashBalance: number?          // Optional
  
  // Private Debt/Credit metrics (historical tracking)
  principalAmount: number?      // Optional
  interestRate: number?         // Optional
  couponRate: number?           // Optional
  maturityDate: DateTime?       // Optional
  creditRating: string?         // Optional
  defaultStatus: string?        // Optional
  currentValue: number?         // Optional
  yield: number?                // Optional
  
  // Public Equity metrics (historical tracking)
  tickerSymbol: string?         // Optional
  shares: number?               // Optional
  purchasePrice: number?        // Optional
  currentPrice: number?         // Optional
  dividends: number?            // Optional
  marketValue: number?          // Optional
  
  // Real Estate metrics (historical tracking)
  propertyType: string?         // Optional
  propertyAddress: string?      // Optional
  squareFootage: number?        // Optional
  purchaseDate: DateTime?       // Optional
  purchaseValue: number?        // Optional
  currentAppraisal: number?     // Optional
  rentalIncome: number?         // Optional
  occupancyRate: number?        // Optional
  propertyTax: number?          // Optional
  maintenanceCost: number?      // Optional
  netOperatingIncome: number?   // Optional
  
  // Real Assets metrics (historical tracking)
  assetType: string?            // Optional
  assetDescription: string?     // Optional
  assetLocation: string?        // Optional
  acquisitionDate: DateTime?    // Optional
  acquisitionValue: number?     // Optional
  assetCurrentValue: number?    // Optional
  assetIncome: number?          // Optional
  holdingCost: number?          // Optional
  
  // Cash metrics (historical tracking)
  accountType: string?          // Optional
  accountName: string?          // Optional
  cashInterestRate: number?     // Optional
  balance: number?              // Optional
  currency: string?             // Optional
  cashMaturityDate: DateTime?   // Optional
  
  createdAt: DateTime           // Auto-generated
  updatedAt: DateTime           // Auto-updated
}
```

### CRUD Endpoints

#### List Direct Investment Documents
**GET** `/api/admin/clients/[clientId]/direct-investments/[investmentId]/documents`
- Query params: `?type=EXECUTIVE_SUMMARY&page=1&limit=50`
- Response: `{ data: DirectInvestmentDocument[] }`

#### Get Single Direct Investment Document
**GET** `/api/admin/clients/[clientId]/direct-investments/[investmentId]/documents/[documentId]`
- Response: `{ data: DirectInvestmentDocument }`

#### Create Direct Investment Document
**POST** `/api/admin/clients/[clientId]/direct-investments/[investmentId]/documents`
- Body: (All fields optional except `type`, `title`, `url`, `directInvestmentId`)

#### Update Direct Investment Document
**PUT** `/api/admin/clients/[clientId]/direct-investments/[investmentId]/documents/[documentId]`
- Body: Same as Create (all fields optional)

#### Delete Direct Investment Document
**DELETE** `/api/admin/clients/[clientId]/direct-investments/[investmentId]/documents/[documentId]`
- Response: `{ ok: true }`

---

## Client Model

### Fields
```typescript
{
  id: string                    // Auto-generated CUID
  name: string                  // Required - Client organization name
  email: string?                // Optional - Contact email
  phone: string?                // Optional - Contact phone
  address: string?              // Optional - Physical address
  notes: string?                // Optional - Additional notes
  createdAt: DateTime           // Auto-generated
  updatedAt: DateTime           // Auto-updated
}
```

### CRUD Endpoints

#### List Clients
**GET** `/api/admin/clients`
- Query params: `?page=1&limit=50&search=clientname`
- Response: `{ data: Client[] }`

#### Get Single Client
**GET** `/api/admin/clients/[clientId]`
- Response: `{ data: Client }`

#### Create Client
**POST** `/api/admin/clients`
- Body:
```json
{
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+1-555-0100",
  "address": "123 Main St, City, State 12345",
  "notes": "Primary client"
}
```

#### Update Client
**PUT** `/api/admin/clients/[clientId]`
- Body: Same as Create (all fields optional except `name`)

#### Delete Client
**DELETE** `/api/admin/clients/[clientId]`
- Response: `{ ok: true }`

---

## User Model

### Fields
```typescript
{
  id: string                    // Auto-generated CUID
  email: string                 // Required - Unique email address
  name: string?                 // Optional - Display name
  firstName: string?            // Optional - First name
  lastName: string?             // Optional - Last name
  password: string              // Required - Hashed password (never return in GET)
  role: Role                    // Required - Enum: USER | ADMIN | DATA_MANAGER (default: USER)
  emailVerified: DateTime?      // Optional - Email verification timestamp
  resetToken: string?           // Optional - Password reset token
  resetTokenExpiry: DateTime?   // Optional - Reset token expiration
  mfaEnabled: boolean           // Default: false
  lastLoginAt: DateTime?        // Optional - Last login timestamp
  loginAttempts: number         // Default: 0
  lockedUntil: DateTime?        // Optional - Account lockout expiration
  clientId: string?             // Optional - The client this user belongs to
  termsAcceptedAt: DateTime?    // Optional
  privacyAcceptedAt: DateTime?  // Optional
  websiteTermsAcceptedAt: DateTime? // Optional
  emailWeeklyReports: boolean   // Default: false
  emailMonthlyReports: boolean  // Default: false
  createdAt: DateTime           // Auto-generated
  updatedAt: DateTime           // Auto-updated
}
```

### CRUD Endpoints

#### List Users
**GET** `/api/admin/clients/[clientId]/users`
- Query params: `?role=USER&page=1&limit=50`
- Response: `{ data: User[] }` (password field excluded)

#### Get Single User
**GET** `/api/admin/clients/[clientId]/users/[userId]`
- Response: `{ data: User }` (password field excluded)

#### Create User
**POST** `/api/admin/clients/[clientId]/users`
- Body:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "password": "plaintextpassword", // Will be hashed server-side
  "role": "USER",
  "clientId": "client-id-here"
}
```

#### Update User
**PUT** `/api/admin/clients/[clientId]/users/[userId]`
- Body: Same as Create (all fields optional, password will be hashed if provided)

#### Delete User
**DELETE** `/api/admin/clients/[clientId]/users/[userId]`
- Response: `{ ok: true }`

---

## Distribution Model

### Fields
```typescript
{
  id: string                    // Auto-generated CUID
  fundId: string                // Required - Fund ID
  distributionDate: DateTime    // Required - Date of distribution
  amount: number                // Required - Distribution amount
  distributionType: string      // Default: "CASH" - CASH | STOCK | PIK | RETURN_OF_CAPITAL
  description: string?          // Optional - Description
  taxYear: number?              // Optional - Tax year for the distribution
  k1Status: string?             // Optional - K1 status: "PENDING" | "ISSUED" | "AMENDED"
  createdAt: DateTime           // Auto-generated
  updatedAt: DateTime           // Auto-updated
}
```

### CRUD Endpoints

#### List Distributions
**GET** `/api/admin/clients/[clientId]/funds/[fundId]/distributions`
- Query params: `?year=2024&page=1&limit=50`
- Response: `{ data: Distribution[] }`

#### Get Single Distribution
**GET** `/api/admin/clients/[clientId]/funds/[fundId]/distributions/[distributionId]`
- Response: `{ data: Distribution }`

#### Create Distribution
**POST** `/api/admin/clients/[clientId]/funds/[fundId]/distributions`
- Body:
```json
{
  "distributionDate": "2024-01-15T00:00:00Z",
  "amount": 100000,
  "distributionType": "CASH",
  "description": "Q1 2024 distribution",
  "taxYear": 2024,
  "k1Status": "PENDING"
}
```

#### Update Distribution
**PUT** `/api/admin/clients/[clientId]/funds/[fundId]/distributions/[distributionId]`
- Body: Same as Create (all fields optional)

#### Delete Distribution
**DELETE** `/api/admin/clients/[clientId]/funds/[fundId]/distributions/[distributionId]`
- Response: `{ ok: true }`

---

## NavHistory Model

### Fields
```typescript
{
  id: string                    // Auto-generated CUID
  fundId: string                // Required - Fund ID
  date: DateTime                // Required - NAV date
  nav: number                   // Required - Net Asset Value
  createdAt: DateTime           // Auto-generated
}
```

### CRUD Endpoints

#### List NAV History
**GET** `/api/admin/clients/[clientId]/funds/[fundId]/nav-history`
- Query params: `?startDate=2024-01-01&endDate=2024-12-31&page=1&limit=50`
- Response: `{ data: NavHistory[] }`

#### Get Single NAV Entry
**GET** `/api/admin/clients/[clientId]/funds/[fundId]/nav-history/[navHistoryId]`
- Response: `{ data: NavHistory }`

#### Create NAV Entry
**POST** `/api/admin/clients/[clientId]/funds/[fundId]/nav-history`
- Body:
```json
{
  "date": "2024-01-01T00:00:00Z",
  "nav": 7500000
}
```

#### Update NAV Entry
**PUT** `/api/admin/clients/[clientId]/funds/[fundId]/nav-history/[navHistoryId]`
- Body: Same as Create (all fields optional)

#### Delete NAV Entry
**DELETE** `/api/admin/clients/[clientId]/funds/[fundId]/nav-history/[navHistoryId]`
- Response: `{ ok: true }`

---

## FundAccess Model

### Fields
```typescript
{
  id: string                    // Auto-generated CUID
  userId: string                // Required - User ID
  fundId: string                // Required - Fund ID
  relationshipType: string?     // Optional - "ADVISOR" | "LP" | "CO_INVESTOR" | "INTERNAL_ADMIN"
  permissionLevel: string?      // Default: "READ_ONLY" - "READ_ONLY" | "READ_WRITE" | "ADMIN"
  notes: string?                // Optional
  createdAt: DateTime           // Auto-generated
}
```

### CRUD Endpoints

#### List Fund Access
**GET** `/api/admin/clients/[clientId]/funds/[fundId]/access`
- Response: `{ data: FundAccess[] }`

#### Get Single Fund Access
**GET** `/api/admin/clients/[clientId]/funds/[fundId]/access/[accessId]`
- Response: `{ data: FundAccess }`

#### Create Fund Access
**POST** `/api/admin/clients/[clientId]/funds/[fundId]/access`
- Body:
```json
{
  "userId": "user-id-here",
  "relationshipType": "LP",
  "permissionLevel": "READ_ONLY",
  "notes": "Limited partner access"
}
```

#### Update Fund Access
**PUT** `/api/admin/clients/[clientId]/funds/[fundId]/access/[accessId]`
- Body: Same as Create (all fields optional)

#### Delete Fund Access
**DELETE** `/api/admin/clients/[clientId]/funds/[fundId]/access/[accessId]`
- Response: `{ ok: true }`

---

## Invitation Model

### Fields
```typescript
{
  id: string                    // Auto-generated CUID
  email: string                 // Required - Invitee email
  token: string                 // Required - Unique invitation token
  tokenHash: string?            // Optional - Hashed token
  role: string                  // Default: "USER"
  expiresAt: DateTime           // Required - Expiration timestamp
  usedAt: DateTime?             // Optional - When invitation was used
  used: boolean                 // Default: false
  invitedBy: string             // Required - User ID who sent invitation
  clientId: string?             // Optional - Client ID
  createdAt: DateTime           // Auto-generated
}
```

### CRUD Endpoints

#### List Invitations
**GET** `/api/admin/clients/[clientId]/invitations`
- Query params: `?used=false&page=1&limit=50`
- Response: `{ data: Invitation[] }`

#### Get Single Invitation
**GET** `/api/admin/clients/[clientId]/invitations/[invitationId]`
- Response: `{ data: Invitation }`

#### Create Invitation
**POST** `/api/admin/clients/[clientId]/invitations`
- Body:
```json
{
  "email": "newuser@example.com",
  "role": "USER",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### Update Invitation
**PUT** `/api/admin/clients/[clientId]/invitations/[invitationId]`
- Body: (Limited - mainly for marking as used)

#### Delete Invitation
**DELETE** `/api/admin/clients/[clientId]/invitations/[invitationId]`
- Response: `{ ok: true }`

---

## Enums Reference

### DocumentType
- `CAPITAL_CALL`
- `QUARTERLY_REPORT`
- `ANNUAL_REPORT`
- `KYC`
- `COMPLIANCE`
- `OTHER`

### DirectInvestmentType
- `PRIVATE_EQUITY`
- `PRIVATE_DEBT`
- `PRIVATE_CREDIT`
- `PUBLIC_EQUITY`
- `REAL_ESTATE`
- `REAL_ASSETS`
- `CASH`

### DirectInvestmentDocumentType
- `EXECUTIVE_SUMMARY`
- `FINANCIAL_STATEMENT`
- `INVESTOR_UPDATE`
- `BOARD_PACKAGE`
- `CAP_TABLE`
- `TERM_SHEET`
- `OTHER`

### PaymentStatus
- `PENDING`
- `PAID`
- `LATE`
- `OVERDUE`

### Role
- `USER`
- `ADMIN`
- `DATA_MANAGER`

---

## Authentication

All admin endpoints require authentication via:
1. **NextAuth Session**: User must have `role: "ADMIN"` in their session
2. **API Key**: Header `x-api-key` or `Authorization: Bearer <API_KEY>` matching `ADMIN_API_KEY` env variable

---

## Common Response Formats

### Success Response
```json
{
  "data": { /* entity or array of entities */ }
}
```

### Error Response
```json
{
  "error": "Error message here"
}
```

### Status Codes
- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

1. **Date Formats**: All dates should be in ISO 8601 format: `"2024-01-15T00:00:00Z"`
2. **Pagination**: Use `page` and `limit` query parameters (default: `page=1`, `limit=50`)
3. **Search**: Use `search` query parameter for text search
4. **Filtering**: Use field names as query parameters (e.g., `?type=CAPITAL_CALL`)
5. **Password Handling**: Never return password fields in GET responses. Always hash passwords before storing.
6. **Cascading Deletes**: Deleting a Fund will cascade delete its Documents, NavHistory, and Distributions
7. **Relationships**: Ensure foreign key relationships are valid before creating/updating entities

