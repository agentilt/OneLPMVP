# 📱 OneLPM iOS App Documentation

Welcome! This directory contains everything you need to build a native iOS app for the **OneLPM** (EuroLP Limited Partner Portal).

---

## 📚 Documentation Index

### 1. 🚀 **START HERE:** [IOS_APP_QUICKSTART.md](./IOS_APP_QUICKSTART.md)
**Quick reference guide** with essential information at a glance:
- What you're building (overview)
- How to use the documentation
- Design system summary
- Key API endpoints
- Development phases
- Testing checklist

👉 **Read this first** to get oriented!

---

### 2. 📖 **COMPLETE SPEC:** [IOS_APP_SPECIFICATION.md](./IOS_APP_SPECIFICATION.md)
**Comprehensive technical specification** (100+ pages) covering:
- Complete design system (colors, typography, spacing, shadows, animations)
- Full API documentation with request/response examples
- All data models (Swift structs)
- Screen-by-screen layouts and wireframes
- Authentication flow
- Security best practices
- Testing strategies
- Code samples and utilities
- Deployment guidelines

👉 **Reference this** when building specific features

---

### 3. 🤖 **FOR AI:** [IOS_APP_CURSOR_PROMPT.md](./IOS_APP_CURSOR_PROMPT.md)
**Ready-to-use Cursor AI prompt** for automated development:
- Step-by-step instructions for AI
- Project structure
- Development phases
- Code architecture
- Testing checklist
- Success criteria

👉 **Copy this** into a new Cursor project to let AI build the app

---

### 4. 🧪 **API TESTING:** [IOS_API_TESTING_GUIDE.md](./IOS_API_TESTING_GUIDE.md)
**API testing guide** with curl commands and examples:
- Authentication requests (login, register, password reset)
- Dashboard/portfolio endpoints
- Funds and fund detail endpoints
- Crypto holdings endpoint
- User profile endpoint
- Error handling examples
- Testing tips and tricks
- Postman collection setup

👉 **Use this** to test the backend API before/during iOS development

---

## 🎯 What You're Building

A **native iOS app** for venture capital fund investors (Limited Partners) to:

✅ View portfolio dashboard with key metrics  
✅ Access fund performance data and charts  
✅ Read investment documents (capital calls, reports)  
✅ Monitor cryptocurrency holdings  
✅ Manage account settings and preferences  

### Key Features
- 🔐 **Secure JWT authentication** with Keychain storage
- 📊 **Real-time portfolio metrics** (commitments, NAV, TVPI)
- 📈 **Interactive NAV charts** using iOS Charts framework
- 📄 **Document viewer** with PDF support
- 🎨 **Theme switching** (Light/Dark/System)
- 🎨 **Accent color selection** (Blue/Green/Purple/Orange)
- 📱 **Responsive design** for iPhone and iPad
- 🔔 **Push notifications** (optional, future)

---

## 🚀 Quick Start

### Option 1: Build with Cursor AI (Recommended)

1. **Create new iOS project directory:**
   ```bash
   mkdir OneLPM-iOS
   cd OneLPM-iOS
   ```

2. **Open in Cursor:**
   ```bash
   cursor .
   ```

3. **Copy documentation:**
   ```bash
   cp /path/to/OneLPMVP/IOS_APP_SPECIFICATION.md .
   cp /path/to/OneLPMVP/IOS_APP_CURSOR_PROMPT.md .
   ```

4. **Start building:**
   - Open `IOS_APP_CURSOR_PROMPT.md`
   - Copy entire contents
   - Paste into Cursor chat
   - Let Cursor build the app step by step

5. **Reference as needed:**
   - Keep `IOS_APP_SPECIFICATION.md` open for detailed reference
   - Use `IOS_API_TESTING_GUIDE.md` to test backend

### Option 2: Build Manually

1. **Read documentation:**
   - Start with `IOS_APP_QUICKSTART.md`
   - Study `IOS_APP_SPECIFICATION.md` thoroughly
   - Review `IOS_API_TESTING_GUIDE.md` for API details

2. **Create Xcode project:**
   - Open Xcode
   - New Project → iOS → App
   - Name: OneLPM
   - Interface: SwiftUI (or UIKit)
   - Language: Swift
   - Minimum Deployment: iOS 15.0

3. **Follow the spec:**
   - Implement features according to `IOS_APP_SPECIFICATION.md`
   - Use design system exactly as documented
   - Test APIs using examples in `IOS_API_TESTING_GUIDE.md`

---

## 🎨 Design Overview

### Theme
- **Modern, clean interface** matching the web app
- **Light and Dark mode** support
- **User-selectable accent colors** (Blue, Green, Purple, Orange)
- **Smooth animations** and transitions
- **iOS native design patterns** (SF Symbols, system fonts)

### Color Palette
```
Light Mode:
- Background: #FFFFFF
- Foreground: #171717
- Cards: White with subtle shadows

Dark Mode:
- Background: #0A0A0A
- Foreground: #EDEDED
- Cards: Slate 900 with borders

Accent Colors (User Choice):
- Blue: #3B82F6 (default)
- Green: #10B981
- Purple: #8B5CF6
- Orange: #F97316
```

---

## 📱 App Structure

### Main Navigation (Tab Bar)

#### 1️⃣ Dashboard
- Portfolio summary (4 metric cards)
- Fund cards (horizontal scroll)
- Crypto holdings table
- Pull-to-refresh

#### 2️⃣ Funds
- List of all funds
- Fund detail with chart
- Document viewer
- Capital call notices

#### 3️⃣ Crypto
- Cryptocurrency holdings
- Total portfolio value
- Individual asset details

#### 4️⃣ Settings
- Profile information
- Theme selection
- Accent color picker
- Password reset
- Sign out

---

## 🔐 Authentication

### Flow
1. **Login** → POST `/api/auth/callback/credentials`
2. **Store JWT token** in iOS Keychain
3. **Include token** in all API requests: `Authorization: Bearer <token>`
4. **Handle 401** → Log out user

### Invitation-Based Registration
- User receives email with invitation link
- App validates token: GET `/api/invitations/validate?token=xxx`
- User fills registration form
- App posts to: POST `/api/register`
- Auto-login on success

---

## 🌐 Backend API

### Base URLs
```
Development: http://localhost:3000
Production: https://your-domain.com
```

### Key Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/callback/credentials` | POST | Login |
| `/api/register` | POST | Register with invitation |
| `/api/dashboard` | GET | Portfolio summary + funds + crypto |
| `/api/funds` | GET | List of funds |
| `/api/funds/[id]` | GET | Fund details with documents |
| `/api/crypto` | GET | Crypto holdings |
| `/api/user/profile` | GET | User profile |
| `/api/auth/request-password-reset` | POST | Request password reset |

**Full API documentation:** [IOS_API_TESTING_GUIDE.md](./IOS_API_TESTING_GUIDE.md)

---

## 🛠️ Technology Stack

### iOS
- **Language:** Swift
- **UI Framework:** SwiftUI (preferred) or UIKit
- **Minimum iOS:** 15.0
- **Target iOS:** 17.0+
- **Architecture:** MVVM (Model-View-ViewModel)

### Networking
- **HTTP Client:** URLSession with async/await
- **JSON:** Codable protocol
- **Authentication:** JWT Bearer tokens

### Storage
- **Secure:** Keychain (for JWT tokens)
- **Preferences:** UserDefaults (for theme settings)
- **Cache (Optional):** CoreData or Realm

### UI Libraries
- **Charts:** Native Charts framework (iOS 16+)
- **Icons:** SF Symbols (built-in)
- **PDF Viewer:** PDFKit (built-in)

---

## 📊 Development Phases

### Phase 1: Foundation ✅
- Xcode project setup
- Color system implementation
- ThemeManager
- KeychainHelper
- APIClient
- Data models
- Format helpers

### Phase 2: Authentication ✅
- LoginView
- RegisterView
- ForgotPasswordView
- AuthViewModel
- Token management

### Phase 3: Main App ✅
- TabView (4 tabs)
- DashboardView
- FundsListView
- FundDetailView (with chart)
- CryptoView
- SettingsView

### Phase 4: Polish ✅
- Reusable components
- Loading states
- Error handling
- Animations
- Pull-to-refresh
- Theme switching

### Phase 5: Advanced (Optional) ⭐
- Biometric authentication
- Deep linking
- Offline caching
- Haptic feedback
- iPad optimization
- Widgets

---

## 🧪 Testing

### Prerequisites
1. Backend is running: `npm run dev`
2. Database is seeded with test data
3. Test credentials available

### Test Credentials
```
Admin: admin@eurolp.com / SecurePassword123!
Demo User: demo@eurolp.com / demo123
```

### Testing Checklist
- [ ] Login with valid/invalid credentials
- [ ] Register with invitation token
- [ ] View dashboard data
- [ ] Navigate to fund details
- [ ] Display NAV chart
- [ ] View documents
- [ ] View crypto holdings
- [ ] Switch themes
- [ ] Change accent colors
- [ ] Request password reset
- [ ] Sign out
- [ ] Handle network errors
- [ ] Handle 401 (unauthorized)

**Full testing guide:** [IOS_API_TESTING_GUIDE.md](./IOS_API_TESTING_GUIDE.md)

---

## 📦 Deliverables

When the iOS app is complete, you should have:

1. **Xcode Project**
   - Clean, organized code
   - Proper folder structure
   - SwiftLint compliant (optional)
   - Comments where needed

2. **README.md** (in iOS project)
   - Setup instructions
   - Configuration guide
   - Features list
   - Known issues

3. **Working App**
   - All 4 tabs functional
   - Authentication working
   - Data loading from API
   - Theme switching
   - No crashes
   - Ready for TestFlight

---

## 🎯 Success Criteria

The iOS app is considered **successful** when:

✅ Users can login and view their portfolio  
✅ All fund data displays correctly  
✅ NAV charts render accurately  
✅ Documents are accessible and viewable  
✅ Theme switching works (light/dark/system)  
✅ Accent color selection persists  
✅ App is responsive on iPhone and iPad  
✅ No crashes in production  
✅ Load times < 2 seconds on average network  
✅ Passes Apple App Review guidelines  
✅ 4.5+ star rating on App Store (goal)  

---

## 🔧 Configuration

### Backend API URL

Update in your iOS project:

```swift
enum Configuration {
    static let apiBaseURL: String = {
        #if DEBUG
        return "http://localhost:3000"  // Development
        #else
        return "https://your-domain.com"  // Production
        #endif
    }()
}
```

### Deep Linking

```
URL Scheme: onelpm://
Examples:
- onelpm://register?token=xxx (Invitation)
- onelpm://funds/fund123 (Fund detail)
```

---

## 📚 Additional Resources

### In This Project
- [README.md](./README.md) - Main web app documentation
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Project overview
- [prisma/schema.prisma](./prisma/schema.prisma) - Database schema
- [src/components/](./src/components/) - UI components for design reference

### Apple Documentation
- [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [URLSession Documentation](https://developer.apple.com/documentation/foundation/urlsession)
- [Keychain Services](https://developer.apple.com/documentation/security/keychain_services)
- [Charts Framework](https://developer.apple.com/documentation/charts)

### Community Resources
- [Hacking with Swift](https://www.hackingwithswift.com/)
- [Swift by Sundell](https://www.swiftbysundell.com/)
- [Ray Wenderlich](https://www.raywenderlich.com/)
- [objc.io](https://www.objc.io/)

---

## 🆘 Support

### Backend Issues
- Check backend logs: `npm run dev` output
- Verify database connection
- Check API route files in `src/app/api/`
- Test with curl or Postman

### iOS Issues
- Review `IOS_APP_SPECIFICATION.md` for requirements
- Check API responses match expected format
- Verify token is stored/retrieved from Keychain
- Test network connectivity

### Contact
- Development Team: [Your contact info]
- Backend Lead: [Contact info]
- Design Team: [Contact info]

---

## 🗂️ File Structure

```
OneLPMVP/
├── IOS_README.md                      ← You are here
├── IOS_APP_QUICKSTART.md              ← Quick reference
├── IOS_APP_SPECIFICATION.md           ← Complete spec (100+ pages)
├── IOS_APP_CURSOR_PROMPT.md           ← AI prompt
├── IOS_API_TESTING_GUIDE.md           ← API testing
│
├── src/                               ← Web app source (for reference)
│   ├── app/
│   ├── components/
│   └── lib/
│
├── prisma/
│   └── schema.prisma                  ← Database schema
│
├── README.md                          ← Main project README
└── PROJECT_SUMMARY.md                 ← Project overview
```

---

## ✅ Pre-Flight Checklist

Before starting iOS development:

- [ ] Read `IOS_APP_QUICKSTART.md`
- [ ] Review `IOS_APP_SPECIFICATION.md`
- [ ] Backend is running locally (`npm run dev`)
- [ ] Can login via curl/Postman
- [ ] Dashboard API returns data
- [ ] Test credentials work
- [ ] Have Xcode installed (latest version)
- [ ] Have Apple Developer account (for TestFlight/App Store)

---

## 🚀 Next Steps

### To Start Building:

#### Option A: With Cursor AI
```bash
# 1. Create project directory
mkdir OneLPM-iOS && cd OneLPM-iOS

# 2. Open in Cursor
cursor .

# 3. Copy docs
cp ../OneLPMVP/IOS_APP_SPECIFICATION.md .
cp ../OneLPMVP/IOS_APP_CURSOR_PROMPT.md .

# 4. Paste prompt into Cursor and start building
```

#### Option B: Manual Development
```bash
# 1. Read documentation
open IOS_APP_QUICKSTART.md
open IOS_APP_SPECIFICATION.md

# 2. Open Xcode and create new project
open -a Xcode

# 3. Start implementing features per spec
```

### Testing Backend
```bash
# In OneLPMVP directory
npm run dev

# In another terminal, test API
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎉 Let's Build!

You now have **everything you need** to create an amazing iOS app for OneLPM:

✅ **Complete technical specification**  
✅ **AI-ready development prompt**  
✅ **API testing guide with examples**  
✅ **Design system with all colors/styles**  
✅ **Data models and API documentation**  
✅ **Testing checklists and success criteria**

The web platform is already built and running. Now let's bring OneLPM to iOS! 📱✨

---

## 📞 Questions?

If you have questions about:
- **iOS app development:** Check `IOS_APP_SPECIFICATION.md`
- **API integration:** Check `IOS_API_TESTING_GUIDE.md`
- **Quick reference:** Check `IOS_APP_QUICKSTART.md`
- **Using with Cursor AI:** Check `IOS_APP_CURSOR_PROMPT.md`
- **Web platform:** Check `README.md` and `PROJECT_SUMMARY.md`

---

**Version:** 1.0  
**Last Updated:** January 2025  
**Author:** OneLPM Development Team

---

*Ready to revolutionize how Limited Partners access their investments! 🚀*

