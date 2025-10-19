# OneLPM iOS App - Quick Start Guide

## 🎯 What You're Building

A native iOS app for **OneLPM** (Limited Partner Portal) that allows venture capital fund investors to:
- View portfolio dashboard with key metrics
- Access fund performance data and charts
- Read investment documents
- Monitor cryptocurrency holdings
- Manage account settings

---

## 📚 Documentation Files

You have **3 key documents** in this directory:

### 1. `IOS_APP_SPECIFICATION.md` ⭐️ (Main Reference)
**Complete technical specification** including:
- Full design system (colors, typography, spacing)
- All API endpoints with request/response examples
- Complete data models
- Screen layouts and wireframes
- Authentication flow
- Security best practices
- Testing strategies

👉 **Read this first for comprehensive details**

### 2. `IOS_APP_CURSOR_PROMPT.md` 🤖
**Ready-to-use Cursor AI prompt** for creating the iOS app:
- Step-by-step instructions for AI
- Development phases
- Code structure
- Testing checklist
- Success criteria

👉 **Copy this into a new Cursor project to start building**

### 3. `IOS_APP_QUICKSTART.md` ⚡️ (This File)
**Quick reference** with essential info

---

## 🚀 How to Use These Documents

### Option 1: Use Cursor AI (Recommended)
1. Create a new directory for your iOS project
2. Open it in Cursor
3. Copy the contents of `IOS_APP_CURSOR_PROMPT.md`
4. Paste into Cursor chat
5. Also copy `IOS_APP_SPECIFICATION.md` into the project directory
6. Let Cursor build the app step by step
7. Reference the specification as needed

### Option 2: Manual Development
1. Read `IOS_APP_SPECIFICATION.md` thoroughly
2. Create Xcode project
3. Follow the architecture and design system
4. Implement features according to the spec
5. Test using the provided checklists

---

## 🎨 Design System Summary

### Colors
- **Light Mode:** White background (#FFFFFF), Dark foreground (#171717)
- **Dark Mode:** Dark background (#0A0A0A), Light foreground (#EDEDED)
- **Accent (Selectable):** Blue #3B82F6 | Green #10B981 | Purple #8B5CF6 | Orange #F97316

### Typography
- SF Pro (iOS system font)
- Sizes: 28pt (heading), 22pt (subheading), 16pt (body), 14pt (caption), 12pt (small)

### Spacing
4, 8, 12, 16, 20, 24, 32, 40, 48 points

### Corners
8pt (small), 12pt (medium), 16pt (large), 20pt (xlarge)

---

## 🔐 Authentication

### JWT Token-Based
1. Login → POST `/api/auth/callback/credentials`
2. Store token in Keychain
3. Add to all requests: `Authorization: Bearer <token>`
4. Handle 401 → logout user

### Invitation-Only Registration
- User receives email with token
- Validate: GET `/api/invitations/validate?token=xxx`
- Register: POST `/api/register`

---

## 📱 App Structure

### 4 Main Tabs

#### 1. Dashboard
- Portfolio summary (4 metric cards)
- Fund cards (horizontal scroll)
- Crypto holdings table
- **Endpoint:** GET `/api/dashboard`

#### 2. Funds
- List of all accessible funds
- Tap → Fund detail with chart & documents
- **Endpoints:** GET `/api/funds`, GET `/api/funds/[id]`

#### 3. Crypto
- Cryptocurrency holdings list
- Total portfolio value
- **Endpoint:** GET `/api/crypto`

#### 4. Settings
- Profile info
- Theme selection (Light/Dark/System)
- Accent color picker
- Password reset
- Logout

---

## 🌐 Key API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/callback/credentials` | Login |
| POST | `/api/register` | Register with invitation |
| GET | `/api/invitations/validate?token=xxx` | Validate invitation token |
| GET | `/api/dashboard` | Dashboard data (summary + funds + crypto) |
| GET | `/api/funds` | List of funds |
| GET | `/api/funds/[id]` | Fund details with documents |
| GET | `/api/crypto` | Crypto holdings |
| GET | `/api/user/profile` | User profile |
| POST | `/api/auth/request-password-reset` | Password reset request |

**Base URL:** 
- Dev: `http://localhost:3000`
- Prod: `https://your-domain.com`

---

## 📊 Core Data Models

### User
```swift
struct User: Codable {
    let id: String
    let email: String
    let firstName: String?
    let lastName: String?
    let role: UserRole  // USER, ADMIN, DATA_MANAGER
    let createdAt: Date
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
    let tvpi: Double
    let dpi: Double
    let lastReportDate: Date
    let navHistory: [NavHistoryPoint]
}
```

### Document
```swift
struct Document: Codable, Identifiable {
    let id: String
    let type: DocumentType  // CAPITAL_CALL, QUARTERLY_REPORT, etc.
    let title: String
    let uploadDate: Date
    let dueDate: Date?
    let callAmount: Double?
    let paymentStatus: PaymentStatus?  // PENDING, PAID, LATE, OVERDUE
    let url: String
}
```

---

## 🏗️ Project Structure

```
OneLPM/
├── App/                    # App entry point
├── Models/                 # Data models (User, Fund, Document, etc.)
├── ViewModels/             # MVVM view models
├── Views/
│   ├── Authentication/     # Login, Register, Forgot Password
│   ├── Dashboard/          # Dashboard + components
│   ├── Funds/              # Fund list & detail
│   ├── Crypto/             # Crypto holdings
│   ├── Settings/           # Settings & profile
│   └── Components/         # Reusable components
├── Networking/
│   ├── APIClient.swift     # Network layer
│   └── APIError.swift
├── Utilities/
│   ├── KeychainHelper.swift
│   ├── ThemeManager.swift
│   ├── FormatHelpers.swift
│   └── ColorExtensions.swift
└── Resources/
    ├── Assets.xcassets     # Images
    └── Colors.xcassets     # Color assets
```

---

## 🛠️ Development Phases

### Phase 1: Foundation ✅
1. Create Xcode project (iOS 15.0+)
2. Setup project structure
3. Implement color system
4. Create ThemeManager
5. Create KeychainHelper
6. Build APIClient
7. Define data models
8. Create format helpers

### Phase 2: Authentication ✅
1. LoginView
2. RegisterView
3. ForgotPasswordView
4. AuthViewModel
5. Test flows

### Phase 3: Main App ✅
1. TabView (4 tabs)
2. DashboardView
3. FundsListView
4. FundDetailView (with chart)
5. CryptoView
6. SettingsView

### Phase 4: Polish ✅
1. Reusable components
2. Loading states
3. Error handling
4. Animations
5. Pull-to-refresh
6. Theme switching

---

## 🎯 Essential Features

### Must-Have (MVP)
- ✅ Login/Logout
- ✅ Dashboard with portfolio summary
- ✅ Fund list and detail views
- ✅ NAV chart (line chart)
- ✅ Document viewing
- ✅ Theme switching (light/dark)
- ✅ Secure token storage

### Nice-to-Have
- ⭐ Biometric authentication (Face ID/Touch ID)
- ⭐ Deep linking (invitation URLs)
- ⭐ Offline caching
- ⭐ Haptic feedback
- ⭐ iPad optimization
- ⭐ Widgets

---

## 🔧 Key Utilities to Implement

### 1. KeychainHelper
```swift
class KeychainHelper {
    static func saveToken(_ token: String)
    static func getToken() -> String?
    static func deleteToken()
}
```

### 2. ThemeManager
```swift
class ThemeManager: ObservableObject {
    @Published var theme: Theme  // light, dark, system
    @Published var accentColor: AccentColor  // blue, green, purple, orange
}
```

### 3. APIClient
```swift
class APIClient {
    static let shared = APIClient()
    func request<T: Decodable>(endpoint: String, method: HTTPMethod, body: Encodable?) async throws -> T
}
```

### 4. Format Helpers
```swift
extension Double {
    func formatCurrency() -> String  // "$1,000,000"
    func formatPercent() -> String   // "15.5%"
    func formatMultiple() -> String  // "1.30x"
}

extension Date {
    func formatShort() -> String     // "Dec 31, 2024"
}
```

---

## 🧪 Testing Checklist

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error message)
- [ ] Register with invitation token
- [ ] Logout and return to login

### Dashboard
- [ ] Load and display portfolio summary
- [ ] Show fund cards
- [ ] Show crypto holdings
- [ ] Pull-to-refresh works
- [ ] Navigate to fund detail

### Funds
- [ ] List all funds
- [ ] View fund details
- [ ] Display NAV chart
- [ ] Show documents
- [ ] Open document viewer

### Settings
- [ ] View profile
- [ ] Switch theme (light/dark/system)
- [ ] Change accent color
- [ ] Request password reset
- [ ] Sign out

### Error Handling
- [ ] Network error shown
- [ ] 401 logs user out
- [ ] 500 error handled
- [ ] Empty states displayed

---

## 🎨 UI Components

### Card Style
```
Background: White (light) / Slate 900 (dark)
Border: 1pt Slate 200/800, 60% opacity
Corner: 16pt radius
Padding: 16pt
Shadow: Subtle (2pt offset, 8pt radius, 5% opacity)
```

### Buttons
```
Primary: Accent color, white text, 12pt corners
Secondary: Clear bg, accent text
Destructive: Red bg, white text
```

### Animations
```
Tap: Scale 0.95 → spring back
Loading: iOS activity indicator
Pulse: Scale 1.0 → 1.05 → 1.0 (for capital calls)
```

---

## 📦 Deliverables

When complete, you should have:

1. **Xcode Project**
   - Clean code
   - Organized structure
   - Comments where needed

2. **README.md**
   - Setup instructions
   - Configuration guide
   - Features list

3. **Working App**
   - All 4 tabs functional
   - Authentication working
   - Data loading from API
   - Theme switching
   - No crashes

---

## 🚨 Important Reminders

### Security
- ✅ Use Keychain for tokens (never UserDefaults)
- ✅ HTTPS in production
- ✅ Handle 401 globally (logout)

### Data Format
- ✅ Dates are ISO 8601 format
- ✅ Use JSONDecoder with `.iso8601` strategy

### Performance
- ✅ Lazy loading for lists
- ✅ Optimize chart rendering
- ✅ Cache when possible

### Accessibility
- ✅ Support Dynamic Type
- ✅ Add accessibility labels
- ✅ Test with VoiceOver

---

## 🔗 URLs & Configuration

### Backend API
```swift
#if DEBUG
let baseURL = "http://localhost:3000"
#else
let baseURL = "https://your-production-domain.com"
#endif
```

### Deep Linking
```
URL Scheme: onelpm://
Invitation: onelpm://register?token=xxx
Fund Detail: onelpm://funds/[fundId]
```

---

## 📞 Next Steps

### To Start Building:

1. **With Cursor AI:**
   ```bash
   # Create new directory
   mkdir OneLPM-iOS
   cd OneLPM-iOS
   
   # Open in Cursor
   cursor .
   
   # Copy IOS_APP_SPECIFICATION.md into this directory
   # Copy IOS_APP_CURSOR_PROMPT.md content into Cursor chat
   # Let Cursor build the app
   ```

2. **Manually:**
   ```bash
   # Open Xcode
   # Create new iOS App project
   # Name: OneLPM
   # Interface: SwiftUI (or UIKit)
   # Language: Swift
   # Minimum Deployment: iOS 15.0
   
   # Start implementing according to IOS_APP_SPECIFICATION.md
   ```

### Backend Setup
Ensure the backend is running:
```bash
cd /path/to/OneLPMVP
npm run dev
# Backend runs at http://localhost:3000
```

### Test Credentials
```
Admin: admin@eurolp.com / SecurePassword123!
Demo User: demo@eurolp.com / demo123
```

---

## 🎉 Ready to Build!

You now have everything you need to create the OneLPM iOS app:

✅ **Complete technical specification** (IOS_APP_SPECIFICATION.md)  
✅ **AI-ready prompt** (IOS_APP_CURSOR_PROMPT.md)  
✅ **Quick reference guide** (this file)  
✅ **Backend API** (already running)  
✅ **Design system** (colors, typography, components)  
✅ **Data models** (Swift structs defined)  
✅ **API documentation** (all endpoints documented)

**Let's create an amazing iOS experience! 📱✨**

---

## 📚 Additional Resources

### In the Main Project
- `README.md` - Full web app documentation
- `PROJECT_SUMMARY.md` - Project overview
- `prisma/schema.prisma` - Database schema
- `src/app/` - Web app code for reference
- `src/components/` - UI components (for design inspiration)

### Apple Documentation
- [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [URLSession](https://developer.apple.com/documentation/foundation/urlsession)
- [Keychain Services](https://developer.apple.com/documentation/security/keychain_services)
- [Charts Framework](https://developer.apple.com/documentation/charts) (iOS 16+)

### Community Resources
- [Hacking with Swift](https://www.hackingwithswift.com/)
- [Swift by Sundell](https://www.swiftbysundell.com/)
- [objc.io](https://www.objc.io/)

---

**Version:** 1.0  
**Last Updated:** January 2025  
**Author:** OneLPM Development Team

---

*Happy Coding! 🚀*

