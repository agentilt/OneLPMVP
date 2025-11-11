# Legal Terms, Privacy, and Consent Implementation

## Summary
Implemented Terms of Service and Privacy Policy consent requirements for user registration.

## Changes Made

### 1. Database Schema Updates
- Added `termsAcceptedAt` field to User model (DateTime, nullable)
- Added `privacyAcceptedAt` field to User model (DateTime, nullable)
- Created SQL migration file: `prisma/migrations/add_consent_fields.sql`

### 2. Backend API Updates

#### Registration API (`/api/register`)
- Added `consentAccepted` parameter validation
- Returns error if consent checkbox is not checked
- Stores consent timestamps (`termsAcceptedAt` and `privacyAcceptedAt`) when user registers

#### Mobile Registration API (`/api/mobile/auth/register`)
- Added `consentAccepted` parameter validation
- Returns error if consent checkbox is not checked
- Stores consent timestamps when user registers

### 3. Frontend Updates

#### Registration Page (`/app/register/page.tsx`)
- Added consent checkbox with required validation
- Added links to Terms of Service (`/legal/terms`) and Privacy Policy (`/legal/privacy`)
- Links open in new tab
- Form validation prevents submission without consent
- Sends `consentAccepted` boolean to registration API

### 4. Legal Pages Created

#### Terms of Service (`/app/legal/terms/page.tsx`)
- Printable version with print button
- Comprehensive terms covering:
  - Acceptance of terms
  - Use license
  - User account responsibilities
  - Investment information disclaimers
  - Confidentiality
  - Limitations and disclaimers
  - Governing law

#### Privacy Policy (`/app/legal/privacy/page.tsx`)
- Printable version with print button
- Comprehensive privacy policy covering:
  - Information collection
  - How information is used
  - Information sharing
  - Data security
  - Data retention
  - User rights (GDPR compliance)
  - Cookies and tracking
  - International data transfers

## Acceptance Criteria Status

✅ **Links visible** - Terms and Privacy links are visible on registration page  
✅ **Checkbox required** - Consent checkbox is required and validated on both frontend and backend  
✅ **Timestamp stored** - Both `termsAcceptedAt` and `privacyAcceptedAt` are stored with user record  
✅ **Printable versions hosted** - Both Terms and Privacy pages are accessible at `/legal/terms` and `/legal/privacy` with print functionality

## Database Migration

To apply the database changes, run:

```sql
-- Run the migration file
-- prisma/migrations/add_consent_fields.sql
```

Or use Prisma:

```bash
npx prisma migrate dev --name add_consent_fields
```

Note: If Prisma migrate fails due to shadow database issues, you can run the SQL directly on your database.

## Testing Checklist

- [ ] Test registration with consent checkbox checked
- [ ] Test registration without consent checkbox (should fail)
- [ ] Verify Terms of Service page loads and prints correctly
- [ ] Verify Privacy Policy page loads and prints correctly
- [ ] Verify consent timestamps are stored in database
- [ ] Test mobile registration API with consent parameter
- [ ] Verify links open in new tab on registration page

## Notes

- Consent is only collected at registration (signup), not at login
- Admin-created users (via seed or direct creation) don't require consent as they're system users
- The consent timestamps are stored as DateTime fields, allowing for audit trails
- Both Terms and Privacy pages are designed to be printable for compliance purposes

