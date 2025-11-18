# Analytics Dashboard Implementation Plan
## For Admin Application via Proxy Endpoints

## Overview

This document outlines a comprehensive plan for building an analytics dashboard in the admin application that connects to the OneLPMVP backend through proxy endpoints. The dashboard will provide detailed insights into user activity, engagement metrics, session statistics, and audit trail data.

---




## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Available Data Sources](#available-data-sources)
3. [Required API Endpoints](#required-api-endpoints)
4. [Dashboard Structure](#dashboard-structure)
5. [Implementation Steps](#implementation-steps)
6. [UI/UX Design](#uiux-design)
7. [Data Visualization](#data-visualization)
8. [Performance Considerations](#performance-considerations)


I want to change the layout of the ui to match th
---

## Architecture Overview

### Current Setup
```
Admin Application (admin.onelp.capital)
  ↓ HTTP API calls (with credentials)
Backend API (onelp.capital/api/admin/*)
  ↓ Prisma ORM
PostgreSQL Database (Neon)
  ├── ActivityEvent (client-side tracking)
  ├── AuditLog (server-side actions)
  ├── UserSession (session tracking)
  └── SecurityEvent (security events)
```

### Authentication Flow
- Admin app authenticates via NextAuth session cookies
- All API calls include `credentials: 'include'` for cookie-based auth
- Backend validates ADMIN role for all analytics endpoints

---

## Available Data Sources

### 1. ActivityEvent Model
**Purpose**: Client-side user activity tracking

**Key Fields**:
- `eventType`: PAGE_VIEW, CLICK, FORM_SUBMIT, DOWNLOAD, SEARCH, FILTER, EXPORT, etc.
- `route`: Page/route path
- `resourceId`: ID of resource being viewed/interacted with
- `resourceType`: FUND, DOCUMENT, DIRECT_INVESTMENT, etc.
- `metadata`: Additional context (JSON)
- `sessionId`: Associated session
- `createdAt`: Timestamp

**Use Cases**:
- Page view analytics
- User engagement metrics
- Feature usage tracking
- Navigation patterns

### 2. AuditLog Model
**Purpose**: Server-side action tracking

**Key Fields**:
- `action`: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, UPLOAD, DOWNLOAD, etc.
- `resource`: USER, FUND, DOCUMENT, DIRECT_INVESTMENT, etc.
- `resourceId`: ID of affected resource
- `oldValues` / `newValues`: Change tracking (JSON)
- `description`: Human-readable description
- `ipAddress`, `userAgent`: Request metadata
- `createdAt`: Timestamp

**Use Cases**:
- Administrative action tracking
- Change history
- Security auditing
- Compliance reporting

### 3. UserSession Model
**Purpose**: Session and engagement tracking

**Key Fields**:
- `userId`: User identifier
- `deviceInfo`: Device details (JSON)
- `ipAddress`, `userAgent`: Request metadata
- `lastActivity`: Last activity timestamp
- `isActive`: Current session status
- `durationMinutes`: Session duration
- `pageViews`: Number of pages viewed
- `actionsCount`: Number of actions performed
- `createdAt`, `endedAt`: Session timestamps

**Use Cases**:
- Session duration analytics
- Active user tracking
- Engagement metrics
- Device/platform analytics

### 4. SecurityEvent Model
**Purpose**: Security and compliance tracking

**Key Fields**:
- `eventType`: Event classification
- `description`: Event description
- `severity`: INFO, WARNING, ERROR, CRITICAL
- `metadata`: Additional context (JSON)
- `createdAt`: Timestamp

**Use Cases**:
- Security monitoring
- Compliance reporting
- Threat detection
- Audit requirements

---

## Required API Endpoints

### Existing Endpoints

#### 1. GET `/api/admin/analytics`
**Status**: ✅ Already implemented

**Query Parameters**:
- `startDate` (optional): Filter start date (ISO string)
- `endDate` (optional): Filter end date (ISO string)
- `userId` (optional): Filter by specific user

**Response**:
```typescript
{
  summary: {
    totalUsers: number
    activeUsers: number
    totalSessions: number
    activeSessions: number
    totalPageViews: number
    totalActions: number
    avgSessionDuration: number // in minutes
  }
  sessionsByDay: Array<{ date: string, count: number }>
  topPages: Array<{ route: string, views: number }>
  topUsers: Array<{
    userId: string
    count: number
    user: { email: string, name: string } | null
  }>
  activityByType: Array<{ eventType: string, count: number }>
}
```

### Additional Endpoints Needed

#### 2. GET `/api/admin/analytics/user-activity`
**Purpose**: Detailed user activity timeline

**Query Parameters**:
- `userId` (required): User ID
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date
- `eventType` (optional): Filter by event type
- `limit` (optional, default: 100): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response**:
```typescript
{
  activities: Array<{
    id: string
    eventType: string
    route: string | null
    resourceId: string | null
    resourceType: string | null
    metadata: any
    createdAt: string
  }>
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
```

#### 3. GET `/api/admin/analytics/sessions`
**Purpose**: Session analytics and details

**Query Parameters**:
- `userId` (optional): Filter by user
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date
- `isActive` (optional): Filter active/inactive sessions
- `limit` (optional, default: 50): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response**:
```typescript
{
  sessions: Array<{
    id: string
    userId: string
    user: { email: string, name: string }
    deviceInfo: any
    ipAddress: string | null
    userAgent: string | null
    lastActivity: string
    isActive: boolean
    durationMinutes: number | null
    pageViews: number
    actionsCount: number
    createdAt: string
    endedAt: string | null
  }>
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  statistics: {
    totalSessions: number
    activeSessions: number
    avgDuration: number
    avgPageViews: number
    avgActions: number
  }
}
```

#### 4. GET `/api/admin/analytics/engagement`
**Purpose**: User engagement metrics

**Query Parameters**:
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date
- `groupBy` (optional): 'day' | 'week' | 'month' (default: 'day')

**Response**:
```typescript
{
  engagement: Array<{
    period: string // Date or period identifier
    activeUsers: number
    newUsers: number
    returningUsers: number
    totalSessions: number
    avgSessionDuration: number
    totalPageViews: number
    totalActions: number
    bounceRate: number // Percentage
  }>
  summary: {
    totalActiveUsers: number
    totalNewUsers: number
    totalReturningUsers: number
    avgDailyActiveUsers: number
    avgSessionDuration: number
    avgPagesPerSession: number
    avgActionsPerSession: number
  }
}
```

#### 5. GET `/api/admin/analytics/resources`
**Purpose**: Resource-level analytics (funds, documents, investments)

**Query Parameters**:
- `resourceType` (optional): 'FUND' | 'DOCUMENT' | 'DIRECT_INVESTMENT'
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date
- `limit` (optional, default: 20): Number of results

**Response**:
```typescript
{
  resources: Array<{
    resourceId: string
    resourceType: string
    resourceName: string | null
    views: number
    downloads: number
    uniqueUsers: number
    lastAccessed: string | null
  }>
}
```

#### 6. GET `/api/admin/analytics/audit-summary`
**Purpose**: Audit log summary and statistics

**Query Parameters**:
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date
- `action` (optional): Filter by action type
- `resource` (optional): Filter by resource type
- `userId` (optional): Filter by user

**Response**:
```typescript
{
  summary: {
    totalActions: number
    actionsByType: Array<{ action: string, count: number }>
    actionsByResource: Array<{ resource: string, count: number }>
    topActors: Array<{ userId: string, count: number, user: { email: string, name: string } }>
  }
  recentActions: Array<{
    id: string
    action: string
    resource: string
    resourceId: string | null
    description: string
    user: { email: string, name: string }
    createdAt: string
  }>
}
```

#### 7. GET `/api/admin/analytics/export`
**Purpose**: Export analytics data for reporting

**Query Parameters**:
- `type`: 'activity' | 'sessions' | 'audit' | 'engagement'
- `format`: 'csv' | 'json'
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date
- `userId` (optional): Filter by user

**Response**: File download (CSV or JSON)

---

## Dashboard Structure

### Main Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  Analytics Dashboard                                     │
│  [Date Range Picker] [User Filter] [Export Button]      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Total    │ │ Active   │ │ Sessions │ │ Avg      │  │
│  │ Users    │ │ Users    │ │ Today    │ │ Session  │  │
│  │  1,234   │ │   456    │ │   89     │ │  45 min  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  User Activity Over Time (Line Chart)            │   │
│  │  [Last 30 days]                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────┐  ┌────────────────────────────┐  │
│  │ Top Pages        │  │ Activity by Type           │  │
│  │ (Bar Chart)      │  │ (Pie/Doughnut Chart)       │  │
│  └──────────────────┘  └────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Top Active Users (Table)                        │   │
│  │  [User] [Sessions] [Page Views] [Actions]        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Dashboard Sections

#### 1. Overview Section
**Location**: Top of dashboard

**Components**:
- **Key Metrics Cards** (4-6 cards):
  - Total Users
  - Active Users (last 30 days)
  - Active Sessions (current)
  - Total Page Views (selected period)
  - Total Actions (selected period)
  - Average Session Duration

- **Date Range Picker**:
  - Quick presets: Today, Last 7 days, Last 30 days, Last 90 days, Custom
  - Start date / End date inputs

- **Filters**:
  - User dropdown (optional)
  - Event type filter (optional)
  - Resource type filter (optional)

#### 2. Activity Trends Section
**Location**: Main content area

**Components**:
- **Line Chart**: User activity over time
  - X-axis: Date/Time
  - Y-axis: Count
  - Multiple series: Page Views, Actions, Sessions, Active Users
  - Interactive tooltips
  - Zoom/pan capabilities

- **Area Chart**: Engagement trends
  - New vs Returning users
  - Session duration trends
  - Bounce rate trends

#### 3. Top Content Section
**Location**: Right sidebar or grid

**Components**:
- **Top Pages Table/Chart**:
  - Route path
  - View count
  - Unique visitors
  - Average time on page

- **Top Resources Table**:
  - Resource name/ID
  - Resource type
  - Views
  - Downloads
  - Unique users

#### 4. User Activity Section
**Location**: Bottom section

**Components**:
- **Top Users Table**:
  - User email/name
  - Total sessions
  - Total page views
  - Total actions
  - Last activity
  - Click to view detailed activity

- **Activity Timeline** (expandable):
  - Chronological list of activities
  - Filterable by user, event type, resource
  - Pagination

#### 5. Session Analytics Section
**Location**: Separate tab or expandable section

**Components**:
- **Session Statistics**:
  - Total sessions
  - Active sessions
  - Average duration
  - Average page views per session
  - Average actions per session

- **Session List Table**:
  - User
  - Device info
  - IP address
  - Start time
  - Duration
  - Page views
  - Actions
  - Status (Active/Ended)

#### 6. Audit Log Section
**Location**: Separate tab

**Components**:
- **Audit Summary Cards**:
  - Total actions
  - Actions by type
  - Actions by resource
  - Top actors

- **Recent Actions Table**:
  - Timestamp
  - User
  - Action
  - Resource
  - Description
  - Details (expandable)

---

## Implementation Steps

### Phase 1: Backend API Enhancement (Week 1)

#### Step 1.1: Create Additional Analytics Endpoints
**Files to create**:
- `src/app/api/admin/analytics/user-activity/route.ts`
- `src/app/api/admin/analytics/sessions/route.ts`
- `src/app/api/admin/analytics/engagement/route.ts`
- `src/app/api/admin/analytics/resources/route.ts`
- `src/app/api/admin/analytics/audit-summary/route.ts`
- `src/app/api/admin/analytics/export/route.ts`

**Tasks**:
1. Implement each endpoint with proper authentication
2. Add query parameter validation
3. Implement efficient database queries (use indexes)
4. Add pagination support where needed
5. Add error handling and logging
6. Write TypeScript types for all responses

#### Step 1.2: Optimize Existing Analytics Endpoint
**File**: `src/app/api/admin/analytics/route.ts`

**Tasks**:
1. Review and optimize database queries
2. Add caching for frequently accessed data (optional)
3. Add more granular filtering options
4. Improve response structure if needed

#### Step 1.3: Add Database Indexes (if needed)
**File**: `prisma/schema.prisma` or migration

**Tasks**:
1. Review query patterns
2. Add composite indexes for common filters
3. Ensure indexes on foreign keys
4. Add indexes on date fields for time-based queries

### Phase 2: Admin App API Client Setup (Week 1-2)

#### Step 2.1: Create API Client Utility
**File**: `src/lib/api-client.ts` (in admin app)

**Tasks**:
1. Create base API client with authentication
2. Implement request/response interceptors
3. Add error handling
4. Add request retry logic
5. Add TypeScript types

**Example Structure**:
```typescript
// src/lib/api-client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

class ApiClient {
  async get(endpoint: string, params?: Record<string, any>) {
    // Implementation
  }
  
  async post(endpoint: string, data?: any) {
    // Implementation
  }
  
  // Analytics-specific methods
  async getAnalytics(params?: AnalyticsParams) {
    return this.get('/api/admin/analytics', params)
  }
  
  async getUserActivity(userId: string, params?: any) {
    return this.get(`/api/admin/analytics/user-activity`, { userId, ...params })
  }
  
  // ... more methods
}
```

#### Step 2.2: Create React Query Hooks
**File**: `src/hooks/useAnalytics.ts` (in admin app)

**Tasks**:
1. Create custom hooks for each analytics endpoint
2. Implement caching and refetching strategies
3. Add loading and error states
4. Add optimistic updates where applicable

**Example**:
```typescript
// src/hooks/useAnalytics.ts
export function useAnalytics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: () => apiClient.getAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUserActivity(userId: string, params?: any) {
  return useQuery({
    queryKey: ['user-activity', userId, params],
    queryFn: () => apiClient.getUserActivity(userId, params),
  })
}
```

### Phase 3: Dashboard UI Components (Week 2-3)

#### Step 3.1: Install Required Libraries
**Packages needed**:
```bash
npm install recharts date-fns
# or
npm install @tanstack/react-charts date-fns
# or
npm install chart.js react-chartjs-2 date-fns
```

#### Step 3.2: Create Dashboard Layout Component
**File**: `src/components/analytics/DashboardLayout.tsx`

**Tasks**:
1. Create responsive grid layout
2. Add date range picker component
3. Add filter components
4. Add export button
5. Implement responsive design

#### Step 3.3: Create Metric Card Component
**File**: `src/components/analytics/MetricCard.tsx`

**Features**:
- Large number display
- Label
- Optional trend indicator (↑↓)
- Optional comparison to previous period
- Loading state
- Error state

#### Step 3.4: Create Chart Components
**Files**:
- `src/components/analytics/ActivityChart.tsx` (Line chart)
- `src/components/analytics/TopPagesChart.tsx` (Bar chart)
- `src/components/analytics/ActivityTypeChart.tsx` (Pie/Doughnut chart)
- `src/components/analytics/EngagementChart.tsx` (Area chart)

**Features**:
- Responsive design
- Interactive tooltips
- Loading states
- Empty states
- Error handling
- Customizable colors/themes

#### Step 3.5: Create Table Components
**Files**:
- `src/components/analytics/TopUsersTable.tsx`
- `src/components/analytics/SessionsTable.tsx`
- `src/components/analytics/ActivityTimeline.tsx`
- `src/components/analytics/AuditLogTable.tsx`

**Features**:
- Sortable columns
- Pagination
- Row expansion for details
- Filtering
- Export functionality

### Phase 4: Dashboard Pages (Week 3-4)

#### Step 4.1: Main Analytics Dashboard Page
**File**: `src/pages/analytics/index.tsx` or `src/app/analytics/page.tsx`

**Structure**:
- Overview section with key metrics
- Activity trends chart
- Top content section
- Top users table
- Quick filters

#### Step 4.2: User Activity Detail Page
**File**: `src/pages/analytics/users/[userId].tsx`

**Features**:
- User profile summary
- Activity timeline
- Session history
- Resource access history
- Engagement metrics

#### Step 4.3: Session Analytics Page
**File**: `src/pages/analytics/sessions.tsx`

**Features**:
- Session statistics
- Active sessions list
- Session duration distribution
- Device/platform breakdown
- Geographic distribution (if IP geolocation available)

#### Step 4.4: Audit Log Page
**File**: `src/pages/analytics/audit.tsx`

**Features**:
- Audit summary
- Recent actions table
- Advanced filtering
- Action details modal
- Export functionality

### Phase 5: Advanced Features (Week 4-5)

#### Step 5.1: Real-time Updates
**Tasks**:
1. Implement WebSocket or Server-Sent Events (SSE)
2. Add real-time session count
3. Add real-time activity feed
4. Add notifications for important events

#### Step 5.2: Export Functionality
**Tasks**:
1. Implement CSV export
2. Implement JSON export
3. Implement PDF report generation (optional)
4. Add scheduled report emails (optional)

#### Step 5.3: Custom Date Ranges
**Tasks**:
1. Add preset date ranges
2. Add custom date range picker
3. Save favorite date ranges
4. Compare periods functionality

#### Step 5.4: Advanced Filtering
**Tasks**:
1. Multi-select filters
2. Saved filter presets
3. Filter combinations
4. URL-based filter sharing

---

## UI/UX Design

### Design Principles

1. **Clarity First**: Make data easy to understand at a glance
2. **Progressive Disclosure**: Show summary first, details on demand
3. **Responsive Design**: Works on desktop, tablet, and mobile
4. **Performance**: Fast loading, smooth interactions
5. **Accessibility**: WCAG 2.1 AA compliance

### Color Scheme

**Metrics Cards**:
- Total Users: Blue gradient
- Active Users: Green gradient
- Sessions: Purple gradient
- Page Views: Orange gradient
- Actions: Teal gradient
- Duration: Indigo gradient

**Charts**:
- Use consistent color palette
- Support dark mode
- Ensure sufficient contrast
- Use colorblind-friendly palette

### Typography

- **Headings**: Bold, clear hierarchy
- **Numbers**: Large, easy to read (use number formatting)
- **Labels**: Smaller, secondary color
- **Body**: Readable font size, good line height

### Spacing and Layout

- **Grid System**: 12-column grid
- **Card Spacing**: Consistent padding and margins
- **Section Spacing**: Clear visual separation
- **Responsive Breakpoints**: Mobile (640px), Tablet (768px), Desktop (1024px+)

### Interactive Elements

- **Hover States**: Clear feedback on interactive elements
- **Loading States**: Skeleton loaders or spinners
- **Empty States**: Helpful messages when no data
- **Error States**: Clear error messages with retry options

---

## Data Visualization

### Chart Types and Use Cases

#### 1. Line Charts
**Use For**:
- Time series data (activity over time)
- Trends and patterns
- Multiple series comparison

**Libraries**: Recharts, Chart.js, Victory

#### 2. Bar Charts
**Use For**:
- Top pages/resources
- Comparison between categories
- Ranking data

**Libraries**: Recharts, Chart.js

#### 3. Pie/Doughnut Charts
**Use For**:
- Activity type distribution
- Resource type breakdown
- Action type distribution

**Libraries**: Recharts, Chart.js

#### 4. Area Charts
**Use For**:
- Cumulative data
- Engagement trends
- Stacked comparisons

**Libraries**: Recharts, Chart.js

#### 5. Tables
**Use For**:
- Detailed data lists
- Sortable/filterable data
- User activity timelines

**Libraries**: TanStack Table, AG Grid

### Recommended Chart Library: Recharts

**Why Recharts?**
- Built for React
- Responsive by default
- Good TypeScript support
- Active maintenance
- Flexible customization

**Installation**:
```bash
npm install recharts
```

**Example Usage**:
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="pageViews" stroke="#8884d8" />
    <Line type="monotone" dataKey="actions" stroke="#82ca9d" />
  </LineChart>
</ResponsiveContainer>
```

---

## Performance Considerations

### 1. Data Fetching Optimization

**Strategies**:
- Use React Query for caching and background refetching
- Implement pagination for large datasets
- Use debouncing for filters
- Implement virtual scrolling for long lists

**Example**:
```typescript
// Debounced filter
const debouncedSearch = useDebounce(searchTerm, 500)

useEffect(() => {
  refetch({ search: debouncedSearch })
}, [debouncedSearch])
```

### 2. Database Query Optimization

**Strategies**:
- Add appropriate indexes
- Use database aggregation where possible
- Limit result sets
- Use connection pooling
- Consider materialized views for complex queries

### 3. Caching Strategy

**Client-Side**:
- React Query cache (5-10 minutes for analytics)
- Local storage for user preferences
- Session storage for temporary data

**Server-Side** (Optional):
- Redis cache for frequently accessed data
- Cache invalidation on data updates
- TTL-based expiration

### 4. Lazy Loading

**Strategies**:
- Code splitting for dashboard sections
- Lazy load chart libraries
- Virtual scrolling for tables
- Progressive image loading

### 5. Data Aggregation

**Strategies**:
- Pre-aggregate data at database level
- Use database views for complex queries
- Schedule background jobs for heavy calculations
- Store aggregated data in separate tables

---

## Implementation Checklist

### Backend (OneLPMVP)
- [ ] Create `/api/admin/analytics/user-activity` endpoint
- [ ] Create `/api/admin/analytics/sessions` endpoint
- [ ] Create `/api/admin/analytics/engagement` endpoint
- [ ] Create `/api/admin/analytics/resources` endpoint
- [ ] Create `/api/admin/analytics/audit-summary` endpoint
- [ ] Create `/api/admin/analytics/export` endpoint
- [ ] Optimize existing `/api/admin/analytics` endpoint
- [ ] Add database indexes if needed
- [ ] Add TypeScript types for all responses
- [ ] Add error handling and logging
- [ ] Test all endpoints with various filters
- [ ] Add rate limiting if needed
- [ ] Document all endpoints

### Admin App Frontend
- [ ] Set up API client utility
- [ ] Create React Query hooks for analytics
- [ ] Install chart library (Recharts)
- [ ] Create dashboard layout component
- [ ] Create metric card component
- [ ] Create activity chart component
- [ ] Create top pages chart component
- [ ] Create activity type chart component
- [ ] Create engagement chart component
- [ ] Create top users table component
- [ ] Create sessions table component
- [ ] Create activity timeline component
- [ ] Create audit log table component
- [ ] Create date range picker component
- [ ] Create filter components
- [ ] Create main analytics dashboard page
- [ ] Create user activity detail page
- [ ] Create session analytics page
- [ ] Create audit log page
- [ ] Add export functionality
- [ ] Add real-time updates (optional)
- [ ] Add responsive design
- [ ] Add loading states
- [ ] Add error states
- [ ] Add empty states
- [ ] Test on different screen sizes
- [ ] Add accessibility features
- [ ] Performance testing and optimization

---

## Example API Client Implementation

```typescript
// src/lib/api-client.ts (in admin app)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://onelp.capital'

interface ApiError {
  error: string
  status: number
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for cookie-based auth
    })

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Unknown error',
        status: response.status,
      }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : ''
    return this.request<T>(endpoint + queryString, { method: 'GET' })
  }

  // Analytics methods
  async getAnalytics(params?: {
    startDate?: string
    endDate?: string
    userId?: string
  }) {
    return this.get('/api/admin/analytics', params)
  }

  async getUserActivity(
    userId: string,
    params?: {
      startDate?: string
      endDate?: string
      eventType?: string
      limit?: number
      offset?: number
    }
  ) {
    return this.get('/api/admin/analytics/user-activity', {
      userId,
      ...params,
    })
  }

  async getSessions(params?: {
    userId?: string
    startDate?: string
    endDate?: string
    isActive?: boolean
    limit?: number
    offset?: number
  }) {
    return this.get('/api/admin/analytics/sessions', params)
  }

  async getEngagement(params?: {
    startDate?: string
    endDate?: string
    groupBy?: 'day' | 'week' | 'month'
  }) {
    return this.get('/api/admin/analytics/engagement', params)
  }

  async getResources(params?: {
    resourceType?: string
    startDate?: string
    endDate?: string
    limit?: number
  }) {
    return this.get('/api/admin/analytics/resources', params)
  }

  async getAuditSummary(params?: {
    startDate?: string
    endDate?: string
    action?: string
    resource?: string
    userId?: string
  }) {
    return this.get('/api/admin/analytics/audit-summary', params)
  }

  async exportAnalytics(params: {
    type: 'activity' | 'sessions' | 'audit' | 'engagement'
    format: 'csv' | 'json'
    startDate?: string
    endDate?: string
    userId?: string
  }): Promise<Blob> {
    const response = await fetch(
      `${API_BASE}/api/admin/analytics/export?${new URLSearchParams(params as any).toString()}`,
      {
        credentials: 'include',
      }
    )
    
    if (!response.ok) {
      throw new Error('Export failed')
    }
    
    return response.blob()
  }
}

export const apiClient = new ApiClient()
```

---

## Example React Query Hooks

```typescript
// src/hooks/useAnalytics.ts (in admin app)
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useAnalytics(params?: {
  startDate?: string
  endDate?: string
  userId?: string
}) {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: () => apiClient.getAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })
}

export function useUserActivity(
  userId: string,
  params?: {
    startDate?: string
    endDate?: string
    eventType?: string
    limit?: number
    offset?: number
  }
) {
  return useQuery({
    queryKey: ['user-activity', userId, params],
    queryFn: () => apiClient.getUserActivity(userId, params),
    enabled: !!userId, // Only fetch if userId is provided
  })
}

export function useSessions(params?: {
  userId?: string
  startDate?: string
  endDate?: string
  isActive?: boolean
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => apiClient.getSessions(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useEngagement(params?: {
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'week' | 'month'
}) {
  return useQuery({
    queryKey: ['engagement', params],
    queryFn: () => apiClient.getEngagement(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useResources(params?: {
  resourceType?: string
  startDate?: string
  endDate?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ['resources', params],
    queryFn: () => apiClient.getResources(params),
  })
}

export function useAuditSummary(params?: {
  startDate?: string
  endDate?: string
  action?: string
  resource?: string
  userId?: string
}) {
  return useQuery({
    queryKey: ['audit-summary', params],
    queryFn: () => apiClient.getAuditSummary(params),
    staleTime: 2 * 60 * 1000,
  })
}
```

---

## Next Steps

1. **Review and Approve Plan**: Review this plan and adjust as needed
2. **Prioritize Features**: Decide which features to implement first
3. **Set Up Development Environment**: Ensure admin app can connect to backend
4. **Start with Backend**: Implement additional API endpoints first
5. **Build UI Components**: Create reusable dashboard components
6. **Integrate and Test**: Connect frontend to backend and test thoroughly
7. **Iterate and Improve**: Gather feedback and refine

---

## Questions to Consider

1. **Real-time Updates**: Do you need real-time updates, or is periodic refresh sufficient?
2. **Data Retention**: How long should analytics data be retained?
3. **Export Formats**: Which export formats are most important (CSV, JSON, PDF)?
4. **User Permissions**: Should all admins see all analytics, or role-based access?
5. **Performance Targets**: What are acceptable load times for the dashboard?
6. **Mobile Support**: How important is mobile/tablet support?
7. **Custom Reports**: Do you need the ability to create custom reports?

---

This plan provides a comprehensive roadmap for building a powerful analytics dashboard. Adjust the timeline and priorities based on your specific needs and resources.

