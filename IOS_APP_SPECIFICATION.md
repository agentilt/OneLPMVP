# OneLPM iOS App - Technical Specification

## 📱 Overview

This document provides comprehensive specifications for building an iOS native app for the OneLPM (EuroLP) Limited Partner Portal. The iOS app will provide clients with mobile access to their investment portfolio, fund performance data, documents, and account management.

## 🎯 Platform Summary

**OneLPM** is a secure, invitation-only portal for venture capital fund investors (Limited Partners) to access their portfolio information, documents, and fund performance data.

### Web Platform Tech Stack
- **Backend**: Next.js 15 with API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (JWT-based)
- **Hosting**: TBD (Vercel/AWS/etc.)

### Base URL
```
Development: http://localhost:3000
Production: https://your-domain.com
```

---

## 🎨 Design System

### Color Palette

#### Light Mode
```swift
// Background & Foreground
let backgroundColor = UIColor(hex: "#FFFFFF")
let foregroundColor = UIColor(hex: "#171717")

// Slate tones (for cards, borders)
let slate50 = UIColor(hex: "#F8FAFC")
let slate100 = UIColor(hex: "#F1F5F9")
let slate200 = UIColor(hex: "#E2E8F0")
let slate300 = UIColor(hex: "#CBD5E1")
let slate400 = UIColor(hex: "#94A3B8")
let slate500 = UIColor(hex: "#64748B")
let slate600 = UIColor(hex: "#475569")
let slate700 = UIColor(hex: "#334155")
let slate800 = UIColor(hex: "#1E293B")
let slate900 = UIColor(hex: "#0F172A")
let slate950 = UIColor(hex: "#020617")
```

#### Dark Mode
```swift
let backgroundColorDark = UIColor(hex: "#0A0A0A")
let foregroundColorDark = UIColor(hex: "#EDEDED")
```

#### Theme Colors (User-selectable)

**Blue (Default)**
```swift
let accentBlue = UIColor(hex: "#3B82F6")
let accentBlueHover = UIColor(hex: "#2563EB")
```

**Green**
```swift
let accentGreen = UIColor(hex: "#10B981")
let accentGreenHover = UIColor(hex: "#059669")
```

**Purple**
```swift
let accentPurple = UIColor(hex: "#8B5CF6")
let accentPurpleHover = UIColor(hex: "#7C3AED")
```

**Orange**
```swift
let accentOrange = UIColor(hex: "#F97316")
let accentOrangeHover = UIColor(hex: "#EA580C")
```

#### Status Colors
```swift
// Success/Positive
let successColor = UIColor(hex: "#10B981")
let successBackground = UIColor(hex: "#D1FAE5")

// Warning
let warningColor = UIColor(hex: "#F59E0B")
let warningBackground = UIColor(hex: "#FEF3C7")

// Error/Danger
let errorColor = UIColor(hex: "#EF4444")
let errorBackground = UIColor(hex: "#FEE2E2")

// Info
let infoColor = UIColor(hex: "#3B82F6")
let infoBackground = UIColor(hex: "#DBEAFE")
```

### Typography

```swift
// Font Family: SF Pro (iOS System Font) - matches Arial/Helvetica aesthetic
let headingFont = UIFont.systemFont(ofSize: 28, weight: .bold)
let subheadingFont = UIFont.systemFont(ofSize: 22, weight: .semibold)
let bodyFont = UIFont.systemFont(ofSize: 16, weight: .regular)
let bodyBoldFont = UIFont.systemFont(ofSize: 16, weight: .semibold)
let captionFont = UIFont.systemFont(ofSize: 14, weight: .regular)
let smallFont = UIFont.systemFont(ofSize: 12, weight: .regular)
let tinyFont = UIFont.systemFont(ofSize: 10, weight: .medium)

// Line Heights
let lineHeightBase: CGFloat = 1.6
```

### Spacing System

```swift
let spacing4: CGFloat = 4
let spacing8: CGFloat = 8
let spacing12: CGFloat = 12
let spacing16: CGFloat = 16
let spacing20: CGFloat = 20
let spacing24: CGFloat = 24
let spacing32: CGFloat = 32
let spacing40: CGFloat = 40
let spacing48: CGFloat = 48
```

### Corner Radius

```swift
let radiusSmall: CGFloat = 8     // Small elements
let radiusMedium: CGFloat = 12   // Cards, buttons
let radiusLarge: CGFloat = 16    // Large cards
let radiusXLarge: CGFloat = 20   // Hero elements
```

### Shadows

```swift
// Light shadow for cards
let shadowLight = (
    color: UIColor.black.withAlphaComponent(0.05),
    offset: CGSize(width: 0, height: 2),
    radius: 8
)

// Medium shadow for elevated cards
let shadowMedium = (
    color: UIColor.black.withAlphaComponent(0.1),
    offset: CGSize(width: 0, height: 4),
    radius: 12
)

// Large shadow for modals
let shadowLarge = (
    color: UIColor.black.withAlphaComponent(0.2),
    offset: CGSize(width: 0, height: 8),
    radius: 20
)
```

### Animations

```swift
let animationFast: TimeInterval = 0.2
let animationNormal: TimeInterval = 0.3
let animationSlow: TimeInterval = 0.5
let animationVerySlow: TimeInterval = 0.6

// Spring animations for interactive elements
let springDamping: CGFloat = 0.8
let springVelocity: CGFloat = 0.5
```

---

## 🔐 Authentication

### Authentication Flow

1. **Login**
   - User enters email and password
   - App sends credentials to `/api/auth/callback/credentials`
   - Receives JWT token
   - Store token securely in Keychain
   - Navigate to Dashboard

2. **Registration** (Invitation-only)
   - User receives email with invitation link containing token
   - User opens invitation link (deep link to app)
   - App validates token via `/api/invitations/validate`
   - User fills registration form
   - App posts to `/api/register`
   - Auto-login after successful registration

3. **Session Management**
   - JWT token valid for 30 days
   - Store token in iOS Keychain
   - Include token in all API requests: `Authorization: Bearer <token>`
   - Refresh token before expiry (if refresh endpoint is added)
   - Handle 401 responses by redirecting to login

4. **Password Reset**
   - User enters email on reset screen
   - App posts to `/api/auth/request-password-reset`
   - User receives email with reset link
   - Opens link in browser (not deep linked)
   - Completes reset on web
   - Returns to app to login

### API Endpoints

#### POST `/api/auth/callback/credentials`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Error):**
```json
{
  "error": "Invalid credentials"
}
```

#### POST `/api/register`
**Request:**
```json
{
  "token": "invitation-token-here",
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (Success):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### GET `/api/invitations/validate?token=xxx`
**Response:**
```json
{
  "valid": true,
  "email": "user@example.com"
}
```

---

## 📊 Data Models

### User
```swift
struct User: Codable {
    let id: String
    let email: String
    let name: String?
    let firstName: String?
    let lastName: String?
    let role: UserRole
    let createdAt: Date
}

enum UserRole: String, Codable {
    case USER
    case ADMIN
    case DATA_MANAGER
}
```

### Fund
```swift
struct Fund: Codable, Identifiable {
    let id: String
    let name: String
    let domicile: String
    let vintage: Int
    let manager: String
    let commitment: Double
    let paidIn: Double
    let nav: Double
    let irr: Double
    let tvpi: Double
    let dpi: Double
    let lastReportDate: Date
    let navHistory: [NavHistoryPoint]
    let documents: [Document]?
}

struct NavHistoryPoint: Codable, Identifiable {
    let id: String
    let date: Date
    let nav: Double
}
```

### Document
```swift
struct Document: Codable, Identifiable {
    let id: String
    let type: DocumentType
    let title: String
    let uploadDate: Date
    let dueDate: Date?
    let callAmount: Double?
    let paymentStatus: PaymentStatus?
    let url: String
    let parsedData: [String: Any]?
}

enum DocumentType: String, Codable {
    case CAPITAL_CALL
    case QUARTERLY_REPORT
    case ANNUAL_REPORT
    case KYC
    case COMPLIANCE
    case OTHER
}

enum PaymentStatus: String, Codable {
    case PENDING
    case PAID
    case LATE
    case OVERDUE
}
```

### Portfolio Summary
```swift
struct PortfolioSummary: Codable {
    let totalCommitment: Double
    let totalNav: Double
    let portfolioTvpi: Double
    let activeCapitalCalls: Int
}
```

### Crypto Holding
```swift
struct CryptoHolding: Codable, Identifiable {
    let id: String
    let symbol: String
    let name: String
    let amount: Double
    let valueUsd: Double
}
```

---

## 🌐 API Endpoints

All endpoints require authentication via `Authorization: Bearer <token>` header (except login/register/validate).

### Dashboard

#### GET `/api/dashboard`
**Description:** Fetch portfolio summary, funds list, and crypto holdings

**Response:**
```json
{
  "portfolioSummary": {
    "totalCommitment": 5000000.0,
    "totalNav": 6500000.0,
    "portfolioTvpi": 1.3,
    "activeCapitalCalls": 2
  },
  "funds": [
    {
      "id": "fund1",
      "name": "Tech Ventures Fund I",
      "domicile": "Luxembourg",
      "vintage": 2020,
      "manager": "Acme Capital",
      "commitment": 1000000.0,
      "paidIn": 800000.0,
      "nav": 950000.0,
      "irr": 0.15,
      "tvpi": 1.19,
      "dpi": 0.05,
      "lastReportDate": "2024-12-31T00:00:00Z",
      "navHistory": [
        { "id": "nh1", "date": "2023-12-31T00:00:00Z", "nav": 850000.0 },
        { "id": "nh2", "date": "2024-06-30T00:00:00Z", "nav": 900000.0 },
        { "id": "nh3", "date": "2024-12-31T00:00:00Z", "nav": 950000.0 }
      ]
    }
  ],
  "cryptoHoldings": [
    {
      "id": "ch1",
      "symbol": "BTC",
      "name": "Bitcoin",
      "amount": 0.5,
      "valueUsd": 25000.0
    }
  ]
}
```

### Funds

#### GET `/api/funds`
**Description:** List all funds accessible to the user

**Response:**
```json
{
  "funds": [/* Array of Fund objects */]
}
```

#### GET `/api/funds/[id]`
**Description:** Get detailed fund information including documents

**Response:**
```json
{
  "fund": {
    "id": "fund1",
    "name": "Tech Ventures Fund I",
    "domicile": "Luxembourg",
    "vintage": 2020,
    "manager": "Acme Capital",
    "commitment": 1000000.0,
    "paidIn": 800000.0,
    "nav": 950000.0,
    "irr": 0.15,
    "tvpi": 1.19,
    "dpi": 0.05,
    "lastReportDate": "2024-12-31T00:00:00Z",
    "navHistory": [/* NAV history array */],
    "documents": [
      {
        "id": "doc1",
        "type": "CAPITAL_CALL",
        "title": "Capital Call #5",
        "uploadDate": "2025-01-15T00:00:00Z",
        "dueDate": "2025-02-15T00:00:00Z",
        "callAmount": 50000.0,
        "paymentStatus": "PENDING",
        "url": "/uploads/documents/doc1.pdf",
        "parsedData": {
          "callNumber": "5",
          "percentage": "5%"
        }
      }
    ]
  }
}
```

### Crypto Holdings

#### GET `/api/crypto`
**Description:** Get user's cryptocurrency holdings

**Response:**
```json
{
  "holdings": [
    {
      "id": "ch1",
      "symbol": "BTC",
      "name": "Bitcoin",
      "amount": 0.5,
      "valueUsd": 25000.0
    },
    {
      "id": "ch2",
      "symbol": "ETH",
      "name": "Ethereum",
      "amount": 10.0,
      "valueUsd": 20000.0
    }
  ],
  "totalValue": 45000.0
}
```

### User Settings

#### GET `/api/user/profile`
**Description:** Get current user profile

**Response:**
```json
{
  "user": {
    "id": "user1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2024-01-15T00:00:00Z"
  }
}
```

#### POST `/api/auth/request-password-reset`
**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset email sent"
}
```

### Documents

#### GET `/api/funds/[fundId]/documents`
**Description:** Get all documents for a specific fund

**Response:**
```json
{
  "documents": [/* Array of Document objects */]
}
```

---

## 📱 App Screens

### 1. Authentication Screens

#### 1.1 Login Screen
- Email input field
- Password input field (with show/hide toggle)
- "Login" button (full-width, accent color)
- "Forgot Password?" link
- OneLPM logo at top
- Error message display area

#### 1.2 Registration Screen
- Invitation token validation (auto-filled from deep link)
- Email field (pre-filled if from invitation)
- First Name field
- Last Name field
- Password field (with requirements shown)
- Confirm Password field
- "Create Account" button
- Terms & conditions checkbox

#### 1.3 Forgot Password Screen
- Email input field
- "Send Reset Link" button
- Back to login link
- Success message display

---

### 2. Main Tab Navigation

Use iOS native tab bar with 4 tabs:

#### Tab 1: Dashboard
- Icon: House/Home icon
- Badge: Show count of active capital calls

#### Tab 2: Funds
- Icon: Briefcase icon

#### Tab 3: Crypto
- Icon: Bitcoin/Crypto icon

#### Tab 4: Settings
- Icon: Gear icon

---

### 3. Dashboard Screen

#### Header Section
- Large title: "Welcome back, [FirstName]"
- Subtitle: "Here's your portfolio performance summary"
- Gradient background (subtle)

#### Portfolio Overview Cards (Grid: 2x2)
1. **Total Commitments**
   - Icon: Dollar sign (blue gradient circle)
   - Label: "TOTAL COMMITMENTS"
   - Value: Formatted currency
   - Small trend indicator

2. **Total NAV**
   - Icon: Trending up (green gradient circle)
   - Label: "TOTAL NAV"
   - Value: Formatted currency
   - Percentage change

3. **Portfolio TVPI**
   - Icon: Briefcase (purple gradient circle)
   - Label: "PORTFOLIO TVPI"
   - Value: Multiple (e.g., "1.30x")

4. **Active Capital Calls**
   - Icon: Alert circle (orange gradient circle)
   - Label: "ACTIVE CAPITAL CALLS"
   - Value: Count
   - Pulse animation if > 0

#### Investments Section
- Section header: "Investments" with fund count
- Scrollable horizontal collection of Fund Cards
- Each card shows:
  - Fund name (bold)
  - Manager, domicile, vintage (small text)
  - Sparkline chart (mini NAV history)
  - TVPI indicator with trend icon
  - Commitment, Paid-in, NAV, DPI metrics
  - Tap to navigate to fund detail

#### Digital Asset Holdings Section (if user has crypto)
- Section header: "Digital Asset Holdings"
- Table/List view:
  - Asset name + symbol
  - Amount held
  - USD value
  - Row tap to expand/show details
- Total portfolio value at bottom (bold)

#### Pull-to-Refresh
- Standard iOS refresh control at top

---

### 4. Funds List Screen

#### Navigation Bar
- Title: "My Funds"
- Search bar (filter by name, manager)

#### Fund Cards (Vertical List)
- Same card design as dashboard
- Each card tappable to navigate to detail
- Empty state: "No funds available. Contact your fund manager."

---

### 5. Fund Detail Screen

#### Navigation Bar
- Back button
- Fund name as title
- Share button (optional)

#### Header
- Fund name (large, bold)
- Manager name
- Domicile + Vintage (icons + text)

#### Content Layout (Scrollable)

**Key Metrics Section**
- Grid of metric cards (2 columns):
  - Commitment
  - Paid-in Capital
  - NAV (highlighted in accent color)
  - TVPI
  - DPI
  - IRR (if available)

**NAV Chart Section**
- Section title: "NAV Over Time"
- Line chart (using Charts framework in iOS 16+)
- X-axis: Dates
- Y-axis: NAV values
- Interactive: tap to show value tooltip

**Documents Section**
- Section title: "Fund Documents"
- List of documents:
  - Document icon
  - Title
  - Type badge (colored)
  - Upload date
  - Due date (if capital call)
  - Call amount (if capital call)
  - Payment status badge
  - Tap to open document viewer or external PDF viewer

**Recent Capital Calls Section** (if any)
- Section title: "Recent Capital Calls"
- List of last 3 capital calls:
  - Title
  - Amount (large, bold, accent color)
  - Due date
  - Status badge (PENDING/PAID)

---

### 6. Crypto Holdings Screen

#### Navigation Bar
- Title: "Digital Assets"
- Refresh button

#### Header Card
- Total Portfolio Value (large, centered)
- Percentage change (24h, if available)

#### Holdings List
- Each row:
  - Crypto icon/logo (optional)
  - Symbol (e.g., "BTC")
  - Name (e.g., "Bitcoin")
  - Amount held (mono font)
  - USD value (bold)
- Section footer: Total value

#### Empty State
- Icon: Crypto symbol
- Text: "No cryptocurrency holdings"
- Subtext: "Your digital asset portfolio will appear here"

---

### 7. Settings Screen

#### Profile Section
- User avatar placeholder (initials)
- Name (bold)
- Email (gray)
- Member since date

#### Settings List

**Theme Selection**
- Row: "Appearance"
- Tap to show theme picker modal
- Options: Light, Dark, System Default

**Accent Color Selection**
- Row: "Accent Color"
- Show current color swatch
- Tap to show color picker modal
- Options: Blue, Green, Purple, Orange

**Security**
- Row: "Change Password"
- Tap to request password reset email
- Alert: "Password reset email sent to [email]"

**About**
- Row: "App Version"
- Value: "1.0.0"

**Logout**
- Red button: "Sign Out"
- Confirmation alert
- Clear keychain and return to login

---

## 🛠️ Technical Requirements

### iOS Version
- Minimum: iOS 15.0
- Target: iOS 17.0+

### Architecture
- **Pattern**: MVVM (Model-View-ViewModel)
- **Navigation**: SwiftUI NavigationStack or UIKit UINavigationController
- **State Management**: SwiftUI @StateObject/@ObservedObject or Combine
- **Networking**: URLSession with async/await
- **Local Storage**: 
  - UserDefaults for theme preferences
  - Keychain for JWT tokens
  - CoreData or Realm (optional, for offline caching)

### Networking Layer

```swift
class APIClient {
    static let shared = APIClient()
    let baseURL = "https://your-domain.com"
    
    private var authToken: String? {
        get { KeychainHelper.getToken() }
        set { KeychainHelper.saveToken(newValue) }
    }
    
    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil
    ) async throws -> T {
        var request = URLRequest(url: URL(string: baseURL + endpoint)!)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            if httpResponse.statusCode == 401 {
                // Unauthorized - logout user
                await MainActor.run { logout() }
            }
            throw APIError.httpError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    }
}
```

### Deep Linking
- Support URL scheme: `onelpm://`
- Invitation link: `onelpm://register?token=xxx`
- Fund detail: `onelpm://funds/[fundId]`

### Offline Support (Optional)
- Cache dashboard data
- Cache fund details
- Show cached data with "Last updated" timestamp
- Sync on network available

### Security
- Use Keychain for token storage
- Enable App Transport Security (HTTPS only)
- Implement biometric authentication (Face ID/Touch ID) for login
- Certificate pinning (optional, for production)

---

## 🎯 User Stories

### As a Limited Partner (Client), I want to:

1. **Authentication**
   - ✅ Login with my email and password
   - ✅ Register using an invitation token
   - ✅ Request a password reset via email
   - ✅ Stay logged in (remember me)
   - ✅ Use Face ID/Touch ID for quick login

2. **Dashboard**
   - ✅ See my total portfolio summary at a glance
   - ✅ View total commitments, NAV, TVPI, and active capital calls
   - ✅ See all my funds with key metrics
   - ✅ View my cryptocurrency holdings
   - ✅ Pull to refresh to get latest data

3. **Funds**
   - ✅ View a list of all my accessible funds
   - ✅ See fund details including performance metrics
   - ✅ View NAV history chart
   - ✅ Access fund documents
   - ✅ See capital call notices with due dates and amounts

4. **Documents**
   - ✅ View all documents for a fund
   - ✅ Open PDFs in-app or external viewer
   - ✅ See document metadata (type, upload date, due date)
   - ✅ Filter documents by type

5. **Crypto**
   - ✅ View all my cryptocurrency holdings
   - ✅ See total portfolio value in USD
   - ✅ View individual asset amounts and values

6. **Settings**
   - ✅ View my profile information
   - ✅ Change app theme (light/dark)
   - ✅ Select accent color (blue/green/purple/orange)
   - ✅ Request password reset
   - ✅ Log out securely

---

## 📐 Wireframes & Layout Guidelines

### Card Component Pattern
```
┌─────────────────────────────────┐
│ ┌──────┐                        │ ← Icon (gradient circle)
│ │ Icon │  Title                 │
│ └──────┘  Subtitle              │
│                                 │
│ Large Value (bold)              │ ← Main metric
│ Secondary text                  │ ← Label
│                                 │
│ [Optional: Chart/Sparkline]    │
└─────────────────────────────────┘
```

### Spacing
- Card padding: 16pt
- Section spacing: 24pt
- Element spacing: 12pt
- Safe area insets: Respected on all screens

### Colors in Components
- Card backgrounds: White (light mode) / Slate 900 (dark mode)
- Borders: Slate 200 (light) / Slate 800 (dark) with 60% opacity
- Text primary: Foreground color
- Text secondary: Foreground with 60% opacity
- Text tertiary: Foreground with 40% opacity

---

## 🔄 API Integration Checklist

### Setup
- [ ] Configure base URL (dev/prod)
- [ ] Implement authentication header injection
- [ ] Setup JSON encoder/decoder with date formatting
- [ ] Implement error handling for network failures
- [ ] Handle 401 (unauthorized) globally

### Endpoints to Implement
- [ ] POST `/api/auth/callback/credentials` - Login
- [ ] POST `/api/register` - Registration
- [ ] GET `/api/invitations/validate` - Validate token
- [ ] GET `/api/dashboard` - Dashboard data
- [ ] GET `/api/funds` - Funds list
- [ ] GET `/api/funds/[id]` - Fund details
- [ ] GET `/api/crypto` - Crypto holdings
- [ ] GET `/api/user/profile` - User profile
- [ ] POST `/api/auth/request-password-reset` - Password reset

### Testing
- [ ] Test with mock data first
- [ ] Test error scenarios (network failure, 401, 404, 500)
- [ ] Test with real backend
- [ ] Test deep linking
- [ ] Test biometric authentication
- [ ] Test theme persistence
- [ ] Test offline behavior

---

## 🎨 Animation Guidelines

### Card Interactions
- **Tap**: Scale down to 0.95, spring back
- **Hover** (iPad): Subtle lift effect (y: -2pt)
- **Loading**: Skeleton screens with shimmer effect

### Page Transitions
- **Push**: Standard iOS slide from right
- **Modal**: Sheet presentation with medium detent
- **Tab Switch**: Cross-fade

### Data Loading
- **Initial Load**: Skeleton UI
- **Refresh**: Standard pull-to-refresh spinner
- **Infinite Scroll**: Bottom loading indicator

### Micro-interactions
- **Button Press**: Scale + haptic feedback
- **Success**: Checkmark animation + haptic
- **Error**: Shake animation + haptic
- **Capital Call Badge**: Pulse animation (scale 1.0 → 1.05 → 1.0, repeat)

---

## 📦 Deliverables

### Phase 1: MVP (Core Features)
1. Authentication (Login, Register, Logout)
2. Dashboard with portfolio summary
3. Funds list and detail screens
4. Basic document viewing
5. Settings (theme, logout)
6. Keychain integration

### Phase 2: Enhanced Features
1. Crypto holdings screen
2. Advanced document viewer (in-app PDF)
3. Biometric authentication
4. Deep linking
5. Pull-to-refresh
6. Offline caching

### Phase 3: Polish
1. Animations and transitions
2. Haptic feedback
3. Accessibility (VoiceOver, Dynamic Type)
4. Localization support
5. iPad optimization
6. Widget (portfolio summary)

---

## 🧪 Testing Strategy

### Unit Tests
- API client methods
- Data model decoding
- Formatters (currency, percentage, date)
- Keychain helper

### UI Tests
- Login flow
- Registration flow
- Navigation between screens
- Pull-to-refresh
- Deep linking

### Manual Testing Checklist
- [ ] Login with valid/invalid credentials
- [ ] Register with invitation token
- [ ] View dashboard with/without data
- [ ] Navigate to fund details
- [ ] View documents
- [ ] Switch themes
- [ ] Change accent colors
- [ ] Request password reset
- [ ] Logout
- [ ] Test on iPhone (various sizes)
- [ ] Test on iPad
- [ ] Test in light/dark mode
- [ ] Test with slow network
- [ ] Test with no network
- [ ] Test with expired token (401)

---

## 📚 Resources

### Icons
- Use SF Symbols for iOS native icons
- Custom icons for crypto (Bitcoin, Ethereum, etc.)

### Charts
- iOS 16+: Native Charts framework (SwiftUI)
- iOS 15: Third-party library (e.g., SwiftUICharts)

### PDF Viewing
- Native PDFKit for in-app viewing
- Or use `QLPreviewController` for system viewer

### Networking Libraries (Optional)
- Alamofire (if preferred over URLSession)
- Combine for reactive networking

### Color Extension
```swift
extension UIColor {
    convenience init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            red: CGFloat(r) / 255,
            green: CGFloat(g) / 255,
            blue: CGFloat(b) / 255,
            alpha: CGFloat(a) / 255
        )
    }
}
```

---

## 🚀 Deployment

### App Store Submission
- Bundle ID: `com.yourcompany.onelpm`
- Version: 1.0.0
- Privacy manifest (required in iOS 17+)
- App icons (all sizes)
- Screenshots (iPhone, iPad, 6.5", 5.5")
- App description
- Keywords
- Support URL
- Privacy policy URL

### TestFlight Beta
- Distribute to internal testers first
- External beta testers (limited partners)
- Collect feedback via TestFlight
- Iterate before public release

---

## 📞 Support & Documentation

### Backend API Documentation
- Full API docs: [Link to backend API docs or Swagger/OpenAPI]
- GraphQL schema (if applicable)

### Design Assets
- Figma/Sketch files (if available)
- Logo files (SVG, PNG)
- Brand guidelines

### Contact
- Backend team: [Email/Slack]
- Design team: [Email/Slack]
- Product manager: [Email/Slack]

---

## ✅ Success Criteria

The iOS app is considered successful when:

1. ✅ Users can login and view their portfolio
2. ✅ All fund data displays correctly
3. ✅ NAV charts render accurately
4. ✅ Documents are accessible and viewable
5. ✅ Theme switching works in light/dark mode
6. ✅ App is responsive on iPhone and iPad
7. ✅ No crashes in production
8. ✅ 4.5+ star rating on App Store
9. ✅ Load times < 2 seconds on average network
10. ✅ Passes Apple App Review guidelines

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained by:** Development Team

---

## Appendix A: Formatting Utilities

```swift
// Currency Formatter
extension Double {
    func formatCurrency(currency: String = "USD") -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: self)) ?? "$0"
    }
}

// Percentage Formatter
extension Double {
    func formatPercent(decimals: Int = 2) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .percent
        formatter.minimumFractionDigits = decimals
        formatter.maximumFractionDigits = decimals
        return formatter.string(from: NSNumber(value: self)) ?? "0%"
    }
}

// Multiple Formatter (e.g., 1.25x)
extension Double {
    func formatMultiple(decimals: Int = 2) -> String {
        return String(format: "%.\(decimals)fx", self)
    }
}

// Date Formatter
extension Date {
    func formatShort() -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: self)
    }
}
```

---

## Appendix B: Sample Environment Configuration

```swift
enum Environment {
    case development
    case staging
    case production
    
    static var current: Environment {
        #if DEBUG
        return .development
        #else
        return .production
        #endif
    }
    
    var baseURL: String {
        switch self {
        case .development:
            return "http://localhost:3000"
        case .staging:
            return "https://staging.onelpm.com"
        case .production:
            return "https://app.onelpm.com"
        }
    }
}
```

---

*End of iOS App Technical Specification*

