# Cursor AI Prompt: Build OneLPM iOS App

## 🎯 Project Overview

I need you to build a native iOS app for **OneLPM** (EuroLP Limited Partner Portal). This is a secure investment portfolio management app for venture capital fund investors (Limited Partners).

The iOS app should provide clients with mobile access to:
- Portfolio dashboard with key metrics
- Fund performance data and charts
- Investment documents
- Cryptocurrency holdings
- Account settings

**Important:** I have comprehensive technical specifications in `IOS_APP_SPECIFICATION.md` that contains all the details. Please read it carefully before starting.

---

## 📋 Requirements

### Technology Stack
- **Language**: Swift (SwiftUI preferred, or UIKit if you prefer)
- **Minimum iOS Version**: iOS 15.0
- **Target iOS Version**: iOS 17.0+
- **Architecture**: MVVM (Model-View-ViewModel)
- **Networking**: URLSession with async/await
- **Storage**: 
  - Keychain for JWT tokens
  - UserDefaults for theme preferences
- **Charts**: Native Charts framework (iOS 16+) or compatible third-party library

### Backend
- **API Base URL**: 
  - Development: `http://localhost:3000`
  - Production: `https://your-domain.com` (configure as needed)
- **Authentication**: JWT Bearer token
- **API Format**: REST with JSON responses

---

## 🏗️ Project Structure

Please create a well-organized Xcode project with the following structure:

```
OneLPM/
├── App/
│   ├── OneLPMApp.swift
│   └── AppDelegate.swift (if needed)
├── Models/
│   ├── User.swift
│   ├── Fund.swift
│   ├── Document.swift
│   ├── PortfolioSummary.swift
│   └── CryptoHolding.swift
├── ViewModels/
│   ├── AuthViewModel.swift
│   ├── DashboardViewModel.swift
│   ├── FundsViewModel.swift
│   ├── FundDetailViewModel.swift
│   ├── CryptoViewModel.swift
│   └── SettingsViewModel.swift
├── Views/
│   ├── Authentication/
│   │   ├── LoginView.swift
│   │   ├── RegisterView.swift
│   │   └── ForgotPasswordView.swift
│   ├── Dashboard/
│   │   ├── DashboardView.swift
│   │   ├── PortfolioSummaryCard.swift
│   │   └── FundCard.swift
│   ├── Funds/
│   │   ├── FundsListView.swift
│   │   └── FundDetailView.swift
│   ├── Crypto/
│   │   └── CryptoView.swift
│   ├── Settings/
│   │   ├── SettingsView.swift
│   │   └── ThemePickerView.swift
│   └── Components/
│       ├── MetricCard.swift
│       ├── DocumentRow.swift
│       └── LoadingView.swift
├── Networking/
│   ├── APIClient.swift
│   ├── APIEndpoint.swift
│   └── APIError.swift
├── Utilities/
│   ├── KeychainHelper.swift
│   ├── ThemeManager.swift
│   ├── FormatHelpers.swift
│   └── ColorExtensions.swift
└── Resources/
    ├── Assets.xcassets
    └── Colors.xcassets
```

---

## 🎨 Design System

### Colors (defined in `IOS_APP_SPECIFICATION.md`)

**Light Mode:**
- Background: `#FFFFFF`
- Foreground: `#171717`
- Slate tones: `#F8FAFC`, `#E2E8F0`, `#CBD5E1`, etc.

**Dark Mode:**
- Background: `#0A0A0A`
- Foreground: `#EDEDED`

**Accent Colors (User-selectable):**
- Blue (default): `#3B82F6`
- Green: `#10B981`
- Purple: `#8B5CF6`
- Orange: `#F97316`

Please implement a `ThemeManager` that:
1. Allows switching between Light/Dark/System themes
2. Allows selecting accent color (Blue/Green/Purple/Orange)
3. Persists preferences in UserDefaults
4. Notifies views when theme changes

### Typography
- Use iOS system fonts (SF Pro)
- Heading: 28pt, Bold
- Subheading: 22pt, Semibold
- Body: 16pt, Regular
- Caption: 14pt, Regular
- Small: 12pt, Regular

### Spacing
- Use consistent spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48 points

### Corner Radius
- Small: 8pt
- Medium: 12pt
- Large: 16pt
- XLarge: 20pt

---

## 🔐 Authentication Flow

### 1. Login
- Screen with email and password fields
- "Login" button sends POST request to `/api/auth/callback/credentials`
- On success:
  - Store JWT token in Keychain
  - Navigate to Dashboard
- On error:
  - Show error message

### 2. Registration (Invitation-only)
- User taps invitation link with token (deep link: `onelpm://register?token=xxx`)
- App validates token via GET `/api/invitations/validate?token=xxx`
- If valid, show registration form:
  - Email (pre-filled)
  - First Name
  - Last Name
  - Password
  - Confirm Password
- Submit to POST `/api/register`
- Auto-login on success

### 3. Token Management
- Store token in Keychain securely
- Include token in all API requests: `Authorization: Bearer <token>`
- Handle 401 responses by logging out user
- Implement token refresh if backend supports it

---

## 📱 Screens to Implement

### Main Tab Bar (4 Tabs)

#### Tab 1: Dashboard
**Endpoint:** GET `/api/dashboard`

**Layout:**
1. **Header:**
   - Large title: "Welcome back, [FirstName]"
   - Subtitle: "Here's your portfolio performance summary"

2. **Portfolio Summary Cards (2x2 Grid):**
   - Total Commitments (blue icon)
   - Total NAV (green icon)
   - Portfolio TVPI (purple icon)
   - Active Capital Calls (orange icon, pulse if > 0)

3. **Investments Section:**
   - "Investments" header with count
   - Horizontal scrolling list of fund cards
   - Each card shows:
     - Fund name
     - Manager, domicile, vintage
     - Sparkline chart (NAV history)
     - TVPI with trend icon
     - Key metrics: Commitment, Paid-in, NAV, DPI
   - Tap card to navigate to Fund Detail

4. **Digital Asset Holdings (if available):**
   - Table showing crypto holdings
   - Symbol, name, amount, USD value
   - Total portfolio value at bottom

5. **Pull-to-Refresh:** Standard iOS refresh control

#### Tab 2: Funds
**Endpoint:** GET `/api/funds`

**Layout:**
- Navigation title: "My Funds"
- Vertical list of fund cards (same design as dashboard)
- Empty state: "No funds available. Contact your fund manager."
- Tap card to navigate to Fund Detail

#### Tab 3: Crypto
**Endpoint:** GET `/api/crypto`

**Layout:**
- Navigation title: "Digital Assets"
- Header card with total portfolio value
- List of holdings:
  - Symbol (e.g., "BTC")
  - Name (e.g., "Bitcoin")
  - Amount (monospace font)
  - USD value
- Empty state: "No cryptocurrency holdings"

#### Tab 4: Settings
**Endpoint:** GET `/api/user/profile`

**Layout:**
- Profile section:
  - Avatar (initials)
  - Name, email
  - Member since date
- Settings list:
  - Appearance (Light/Dark/System)
  - Accent Color (Blue/Green/Purple/Orange)
  - Change Password (triggers password reset email)
  - App Version
- Sign Out button (red, confirmation alert)

### Fund Detail Screen
**Endpoint:** GET `/api/funds/[id]`

**Layout:**
- Navigation bar with back button and fund name
- Header:
  - Fund name (large, bold)
  - Manager, domicile, vintage
- Scrollable content:
  1. **Key Metrics (2-column grid):**
     - Commitment, Paid-in, NAV, TVPI, DPI, IRR
  2. **NAV Chart:**
     - Line chart showing NAV over time
     - Interactive with tooltips
  3. **Documents List:**
     - Document icon, title, type badge
     - Upload date, due date
     - Call amount (if capital call)
     - Payment status badge
     - Tap to open in PDF viewer
  4. **Recent Capital Calls (if any):**
     - Last 3 capital calls
     - Title, amount, due date, status

---

## 🌐 API Integration

### Base API Client

Please implement an `APIClient` class with:
- Singleton pattern
- Base URL configuration (dev/prod)
- JWT token injection from Keychain
- Generic request method with async/await
- Error handling (network errors, HTTP errors, decoding errors)
- 401 handler (logout user)

**Example:**
```swift
class APIClient {
    static let shared = APIClient()
    let baseURL = "http://localhost:3000"
    
    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil
    ) async throws -> T {
        // Implementation here
    }
}
```

### Key Endpoints to Implement

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/callback/credentials` | Login |
| POST | `/api/register` | Register with invitation |
| GET | `/api/invitations/validate?token=xxx` | Validate invitation |
| GET | `/api/dashboard` | Dashboard data |
| GET | `/api/funds` | List of funds |
| GET | `/api/funds/[id]` | Fund details |
| GET | `/api/crypto` | Crypto holdings |
| GET | `/api/user/profile` | User profile |
| POST | `/api/auth/request-password-reset` | Request password reset |

**Full API documentation is in `IOS_APP_SPECIFICATION.md`.**

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
```

**See `IOS_APP_SPECIFICATION.md` for all data models.**

---

## 🎯 Development Steps

### Phase 1: Foundation (Do this first)
1. ✅ Create Xcode project (iOS App, SwiftUI or UIKit)
2. ✅ Setup project structure (folders, files)
3. ✅ Implement color system (Assets.xcassets with all colors)
4. ✅ Implement ThemeManager (light/dark, accent colors)
5. ✅ Create KeychainHelper for secure token storage
6. ✅ Create APIClient with networking layer
7. ✅ Define all data models (User, Fund, Document, etc.)
8. ✅ Implement FormatHelpers (currency, percentage, date formatters)

### Phase 2: Authentication
1. ✅ Create LoginView
2. ✅ Create RegisterView
3. ✅ Create ForgotPasswordView
4. ✅ Implement AuthViewModel
5. ✅ Test login flow
6. ✅ Test registration flow (mock invitation token)

### Phase 3: Main App
1. ✅ Create TabView with 4 tabs
2. ✅ Implement DashboardView and ViewModel
3. ✅ Create FundCard component
4. ✅ Implement FundsListView
5. ✅ Implement FundDetailView with chart
6. ✅ Implement CryptoView
7. ✅ Implement SettingsView

### Phase 4: Components & Polish
1. ✅ Create reusable MetricCard component
2. ✅ Create DocumentRow component
3. ✅ Add pull-to-refresh on Dashboard
4. ✅ Add loading states (skeleton screens or spinners)
5. ✅ Add error handling with user-friendly messages
6. ✅ Add animations (card taps, page transitions)
7. ✅ Test theme switching
8. ✅ Test on different iPhone sizes

### Phase 5: Advanced Features (Optional)
1. ✅ Implement deep linking (invitation URLs)
2. ✅ Add biometric authentication (Face ID/Touch ID)
3. ✅ Implement offline caching
4. ✅ Add haptic feedback
5. ✅ iPad optimization
6. ✅ Accessibility (VoiceOver, Dynamic Type)

---

## 🎨 UI Guidelines

### Card Style
- Background: White (light mode) / Slate 900 (dark mode)
- Border: 1pt, Slate 200 (light) / Slate 800 (dark) with 60% opacity
- Corner radius: 16pt
- Padding: 16pt
- Shadow: Subtle (offset 2pt, radius 8pt, opacity 5%)

### Buttons
- Primary: Accent color background, white text, bold, 12pt corner radius
- Secondary: Clear background, accent color text
- Destructive: Red background, white text

### Status Badges
- Small rounded rectangle (4pt corner radius)
- Padding: 4pt horizontal, 2pt vertical
- Font: 10pt, Medium
- Colors:
  - PENDING: Yellow background, dark yellow text
  - PAID: Green background, dark green text
  - LATE/OVERDUE: Red background, dark red text

### Animations
- Button tap: Scale 0.95, spring back
- Card tap: Scale 0.98, navigate
- Loading: Standard iOS activity indicator
- Capital call badge: Pulse animation (scale 1.0 → 1.05 → 1.0)

---

## 🧪 Testing

### Manual Testing Checklist
Please ensure the following work correctly:

**Authentication:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (show error)
- [ ] Register with invitation token
- [ ] Logout (clear token, return to login)

**Dashboard:**
- [ ] Load portfolio summary
- [ ] Display fund cards
- [ ] Display crypto holdings (if available)
- [ ] Pull-to-refresh updates data
- [ ] Tap fund card navigates to detail

**Funds:**
- [ ] List all accessible funds
- [ ] Navigate to fund detail
- [ ] Display NAV chart
- [ ] Display documents
- [ ] Open document in viewer

**Crypto:**
- [ ] Display holdings list
- [ ] Show total value
- [ ] Empty state when no holdings

**Settings:**
- [ ] View profile info
- [ ] Switch theme (light/dark/system)
- [ ] Change accent color
- [ ] Request password reset
- [ ] Sign out

**Offline/Error Handling:**
- [ ] Show error when network unavailable
- [ ] Show error when API returns 500
- [ ] Handle 401 (logout user)
- [ ] Handle empty states gracefully

---

## 📦 Deliverables

Please provide:

1. **Xcode Project**
   - Clean, organized code
   - Proper folder structure
   - Comments for complex logic
   - SwiftLint compliant (if possible)

2. **README.md**
   - Setup instructions
   - How to configure API base URL
   - How to run the app
   - List of features implemented

3. **Configuration**
   - Environment configuration (dev/prod URLs)
   - Color assets properly organized
   - App icons (placeholder is fine)

4. **Documentation**
   - Brief code architecture overview
   - Any known issues or limitations
   - Future improvements

---

## ⚙️ Configuration

### API Base URL
Please make the base URL configurable via a `Configuration.swift` file:

```swift
enum Configuration {
    static let apiBaseURL: String = {
        #if DEBUG
        return "http://localhost:3000"
        #else
        return "https://your-production-domain.com"
        #endif
    }()
}
```

### App Information
- App Name: OneLPM
- Bundle ID: `com.onelpm.ios` (or as specified)
- Deployment Target: iOS 15.0

---

## 🚨 Important Notes

1. **Security:**
   - Always use Keychain for token storage (never UserDefaults)
   - Use HTTPS in production
   - Implement certificate pinning (optional, but recommended)

2. **Data Format:**
   - Dates from API are in ISO 8601 format
   - Use `JSONDecoder` with date decoding strategy:
     ```swift
     let decoder = JSONDecoder()
     decoder.dateDecodingStrategy = .iso8601
     ```

3. **Error Handling:**
   - Always show user-friendly error messages
   - Log errors for debugging
   - Don't expose sensitive error details to user

4. **Performance:**
   - Use lazy loading for lists
   - Cache images (if any)
   - Optimize chart rendering

5. **Accessibility:**
   - Support Dynamic Type
   - Add accessibility labels
   - Test with VoiceOver

---

## 📚 Resources

Refer to `IOS_APP_SPECIFICATION.md` for:
- Complete color palette with hex codes
- Full API endpoint documentation
- Detailed data models
- Wireframes and layout guidelines
- Formatting utilities (currency, percentage, date)
- Sample code snippets

---

## 🎯 Success Criteria

The iOS app is ready when:

1. ✅ User can login and view dashboard
2. ✅ All fund data displays correctly
3. ✅ NAV charts render properly
4. ✅ Documents are accessible
5. ✅ Theme switching works (light/dark)
6. ✅ Accent color selection works
7. ✅ App looks good on iPhone (various sizes)
8. ✅ No crashes or major bugs
9. ✅ Code is clean and maintainable
10. ✅ App follows iOS design guidelines

---

## 📋 Step-by-Step Instructions for You, Cursor AI

1. **Start by reading `IOS_APP_SPECIFICATION.md`** to understand the full context.

2. **Create the Xcode project:**
   - iOS App template
   - SwiftUI (preferred) or UIKit
   - Minimum deployment: iOS 15.0

3. **Setup the foundation (in order):**
   - Create folder structure
   - Add color assets to Assets.xcassets
   - Implement ThemeManager
   - Implement KeychainHelper
   - Implement APIClient
   - Define all data models
   - Create FormatHelpers

4. **Build authentication:**
   - LoginView
   - RegisterView (with token validation)
   - AuthViewModel
   - Test login flow

5. **Build main app:**
   - TabView with 4 tabs
   - DashboardView
   - FundsListView
   - FundDetailView (with chart)
   - CryptoView
   - SettingsView

6. **Add components:**
   - FundCard
   - MetricCard
   - DocumentRow
   - LoadingView

7. **Polish:**
   - Animations
   - Error handling
   - Empty states
   - Pull-to-refresh

8. **Test everything** using the testing checklist above.

9. **Document** the code and create README.

---

## 🆘 Need Help?

If you encounter any issues or need clarification:
- Refer to `IOS_APP_SPECIFICATION.md` for detailed specs
- Check the web app code in the parent directory for reference
- Ask me for clarification on specific requirements

---

## 🚀 Let's Build!

I'm excited to see the OneLPM iOS app come to life! Please start with Phase 1 (Foundation) and work your way through the phases. Feel free to ask questions as you go.

**Note:** The backend API is already running at `http://localhost:3000` during development. You can test all endpoints immediately.

Let's create an amazing iOS experience for our Limited Partners! 🎉

