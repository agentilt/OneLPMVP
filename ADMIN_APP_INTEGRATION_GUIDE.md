# Legal Consent Implementation - Admin Application Integration Guide

## Overview
This document summarizes all backend changes made for Terms of Service and Privacy Policy consent tracking. Use this guide to integrate these features into your admin application.

---

## Database Schema Changes

### New Fields Added to `User` Model
- `termsAcceptedAt` (DateTime, nullable) - Timestamp when user accepted Terms of Service
- `privacyAcceptedAt` (DateTime, nullable) - Timestamp when user accepted Privacy Policy

**Migration SQL:**
```sql
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "privacyAcceptedAt" TIMESTAMP(3);
```

---

## API Endpoints

### 1. Registration Endpoints (Updated)

#### Web Registration
**POST** `/api/register`

**Request Body:**
```json
{
  "token": "invitation-token",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePassword123!",
  "consentAccepted": true  // NEW: Required field
}
```

**Changes:**
- ✅ Now requires `consentAccepted: true` in request body
- ✅ Returns error if `consentAccepted` is missing or false
- ✅ Automatically sets `termsAcceptedAt` and `privacyAcceptedAt` timestamps
- ✅ Logs three security events: `USER_REGISTERED`, `TERMS_ACCEPTED`, `PRIVACY_POLICY_ACCEPTED`

**Error Response (if consent not accepted):**
```json
{
  "error": "You must accept the Terms of Service and Privacy Policy to register"
}
```

#### Mobile Registration
**POST** `/api/mobile/auth/register`

**Request Body:**
```json
{
  "token": "invitation-token",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePassword123!",
  "consentAccepted": true  // NEW: Required field
}
```

**Changes:**
- ✅ Same as web registration - requires `consentAccepted: true`
- ✅ Sets both consent timestamps
- ✅ Logs security events

---

### 2. New Legal Consent Endpoints

#### Accept Privacy Policy
**POST** `/api/legal/accept-privacy`

**Authentication:** Required (NextAuth session)

**Request Body:**
```json
{
  "accepted": true
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Privacy policy accepted",
  "privacyAcceptedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401` - Unauthorized (no session)
- `400` - `accepted` field missing or not true
- `500` - Server error

**Use Cases:**
- Allow users to re-accept privacy policy after updates
- Track when users accept privacy policy outside of registration

---

#### Check Privacy Status
**GET** `/api/legal/privacy-status`

**Authentication:** Required (NextAuth session)

**Success Response:**
```json
{
  "privacyAccepted": true,
  "privacyAcceptedAt": "2024-01-15T10:30:00.000Z",
  "termsAccepted": true,
  "termsAcceptedAt": "2024-01-15T10:30:00.000Z"
}
```

**Use Cases:**
- Check if user has accepted privacy policy
- Display consent status in user profile/settings
- Require re-acceptance if policy updated

---

#### Accept Terms of Service
**POST** `/api/legal/accept-terms`

**Authentication:** Required (NextAuth session)

**Request Body:**
```json
{
  "accepted": true
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Terms of service accepted",
  "termsAcceptedAt": "2024-01-15T10:30:00.000Z"
}
```

---

#### Check Terms Status
**GET** `/api/legal/terms-status`

**Authentication:** Required (NextAuth session)

**Success Response:**
```json
{
  "termsAccepted": true,
  "termsAcceptedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Frontend Pages (Reference)

### Legal Pages Created
- **Terms of Service:** `/legal/terms` - Printable Terms page
- **Privacy Policy:** `/legal/privacy` - Printable Privacy page

Both pages are client components with print functionality.

---

## Admin Application Integration Checklist

### 1. Update Registration Form
- [ ] Add consent checkbox to registration form
- [ ] Add links to Terms (`/legal/terms`) and Privacy (`/legal/privacy`)
- [ ] Ensure checkbox is required before submission
- [ ] Send `consentAccepted: true` in registration API call

**Example Registration Form:**
```tsx
<div className="flex items-start gap-2">
  <input
    id="consent"
    type="checkbox"
    checked={consentAccepted}
    onChange={(e) => setConsentAccepted(e.target.checked)}
    required
  />
  <label htmlFor="consent">
    I agree to the{' '}
    <a href="/legal/terms" target="_blank">Terms of Service</a>
    {' '}and{' '}
    <a href="/legal/privacy" target="_blank">Privacy Policy</a>
  </label>
</div>
```

### 2. User Profile/Settings Page
- [ ] Display consent acceptance status
- [ ] Show timestamps for Terms and Privacy acceptance
- [ ] Add "Re-accept" buttons if policy updated
- [ ] Call `/api/legal/privacy-status` to check current status

**Example Status Display:**
```tsx
const [consentStatus, setConsentStatus] = useState(null)

useEffect(() => {
  fetch('/api/legal/privacy-status')
    .then(res => res.json())
    .then(data => setConsentStatus(data))
}, [])

// Display:
{consentStatus?.privacyAccepted ? (
  <p>Privacy Policy accepted on {new Date(consentStatus.privacyAcceptedAt).toLocaleDateString()}</p>
) : (
  <button onClick={handleAcceptPrivacy}>Accept Privacy Policy</button>
)}
```

### 3. User Management (Admin View)
- [ ] Add columns to user table: `termsAcceptedAt`, `privacyAcceptedAt`
- [ ] Display consent status in user detail view
- [ ] Filter users by consent status if needed
- [ ] Export consent data for compliance reporting

### 4. Compliance Reporting
- [ ] Query users with `privacyAcceptedAt` and `termsAcceptedAt` fields
- [ ] Generate reports showing acceptance rates
- [ ] Track users who haven't accepted policies
- [ ] Monitor acceptance timestamps for audit purposes

---

## API Integration Examples

### JavaScript/TypeScript

#### Registration with Consent
```typescript
const registerUser = async (data: {
  token: string
  firstName: string
  lastName: string
  password: string
  consentAccepted: boolean
}) => {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      consentAccepted: true // Required
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }
  
  return response.json()
}
```

#### Accept Privacy Policy
```typescript
const acceptPrivacyPolicy = async () => {
  const response = await fetch('/api/legal/accept-privacy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accepted: true })
  })
  
  if (!response.ok) {
    throw new Error('Failed to accept privacy policy')
  }
  
  return response.json()
}
```

#### Check Consent Status
```typescript
const getConsentStatus = async () => {
  const response = await fetch('/api/legal/privacy-status')
  
  if (!response.ok) {
    throw new Error('Failed to fetch consent status')
  }
  
  return response.json()
}
```

---

## Security Events Logged

The following event types are automatically logged to `SecurityEvent` table:

- `USER_REGISTERED` - When user registers
- `TERMS_ACCEPTED` - When user accepts terms (registration or re-acceptance)
- `PRIVACY_POLICY_ACCEPTED` - When user accepts privacy policy (registration or re-acceptance)

All events include:
- User ID
- Timestamp
- Description
- Severity level (INFO)

---

## Audit Trail

All consent acceptance actions are logged in `AuditLog` table with:
- **Action:** `UPDATE`
- **Resource:** `USER`
- **Resource ID:** User ID
- **Description:** "User accepted privacy policy" or "User accepted terms of service"
- **IP Address:** Automatically captured
- **User Agent:** Automatically captured

---

## Database Queries for Admin

### Get Users Without Privacy Acceptance
```sql
SELECT id, email, firstName, lastName, createdAt
FROM "User"
WHERE "privacyAcceptedAt" IS NULL;
```

### Get Users Who Accepted in Last 30 Days
```sql
SELECT id, email, "privacyAcceptedAt", "termsAcceptedAt"
FROM "User"
WHERE "privacyAcceptedAt" >= NOW() - INTERVAL '30 days';
```

### Get Acceptance Statistics
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT("privacyAcceptedAt") as privacy_accepted,
  COUNT("termsAcceptedAt") as terms_accepted,
  COUNT(*) FILTER (WHERE "privacyAcceptedAt" IS NULL) as privacy_pending,
  COUNT(*) FILTER (WHERE "termsAcceptedAt" IS NULL) as terms_pending
FROM "User";
```

---

## Testing Checklist

- [ ] Test registration with `consentAccepted: true` - should succeed
- [ ] Test registration with `consentAccepted: false` - should fail with error
- [ ] Test registration without `consentAccepted` field - should fail
- [ ] Verify timestamps are stored correctly in database
- [ ] Test `/api/legal/accept-privacy` endpoint
- [ ] Test `/api/legal/privacy-status` endpoint
- [ ] Test `/api/legal/accept-terms` endpoint
- [ ] Test `/api/legal/terms-status` endpoint
- [ ] Verify security events are logged
- [ ] Verify audit logs are created
- [ ] Test with authenticated and unauthenticated requests

---

## Important Notes

1. **Backward Compatibility:** Existing users will have `null` values for consent timestamps. You may want to prompt them to accept policies on next login.

2. **Policy Updates:** If you update Terms or Privacy Policy, you may want to:
   - Store a policy version number
   - Require re-acceptance for updated policies
   - Track which version each user accepted

3. **Mobile App:** The mobile registration endpoint (`/api/mobile/auth/register`) has the same requirements - ensure your mobile app includes the consent checkbox.

4. **Legal Pages:** The Terms and Privacy pages are hosted at `/legal/terms` and `/legal/privacy`. Update these URLs if your admin app is on a different domain.

---

## Support

For questions or issues with the consent implementation, refer to:
- `LEGAL_CONSENT_IMPLEMENTATION.md` - Full implementation details
- `PRIVACY_POLICY_BACKEND_API.md` - API documentation
- Database schema: `prisma/schema.prisma`

