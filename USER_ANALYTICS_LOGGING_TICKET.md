# Ticket: Comprehensive User Activity Logging & Analytics System

## Priority: P0 (Critical for Beta)
## Effort: Medium (8-12 hours)
## Sprint: Beta Preparation

---

## Goal
Implement a comprehensive user activity logging and analytics system that tracks all user actions, session duration, and provides actionable insights beyond Vercel Analytics. This complements Vercel Analytics with custom business-specific metrics.

---

## Current State Assessment

### ✅ Already Implemented
- **AuditLog model** - Comprehensive schema with action, resource, userId, IP, userAgent, timestamps
- **AuditService** - Server-side logging service with methods for common actions
- **Audit middleware** - `withAuditLogging` HOC for API routes
- **Admin UI** - Basic audit logs viewer at `/admin/audit-logs` with filters
- **UserSession model** - Tracks sessions but missing duration calculation
- **SecurityEvent model** - Security-specific events

### ❌ Missing
- **Session duration tracking** - Calculate and store session length
- **Client-side activity tracking** - Page views, route changes, clicks, form interactions
- **Comprehensive action coverage** - Many API endpoints not yet wrapped with audit logging
- **Real-time activity tracking** - Heartbeat mechanism to detect active users
- **Analytics dashboard** - User activity summaries, session stats, engagement metrics
- **Activity API endpoints** - Endpoints to fetch user activity summaries

---

## Acceptance Criteria

### 1. Enhanced Session Tracking
- [ ] Track session start time on login (create UserSession record)
- [ ] Track session end time on logout (update UserSession with `endedAt`)
- [ ] Calculate session duration automatically
- [ ] Handle session timeout (mark inactive sessions as ended after 30 min inactivity)
- [ ] Store session duration in UserSession model (add `durationMinutes` field)

### 2. Client-Side Activity Tracking
- [ ] Create `ActivityTracker` React hook/component
- [ ] Track page views (route changes)
- [ ] Track significant user actions (button clicks, form submissions, document views)
- [ ] Send activity events to backend via API endpoint
- [ ] Batch events to reduce API calls (send every 5-10 seconds or on page unload)
- [ ] Track time spent on each page/route

### 3. Comprehensive Action Logging
- [ ] Wrap all API routes with audit logging middleware
- [ ] Add audit logging to:
  - [ ] All CRUD operations (Funds, Documents, Direct Investments, Users)
  - [ ] Document uploads/downloads
  - [ ] PDF views
  - [ ] Settings changes
  - [ ] Profile updates
  - [ ] Fund access grants/revokes
- [ ] Add new audit actions: `VIEW`, `NAVIGATE`, `SEARCH`, `EXPORT_REPORT`

### 4. Analytics API Endpoints
- [ ] `GET /api/admin/analytics/users/:userId` - Individual user activity summary
- [ ] `GET /api/admin/analytics/sessions` - Session statistics (avg duration, total sessions)
- [ ] `GET /api/admin/analytics/activity` - Activity timeline for a user
- [ ] `GET /api/admin/analytics/engagement` - Engagement metrics (daily active users, actions per user)
- [ ] `POST /api/activity/track` - Client-side activity tracking endpoint

### 5. Enhanced Analytics Dashboard UI
- [ ] Create `/admin/analytics` page
- [ ] Display:
  - [ ] User activity timeline (last 30 days)
  - [ ] Session duration statistics (avg, total, longest)
  - [ ] Most active users
  - [ ] Most accessed resources (funds, documents)
  - [ ] Activity heatmap (activity by day/hour)
  - [ ] Engagement trends (daily/weekly active users)
- [ ] Add filters: date range, user, action type
- [ ] Export functionality (CSV/JSON)

### 6. Database Schema Updates
- [ ] Add `endedAt` field to `UserSession` model
- [ ] Add `durationMinutes` field to `UserSession` model
- [ ] Create migration for schema changes
- [ ] Add `ActivityEvent` model (optional - for detailed client-side events):
  ```prisma
  model ActivityEvent {
    id          String   @id @default(cuid())
    userId      String
    eventType   String   // "PAGE_VIEW", "CLICK", "FORM_SUBMIT", etc.
    route       String?  // "/dashboard", "/funds/123", etc.
    resourceId  String?  // ID of resource being viewed
    metadata    Json?    // Additional context (element clicked, form data, etc.)
    timestamp   DateTime @default(now())
    user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    
    @@index([userId, timestamp])
    @@index([eventType])
    @@index([route])
  }
  ```

---

## Technical Implementation

### Step 1: Database Schema Updates
```prisma
// Add to UserSession model
model UserSession {
  // ... existing fields
  endedAt          DateTime?
  durationMinutes  Int?        // Calculated: (endedAt - createdAt) / 60
  pageViews        Int         @default(0)
  actionsCount     Int         @default(0)
}
```

### Step 2: Session Management Service
```typescript
// src/lib/session-tracker.ts
export class SessionTracker {
  static async startSession(userId: string, request: NextRequest): Promise<string>
  static async endSession(sessionId: string): Promise<void>
  static async updateActivity(sessionId: string): Promise<void>
  static async getSessionDuration(sessionId: string): Promise<number>
  static async getActiveSessions(userId: string): Promise<UserSession[]>
}
```

### Step 3: Client-Side Activity Tracker
```typescript
// src/hooks/useActivityTracker.ts
export function useActivityTracker() {
  // Track route changes
  // Track significant clicks
  // Batch and send to API
  // Handle page unload
}
```

### Step 4: Activity Tracking API
```typescript
// src/app/api/activity/track/route.ts
export async function POST(request: NextRequest) {
  // Accept batched events
  // Store in ActivityEvent table
  // Update session activity
  // Return success
}
```

### Step 5: Analytics API Endpoints
```typescript
// src/app/api/admin/analytics/users/[userId]/route.ts
// src/app/api/admin/analytics/sessions/route.ts
// src/app/api/admin/analytics/activity/route.ts
// src/app/api/admin/analytics/engagement/route.ts
```

### Step 6: Wrap API Routes
- Go through all API routes in `src/app/api/`
- Add `withAuditLogging` wrapper where missing
- Ensure all CRUD operations are logged

---

## User Stories

### As an Admin
- I want to see how long each user spends on the platform
- I want to see what actions each user performs
- I want to identify most engaged users
- I want to see activity trends over time
- I want to export activity data for analysis

### As a Developer
- I want all user actions automatically logged
- I want session duration calculated automatically
- I want client-side events tracked without performance impact
- I want analytics data queryable via API

---

## Success Metrics

1. **Coverage**: 100% of API routes have audit logging
2. **Performance**: Activity tracking adds <50ms latency
3. **Accuracy**: Session durations accurate to within 1 minute
4. **Completeness**: All significant user actions logged
5. **Usability**: Analytics dashboard loads in <2 seconds

---

## Testing Requirements

- [ ] Unit tests for SessionTracker
- [ ] Unit tests for ActivityTracker hook
- [ ] Integration tests for activity API endpoints
- [ ] E2E test: Login → Navigate → View document → Logout → Verify logs
- [ ] Performance test: Batch activity events don't slow down app

---

## Dependencies

- Existing `AuditLog` model ✅
- Existing `AuditService` ✅
- Existing `UserSession` model ✅
- New: `ActivityEvent` model (optional)
- New: Analytics UI components

---

## Rollout Plan

1. **Phase 1**: Database schema updates + Session tracking
2. **Phase 2**: Client-side activity tracking + API endpoint
3. **Phase 3**: Wrap all API routes with audit logging
4. **Phase 4**: Analytics API endpoints
5. **Phase 5**: Analytics dashboard UI

---

## Future Enhancements (Out of Scope)

- Real-time activity feed (WebSocket)
- User behavior analytics (funnels, drop-off points)
- A/B testing integration
- Custom event tracking configuration UI
- Activity alerts (unusual activity patterns)

---

## Notes

- Vercel Analytics provides infrastructure-level metrics (page loads, performance)
- This system provides business-level metrics (user actions, engagement, session data)
- Consider privacy implications - ensure GDPR compliance if storing detailed activity
- Consider adding user consent banner for activity tracking (optional)

---

## Related Files

- `src/lib/audit.ts` - Existing audit service
- `src/lib/audit-middleware.ts` - Existing audit middleware
- `src/app/admin/audit-logs/page.tsx` - Existing audit logs UI
- `prisma/schema.prisma` - Database schema
- `src/app/api/**` - API routes to wrap



