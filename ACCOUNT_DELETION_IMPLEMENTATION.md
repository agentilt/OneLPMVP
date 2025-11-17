# Account Deletion Feature - Implementation Guide

## Overview

This document describes the account deletion feature implementation for OneLP, which fulfills GDPR Article 17 (Right to Erasure) requirements.

## Features Implemented

### 1. Account Deletion API (`/api/user/delete-account`)

**Endpoints:**
- `POST /api/user/delete-account` - Request account deletion
- `DELETE /api/user/delete-account?token={token}` - Confirm and execute deletion

### 2. User Interface Pages

**Pages:**
- `/settings/delete-account` - Main deletion workflow
- `/settings/delete-account/confirm` - Email confirmation handler

### 3. Data Export API (`/api/user/export-data`)

**Endpoint:**
- `GET /api/user/export-data` - Export all user data in JSON format

---

## Deletion Workflow

### Step 1: User Initiates Deletion

1. User navigates to Settings → Data & Privacy
2. Clicks "Delete Account" button
3. Sees warning page with:
   - Explanation of what will be deleted
   - What will be retained (anonymized audit logs)
   - Recommendations before proceeding

### Step 2: Confirmation

1. User types "DELETE" to confirm
2. User enters their password for verification
3. System validates confirmation and password
4. System generates secure deletion token (32-byte random, SHA-256 hashed)
5. Token stored in user record with 24-hour expiration

### Step 3: Email Confirmation

1. Confirmation email sent with deletion link
2. Email includes:
   - Warning about permanence
   - List of what will be deleted
   - Secure confirmation button
   - 24-hour expiration notice

### Step 4: Final Deletion

1. User clicks confirmation link in email
2. System validates token
3. System executes deletion in database transaction:
   - Anonymizes audit logs (removes PII, retains for compliance)
   - Anonymizes security events
   - Deletes activity events
   - Deletes user sessions
   - Deletes MFA settings and tokens
   - Deletes password reset tokens
   - Deletes invitations sent by user
   - Deletes fund access records
   - Deletes funds owned by user (including related documents and NAV history)
   - Deletes direct investments (including related documents)
   - Deletes user account
4. Confirmation email sent
5. User automatically signed out

---

## Data Handling

### Data Deleted Immediately

- User profile (name, email, personal info)
- Authentication credentials
- Sessions and tokens
- MFA settings
- Activity events
- Fund access records
- Funds owned by user
- Direct investments
- All associated documents

### Data Anonymized (Retained for Compliance)

- Audit logs (PII removed, marked as "REDACTED")
- Security events (PII removed, marked as "REDACTED")
- Metadata: `{ anonymized: true, deletionDate: "ISO timestamp" }`

### Why Retain Anonymized Logs?

**Legal Requirements:**
- SOC 2 compliance requires audit trails
- Financial regulations require transaction history
- Security investigations may need historical data
- Legal hold requirements

**What's Removed:**
- Email addresses
- Names
- IP addresses
- User agents
- Any personally identifiable information

**What's Retained:**
- Action types (CREATE, UPDATE, DELETE)
- Resource types (FUND, DOCUMENT, etc.)
- Timestamps
- Anonymized user ID flag

---

## Security Features

### Multi-Step Verification

1. **Password verification** - Ensures request is from legitimate user
2. **Confirmation text** - Requires typing "DELETE" exactly
3. **Email confirmation** - Prevents unauthorized deletion via session hijacking
4. **Time-limited token** - 24-hour expiration prevents token reuse

### Token Security

- 32-byte cryptographically secure random token
- SHA-256 hashed before storage
- Single-use only
- Expires in 24 hours
- Invalidated after use

### Audit Trail

All deletion actions are logged:
- Deletion request (with timestamp and IP)
- Deletion confirmation (with token usage)
- Final deletion completion

---

## Email Templates

### Confirmation Email

**Subject:** Confirm Account Deletion - OneLP

**Content:**
- Warning about permanence
- List of data to be deleted
- Secure confirmation button
- 24-hour expiration notice
- Instructions if deletion was not requested

### Completion Email

**Subject:** Account Deleted - OneLP

**Content:**
- Confirmation of deletion
- List of deleted data
- Note about anonymized audit logs
- Thank you message
- Contact information if deletion was unauthorized

---

## Data Export Feature

### Purpose

Fulfills GDPR Article 20 (Right to Data Portability)

### Export Contents

**Personal Information:**
- User ID, email, name
- Role and verification status
- Account creation date

**Security Settings:**
- MFA status
- Last login date

**Consent Records:**
- Terms acceptance timestamp
- Privacy policy acceptance timestamp
- Email preferences

**Investment Data:**
- Funds (with performance metrics)
- Fund access records
- Direct investments
- Documents metadata

**Activity Data:**
- Recent activity history (last 90 days)
- Session history (last 30 days)
- Security events (last 90 days)

**Data Processing Information:**
- Processing purposes
- Legal basis
- Data retention periods
- International transfers
- User rights information

### Export Format

- **Format:** JSON
- **Encoding:** UTF-8
- **Structure:** Nested objects with clear categorization
- **Filename:** `onelp-data-export-{email}-{timestamp}.json`

### Audit Logging

Every export is logged for compliance:
- Timestamp
- IP address
- User agent
- Export action recorded in audit log and security events

---

## Integration with Settings Page

### Updated UI

**Data & Privacy Section:**
```typescript
<button onClick={() => window.location.href = '/api/user/export-data'}>
  Export Data
</button>

<button onClick={() => window.location.href = '/settings/delete-account'}>
  Delete Account
</button>
```

### User Experience

1. **Export Data**: Downloads JSON file immediately
2. **Delete Account**: Opens multi-step deletion workflow

---

## Testing Checklist

### Functional Testing

- [ ] User can request account deletion
- [ ] Confirmation email is sent
- [ ] Email link works and validates token
- [ ] Account is fully deleted after confirmation
- [ ] User is signed out after deletion
- [ ] Audit logs are anonymized, not deleted
- [ ] Security events are anonymized, not deleted
- [ ] Related data (funds, investments) is deleted
- [ ] Data export downloads correctly
- [ ] Export includes all user data
- [ ] Export is logged in audit trail

### Security Testing

- [ ] Password validation works
- [ ] Confirmation text must match exactly
- [ ] Token expires after 24 hours
- [ ] Token is single-use
- [ ] Invalid tokens are rejected
- [ ] Unauthorized users cannot delete accounts
- [ ] Session hijacking doesn't allow deletion (email confirmation required)

### Edge Cases

- [ ] User with multiple funds
- [ ] User with multiple direct investments
- [ ] User with pending invitations
- [ ] User with active sessions on multiple devices
- [ ] Token expiration handling
- [ ] Email delivery failure handling
- [ ] Database transaction rollback on error

---

## GDPR Compliance Checklist

### Article 17: Right to Erasure ✅

- [x] User can request erasure
- [x] Verification mechanism implemented
- [x] Data deleted without undue delay
- [x] Audit logs retained for legal compliance (anonymized)
- [x] User notified of deletion completion

### Article 20: Right to Data Portability ✅

- [x] Data provided in structured format (JSON)
- [x] Machine-readable format
- [x] Includes all personal data
- [x] Can be transmitted to another controller

### Additional Compliance

- [x] Consent tracking (termsAcceptedAt, privacyAcceptedAt)
- [x] Audit logging for all actions
- [x] Security event logging
- [x] IP address and user agent logging
- [x] Transparent data processing information

---

## SOC 2 Compliance

### Relevant Controls

**CC6.1 - Logical Access:**
- Password verification before deletion
- Multi-factor confirmation process

**CC7.2 - System Operations:**
- Proper data deletion procedures
- Audit log retention for compliance

**CC7.3 - Change Management:**
- Deletion workflow documented
- Testing procedures established

**CC8.1 - Risk Mitigation:**
- Prevents unauthorized deletion
- Time-limited tokens
- Email verification

---

## Monitoring and Maintenance

### Metrics to Track

- Number of deletion requests per month
- Number of completed deletions
- Number of expired tokens (user changed mind)
- Average time from request to completion
- Data export requests per month

### Alerts

Set up alerts for:
- Spike in deletion requests (potential security issue)
- Failed deletions (system errors)
- Email delivery failures

### Regular Reviews

- Quarterly review of deletion process
- Annual review of data retention policies
- Regular testing of backup restoration (ensure deleted data stays deleted)

---

## Rollback and Recovery

### If User Deletes by Mistake

**Prevention:**
- Multi-step confirmation process
- 24-hour window to cancel (don't click email link)
- Clear warnings throughout process

**After Deletion:**
- Account CANNOT be recovered
- User must create new account
- Historical data is lost (this is by design for GDPR compliance)

### Database Backup Considerations

**Important:** Deleted accounts in backups must be handled properly:
- Document backup retention policy
- Note in privacy policy: "Backups may retain data for [X] days"
- Ensure backup restoration doesn't resurrect deleted accounts
- Consider implementing "deletion markers" in backups

---

## Known Limitations

### Current Implementation

1. **No Grace Period**: Deletion is immediate after email confirmation
   - **Future Enhancement**: Optional 30-day grace period before final deletion
   
2. **No Partial Deletion**: All or nothing approach
   - **Future Enhancement**: Allow users to delete specific data types
   
3. **No Data Transfer**: User must manually save exported data
   - **Future Enhancement**: Direct transfer to another service

4. **Admin Accounts**: Currently admins can delete their own accounts
   - **Consideration**: May want to prevent last admin from deleting

---

## API Documentation

### POST /api/user/delete-account

**Request Account Deletion**

**Authentication:** Required (Session)

**Request Body:**
```json
{
  "confirmationText": "DELETE",
  "password": "user_password"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Account deletion confirmation email sent...",
  "expiresAt": "2024-11-18T10:00:00.000Z"
}
```

**Response (Error):**
```json
{
  "error": "Invalid password"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request (invalid confirmation text)
- `401` - Unauthorized (invalid password or no session)
- `500` - Server error

---

### DELETE /api/user/delete-account?token={token}

**Confirm and Execute Deletion**

**Authentication:** Required (Session)

**Query Parameters:**
- `token` - Deletion confirmation token from email

**Response (Success):**
```json
{
  "success": true,
  "message": "Account successfully deleted"
}
```

**Response (Error):**
```json
{
  "error": "Invalid or expired deletion token"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid/expired token
- `401` - Unauthorized (no session)
- `500` - Server error

---

### GET /api/user/export-data

**Export All User Data**

**Authentication:** Required (Session)

**Response:** JSON file download

**Content-Type:** `application/json`

**Content-Disposition:** `attachment; filename="onelp-data-export-{email}-{timestamp}.json"`

**Response Structure:**
```json
{
  "exportMetadata": {
    "exportDate": "2024-11-17T10:00:00.000Z",
    "exportVersion": "1.0",
    "dataRetentionNote": "..."
  },
  "personalInformation": { ... },
  "securitySettings": { ... },
  "consent": { ... },
  "emailPreferences": { ... },
  "funds": [ ... ],
  "fundAccess": [ ... ],
  "directInvestments": [ ... ],
  "activityHistory": [ ... ],
  "sessionHistory": [ ... ],
  "securityEvents": [ ... ],
  "dataProcessingInformation": { ... }
}
```

**Status Codes:**
- `200` - Success (file download)
- `401` - Unauthorized
- `404` - User not found
- `500` - Server error

---

## Future Enhancements

### Phase 2 Features

1. **Grace Period**
   - 30-day grace period before permanent deletion
   - User can cancel during grace period
   - Account marked as "pending deletion"
   - Automated deletion after grace period

2. **Partial Deletion**
   - Delete specific data types
   - Keep account but remove certain information
   - Granular deletion options

3. **Data Transfer**
   - Export in multiple formats (CSV, PDF)
   - Direct transfer to another platform
   - API for automated transfers

4. **Admin Controls**
   - Prevent last admin from deleting account
   - Admin review for certain accounts
   - Bulk deletion for inactive accounts

5. **Enhanced Notifications**
   - SMS confirmation option
   - Multiple email reminders
   - Warning to connected users (if applicable)

---

## Support and Troubleshooting

### Common Issues

**Issue:** Email not received
- Check spam folder
- Verify email address is correct
- Check email service logs
- Resend option needed

**Issue:** Token expired
- Request new deletion
- Explain 24-hour limit
- Consider extending to 48 hours

**Issue:** Cannot verify password
- Reset password first
- Ensure caps lock is off
- Check for special characters

**Issue:** Deletion fails partway through
- Transaction rollback ensures consistency
- Check database logs
- Retry deletion
- Contact support if persistent

### Support Contact

For issues with account deletion:
- Email: info@onelp.capital
- Privacy contact: privacy@onelp.capital

---

## Compliance Documentation

### Records to Maintain

For each deletion:
- Request timestamp
- Confirmation timestamp  
- Completion timestamp
- IP addresses
- Email delivery confirmations
- Any errors or issues

### Reporting

Monthly report should include:
- Total deletion requests
- Completed deletions
- Cancelled/expired requests
- Average completion time
- Any issues or errors

---

## Conclusion

This account deletion feature provides OneLP users with full control over their data while maintaining compliance with GDPR requirements. The multi-step verification process ensures security while the comprehensive data deletion ensures privacy.

The anonymized audit log retention balances user privacy with legitimate business and legal needs for record-keeping.

---

**Implementation Status:** ✅ Complete

**Version:** 1.0

**Last Updated:** November 17, 2024

**Next Review:** December 17, 2024

