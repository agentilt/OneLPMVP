# Backend Privacy Policy Acceptance Implementation

## Summary
Added backend API endpoints to handle privacy policy acceptance and status checking for OneLP.

## New API Endpoints

### 1. Accept Privacy Policy
**POST** `/api/legal/accept-privacy`

Accepts or re-accepts the privacy policy for the authenticated user.

**Request Body:**
```json
{
  "accepted": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Privacy policy accepted",
  "privacyAcceptedAt": "2024-01-15T10:30:00.000Z"
}
```

**Features:**
- Requires authentication
- Updates `privacyAcceptedAt` timestamp
- Logs security event (`PRIVACY_POLICY_ACCEPTED`)
- Creates audit log entry
- Returns updated timestamp

### 2. Check Privacy Status
**GET** `/api/legal/privacy-status`

Checks the privacy policy and terms acceptance status for the authenticated user.

**Response:**
```json
{
  "privacyAccepted": true,
  "privacyAcceptedAt": "2024-01-15T10:30:00.000Z",
  "termsAccepted": true,
  "termsAcceptedAt": "2024-01-15T10:30:00.000Z"
}
```

### 3. Accept Terms of Service
**POST** `/api/legal/accept-terms`

Accepts or re-accepts the terms of service for the authenticated user.

**Request Body:**
```json
{
  "accepted": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Terms of service accepted",
  "termsAcceptedAt": "2024-01-15T10:30:00.000Z"
}
```

### 4. Check Terms Status
**GET** `/api/legal/terms-status`

Checks the terms of service acceptance status for the authenticated user.

**Response:**
```json
{
  "termsAccepted": true,
  "termsAcceptedAt": "2024-01-15T10:30:00.000Z"
}
```

## Enhanced Registration Logging

### Web Registration (`/api/register`)
- Now logs three security events on registration:
  1. `USER_REGISTERED` - User registration event
  2. `TERMS_ACCEPTED` - Terms acceptance during registration
  3. `PRIVACY_POLICY_ACCEPTED` - Privacy policy acceptance during registration

### Mobile Registration (`/api/mobile/auth/register`)
- Now logs two security events on registration:
  1. `TERMS_ACCEPTED` - Terms acceptance during mobile registration
  2. `PRIVACY_POLICY_ACCEPTED` - Privacy policy acceptance during mobile registration

## Security Features

1. **Authentication Required**: All endpoints require authenticated sessions
2. **Audit Logging**: All acceptance actions are logged in the audit trail
3. **Security Events**: Privacy and terms acceptance are tracked as security events
4. **Timestamp Tracking**: Exact timestamps are stored for compliance purposes

## Usage Examples

### Accept Privacy Policy (JavaScript)
```javascript
const response = await fetch('/api/legal/accept-privacy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ accepted: true }),
});

const data = await response.json();
console.log('Privacy accepted at:', data.privacyAcceptedAt);
```

### Check Privacy Status (JavaScript)
```javascript
const response = await fetch('/api/legal/privacy-status');
const status = await response.json();

if (!status.privacyAccepted) {
  // Show privacy policy acceptance prompt
}
```

## Database Fields

The following fields are used in the `User` model:
- `privacyAcceptedAt` (DateTime, nullable) - Timestamp when privacy policy was accepted
- `termsAcceptedAt` (DateTime, nullable) - Timestamp when terms were accepted

## Security Events Logged

The following event types are logged:
- `PRIVACY_POLICY_ACCEPTED` - When user accepts privacy policy
- `TERMS_ACCEPTED` - When user accepts terms of service

## Audit Trail

All acceptance actions are logged in the `AuditLog` table with:
- Action: `UPDATE`
- Resource: `USER`
- Description: "User accepted privacy policy" or "User accepted terms of service"
- User ID, IP address, and user agent are automatically captured

## Integration Points

These endpoints can be integrated with:
- Settings page - Allow users to view and re-accept policies
- Admin dashboard - View user acceptance status
- Compliance reporting - Track acceptance rates and timestamps
- Mobile app - Accept policies from mobile devices

