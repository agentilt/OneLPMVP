# EuroLP Admin Application - Development Prompt

## Project Overview
Create a separate admin application for EuroLP that connects to the same PostgreSQL database as the main client application. This admin app will provide a clean, intuitive interface for administrators and data managers to manage users, funds, documents, and view audit logs.

## Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Admin App     │    │   Mobile App    │
│   (Next.js)     │    │   (React+Vite)  │    │   (iOS/Swift)   │
│   Port: 3001    │    │   Port: 3002    │    │   Native App    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Shared API    │
                    │   (Next.js)     │
                    │   Port: 3001    │
                    │                 │
                    │ • /api/mobile/* │
                    │ • /api/admin/*  │
                    │ • /api/auth/*   │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    │   (Neon)        │
                    └─────────────────┘
```

## Technology Stack

### Frontend Framework
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Ant Design Pro** for professional admin UI components
- **React Router** for navigation
- **Axios** for API calls
- **React Query** for data fetching and caching

### Styling & UI
- **Ant Design Pro** - Professional admin interface components
- **Less/Sass** for custom styling
- **Responsive design** for different screen sizes

### State Management
- **Zustand** for global state management
- **React Query** for server state management

### Development Tools
- **ESLint** + **Prettier** for code quality
- **TypeScript** for type safety
- **Vite** for fast development server

## Database Connection

### Prisma Setup
```typescript
// Use the same Prisma schema as the main app
// Copy prisma/schema.prisma from main project
// Use same DATABASE_URL environment variable
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# API Base URL
VITE_API_BASE_URL="http://localhost:3001"

# Authentication
VITE_NEXTAUTH_URL="http://localhost:3001"
VITE_NEXTAUTH_SECRET="your-secret-key"
```

## Project Structure
```
euro-lp-admin/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Layout/
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   └── Footer/
│   │   ├── forms/
│   │   │   ├── UserForm/
│   │   │   ├── FundForm/
│   │   │   └── DocumentForm/
│   │   └── tables/
│   │       ├── UserTable/
│   │       ├── FundTable/
│   │       └── AuditLogTable/
│   ├── pages/
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── users/
│   │   │   ├── index.tsx
│   │   │   ├── create.tsx
│   │   │   └── [id]/
│   │   │       └── edit.tsx
│   │   ├── funds/
│   │   │   ├── index.tsx
│   │   │   ├── create.tsx
│   │   │   └── [id]/
│   │   │       └── edit.tsx
│   │   ├── documents/
│   │   │   └── index.tsx
│   │   ├── audit-logs/
│   │   │   └── index.tsx
│   │   └── settings/
│   │       └── index.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── funds.ts
│   │   ├── documents.ts
│   │   └── audit.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   └── fundStore.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── fund.ts
│   │   ├── document.ts
│   │   └── audit.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validation.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── prisma/
│   └── schema.prisma
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Core Features to Implement

### 1. Authentication & Authorization
- **Login/Logout** functionality
- **Role-based access** (ADMIN, DATA_MANAGER)
- **Session management** with JWT tokens
- **Protected routes** based on user roles

### 2. Dashboard
- **Overview statistics** (total users, funds, documents)
- **Recent activity** feed
- **Quick actions** (create user, create fund)
- **System health** indicators

### 3. User Management
- **User list** with search and filtering
- **Create new users** with invitation system
- **Edit user profiles** and roles
- **Grant/revoke fund access**
- **User activity** tracking

### 4. Fund Management
- **Fund list** with advanced filtering
- **Create new funds** for specific users
- **Edit fund details** and performance metrics
- **Fund performance** charts and analytics
- **Document management** per fund

### 5. Document Management
- **Document library** with categorization
- **Upload documents** for specific funds
- **Document approval** workflow
- **Version control** and history

### 6. Audit Logs
- **Comprehensive audit trail** viewing
- **Advanced filtering** by user, action, resource, date
- **Export functionality** for compliance
- **Real-time updates** of new audit entries

### 7. Settings & Configuration
- **System settings** management
- **User preferences**
- **Notification settings**
- **API configuration**

## API Integration

### Authentication Endpoints
```typescript
// Login
POST /api/mobile/auth/login
{
  "email": "admin@eurolp.com",
  "password": "password"
}

// Logout
POST /api/mobile/auth/logout
Headers: { Authorization: "Bearer <token>" }
```

### User Management Endpoints
```typescript
// Get all users
GET /api/data-manager/users

// Create user (via invitation)
POST /api/register
{
  "token": "invitation_token",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123"
}

// Update user
PUT /api/data-manager/users/[id]
```

### Fund Management Endpoints
```typescript
// Get all funds
GET /api/admin/funds/list

// Create fund
POST /api/admin/funds
{
  "userId": "user_id",
  "name": "Fund Name",
  "domicile": "Luxembourg",
  "vintage": 2023,
  "manager": "Fund Manager",
  "commitment": 1000000,
  "paidIn": 500000,
  "nav": 550000,
  "tvpi": 1.1,
  "dpi": 0.5
}
```

### Audit Log Endpoints
```typescript
// Get audit logs
GET /api/admin/audit-logs?page=1&limit=50&userId=user_id&action=UPDATE&resource=USER&startDate=2024-01-01&endDate=2024-12-31
```

## Key Components to Build

### 1. Layout Components
```typescript
// Main layout with sidebar navigation
<AdminLayout>
  <Sidebar />
  <MainContent>
    <Header />
    <PageContent />
  </MainContent>
</AdminLayout>
```

### 2. Data Tables
```typescript
// Reusable table component with sorting, filtering, pagination
<DataTable
  columns={columns}
  data={data}
  loading={loading}
  pagination={pagination}
  onFilter={handleFilter}
  onSort={handleSort}
/>
```

### 3. Form Components
```typescript
// Reusable form components with validation
<Form
  schema={validationSchema}
  onSubmit={handleSubmit}
  initialValues={initialValues}
>
  <FormFields />
  <FormActions />
</Form>
```

### 4. Dashboard Widgets
```typescript
// Reusable dashboard widgets
<StatCard title="Total Users" value={userCount} trend={userTrend} />
<ActivityFeed activities={recentActivities} />
<QuickActions actions={quickActions} />
```

## Development Guidelines

### Code Standards
- **TypeScript** for all components and functions
- **Functional components** with hooks
- **Custom hooks** for reusable logic
- **Error boundaries** for error handling
- **Loading states** for all async operations

### State Management
- **Zustand** for global state (auth, user preferences)
- **React Query** for server state (API data)
- **Local state** with useState for component-specific state

### Error Handling
- **Global error boundary** for unhandled errors
- **API error handling** with user-friendly messages
- **Form validation** with real-time feedback
- **Loading states** and skeleton screens

### Performance
- **Code splitting** with React.lazy
- **Memoization** with React.memo and useMemo
- **Virtual scrolling** for large data tables
- **Debounced search** for filtering

## Security Considerations

### Authentication
- **JWT token** storage in httpOnly cookies
- **Token refresh** mechanism
- **Session timeout** handling
- **Role-based route protection**

### Data Protection
- **Input validation** on all forms
- **XSS protection** with proper sanitization
- **CSRF protection** for state-changing operations
- **Audit logging** for all admin actions

### API Security
- **Rate limiting** on API endpoints
- **Request validation** on server side
- **Error message sanitization**
- **Secure headers** configuration

## Deployment Strategy

### Development Environment
```bash
# Admin app runs on port 3002
npm run dev  # Starts on http://localhost:3002

# Main app runs on port 3001
npm run dev  # Starts on http://localhost:3001
```

### Production Deployment
- **Separate Vercel/Netlify** deployment for admin app
- **Same database** connection
- **Environment-specific** API URLs
- **CDN** for static assets

## Testing Strategy

### Unit Tests
- **Jest** + **React Testing Library**
- **Component testing** for UI components
- **Hook testing** for custom hooks
- **Utility function testing**

### Integration Tests
- **API integration** testing
- **Authentication flow** testing
- **Form submission** testing
- **Navigation testing**

### E2E Tests
- **Playwright** or **Cypress**
- **Critical user flows** testing
- **Cross-browser** compatibility
- **Mobile responsiveness** testing

## Getting Started Commands

```bash
# Create new Vite + React + TypeScript project
npm create vite@latest euro-lp-admin -- --template react-ts

# Install dependencies
cd euro-lp-admin
npm install

# Install additional packages
npm install antd @ant-design/pro-components
npm install @tanstack/react-query axios
npm install zustand react-router-dom
npm install @types/node

# Install dev dependencies
npm install -D @types/react @types/react-dom
npm install -D eslint prettier
npm install -D @vitejs/plugin-react

# Copy Prisma schema from main project
cp ../OneLPMVP/prisma/schema.prisma ./prisma/

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

## Success Criteria

### Functional Requirements
- ✅ **User authentication** with role-based access
- ✅ **User management** (CRUD operations)
- ✅ **Fund management** (CRUD operations)
- ✅ **Document management** and upload
- ✅ **Audit log viewing** with filtering
- ✅ **Dashboard** with key metrics
- ✅ **Responsive design** for all screen sizes

### Performance Requirements
- ✅ **Fast loading** (< 3 seconds initial load)
- ✅ **Smooth interactions** (< 100ms response time)
- ✅ **Efficient data fetching** with caching
- ✅ **Optimized bundle size** (< 2MB)

### User Experience Requirements
- ✅ **Intuitive navigation** and workflow
- ✅ **Consistent design** language
- ✅ **Clear error messages** and feedback
- ✅ **Accessibility** compliance (WCAG 2.1)

This admin application will provide a clean, professional interface for managing the EuroLP platform while maintaining separation from the client-facing application.
