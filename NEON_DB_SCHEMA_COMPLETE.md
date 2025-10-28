# Neon Database Schema - Complete Reference

This document provides a complete overview of the Neon (PostgreSQL) database schema for the OneLPMVP application.

## Database Configuration

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Models Overview

### Core Models

#### 1. Client Model
**Purpose**: Organizational clients that have accounts and funds

**Fields:**
- `id` (String, @id, CUID)
- `name` (String) - Client organization name
- `email` (String, optional) - Contact email
- `phone` (String, optional) - Contact phone
- `address` (String, optional) - Physical address
- `notes` (String, optional) - Additional notes
- `createdAt` (DateTime, auto) - Creation timestamp
- `updatedAt` (DateTime, auto) - Last update timestamp

**Relationships:**
- Has many: `User[]` (accounts)
- Has many: `Fund[]`

**Indexes:**
- Name (for search)
- Email (for contact lookups)

**SQL Definition:**
```sql
CREATE TABLE "Client" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

#### 2. User Model
**Purpose**: Core user account management with authentication and security features

**Fields:**
- `id` (String, @id, CUID)
- `email` (String, unique) - User's email address
- `name` (String, optional) - Display name
- `firstName` (String, optional) - First name
- `lastName` (String, optional) - Last name
- `password` (String) - Hashed password
- `role` (Role enum, default: USER) - USER, ADMIN, or DATA_MANAGER
- `emailVerified` (DateTime, optional) - Email verification timestamp
- `resetToken` (String, optional) - Password reset token
- `resetTokenExpiry` (DateTime, optional) - Reset token expiration
- `mfaEnabled` (Boolean, default: false) - Multi-factor authentication status
- `lastLoginAt` (DateTime, optional) - Last login timestamp
- `loginAttempts` (Int, default: 0) - Failed login counter
- `lockedUntil` (DateTime, optional) - Account lockout expiration
- `clientId` (String, optional) - The client this user belongs to
- `createdAt` (DateTime, auto) - Account creation timestamp
- `updatedAt` (DateTime, auto) - Last update timestamp

**Relationships:**
- Belongs to: `Client` (optional)
- Has many: `AuditLog[]`
- Has many: `CryptoHolding[]`
- Has many: `Fund[]` (owned)
- Has many: `FundAccess[]`
- Has many: `Invitation[]` (sent)
- Has many: `PasswordReset[]`
- Has many: `MFAToken[]`
- Has one: `MFASettings`
- Has many: `UserSession[]`
- Has many: `SecurityEvent[]`

**Indexes:**
- Email (for login lookups)
- Reset token (for password reset)
- MFA enabled status
- Last login timestamp
- Account lockout

---

#### 2. Fund Model
**Purpose**: Private equity fund management with financial metrics

**Fields:**
- `id` (String, @id, CUID)
- `userId` (String, optional) - Owner/creator of the fund (kept for backward compatibility)
- `clientId` (String) - The client this fund belongs to
- `name` (String) - Fund name
- `domicile` (String) - Country/jurisdiction
- `vintage` (Int) - Year established
- `manager` (String) - Fund manager name
- `managerEmail` (String, optional) - Manager contact email
- `managerPhone` (String, optional) - Manager contact phone
- `managerWebsite` (String, optional) - Manager website URL
- `commitment` (Float) - Total committed capital
- `paidIn` (Float) - Capital paid in
- `nav` (Float) - Net Asset Value
- `irr` (Float) - Internal Rate of Return
- `tvpi` (Float) - Total Value to Paid-In ratio
- `dpi` (Float) - Distributions to Paid-In ratio
- `lastReportDate` (DateTime) - Last financial report date
- `createdAt` (DateTime, auto) - Creation timestamp
- `updatedAt` (DateTime, auto) - Last update timestamp

**Relationships:**
- Belongs to: `Client` (primary relationship)
- Belongs to: `User` (owner, optional, backward compatibility)
- Has many: `Document[]`
- Has many: `FundAccess[]`
- Has many: `NavHistory[]`

**Indexes:**
- Fund name
- User ID (for user's funds)

---

#### 3. Document Model
**Purpose**: Fund-related documents (reports, capital calls, compliance docs)

**Fields:**
- `id` (String, @id, CUID)
- `fundId` (String) - Associated fund
- `type` (DocumentType enum) - Document category
- `title` (String) - Document title
- `uploadDate` (DateTime) - When uploaded
- `dueDate` (DateTime, optional) - Payment or action due date
- `callAmount` (Float, optional) - Capital call amount
- `paymentStatus` (PaymentStatus enum, optional) - PENDING, PAID, LATE, OVERDUE
- `url` (String) - File storage location
- `parsedData` (JSON, optional) - Extracted document data
- `investmentValue` (Float, optional) - Investment value
- `createdAt` (DateTime, auto) - Creation timestamp
- `updatedAt` (DateTime, auto) - Last update timestamp

**Relationships:**
- Belongs to: `Fund`

**Indexes:**
- Fund ID (for fund documents)
- Document type (for filtering by type)

**Document Types:**
- CAPITAL_CALL
- QUARTERLY_REPORT
- ANNUAL_REPORT
- KYC
- COMPLIANCE
- OTHER

**Payment Status:**
- PENDING
- PAID
- LATE
- OVERDUE

---

#### 4. FundAccess Model
**Purpose**: Access control for funds (which users can see which funds)

**Fields:**
- `id` (String, @id, CUID)
- `userId` (String) - User with access
- `fundId` (String) - Fund they can access
- `createdAt` (DateTime, auto) - When access was granted

**Relationships:**
- Belongs to: `User`
- Belongs to: `Fund`

**Constraints:**
- Unique constraint on [userId, fundId] (prevents duplicate access)

**Indexes:**
- User ID (user's accessible funds)
- Fund ID (fund's authorized users)

---

#### 5. NavHistory Model
**Purpose**: Historical NAV tracking for funds

**Fields:**
- `id` (String, @id, CUID)
- `fundId` (String) - Associated fund
- `date` (DateTime) - NAV date
- `nav` (Float) - Net Asset Value
- `createdAt` (DateTime, auto) - Record creation time

**Relationships:**
- Belongs to: `Fund`

**Indexes:**
- Composite index on [fundId, date] (for historical queries)

---

#### 6. CryptoHolding Model
**Purpose**: User cryptocurrency holdings

**Fields:**
- `id` (String, @id, CUID)
- `userId` (String) - Owner
- `symbol` (String) - Crypto symbol (e.g., BTC, ETH)
- `name` (String) - Crypto name
- `amount` (Float) - Quantity held
- `valueUsd` (Float) - USD value
- `updatedAt` (DateTime, auto) - Last update timestamp

**Relationships:**
- Belongs to: `User`

**Constraints:**
- Unique constraint on [userId, symbol] (one record per crypto per user)

**Indexes:**
- User ID (user's crypto holdings)

---

## Security Models

#### 7. AuditLog Model
**Purpose**: System-wide audit trail

**Fields:**
- `id` (String, @id, CUID)
- `userId` (String) - User who performed the action
- `action` (AuditAction enum) - Type of action
- `resource` (AuditResource enum) - What resource was affected
- `resourceId` (String, optional) - ID of affected resource
- `description` (String) - Action description
- `oldValues` (JSON, optional) - Previous state
- `newValues` (JSON, optional) - New state
- `metadata` (JSON, optional) - Additional context
- `ipAddress` (String, optional) - User's IP
- `userAgent` (String, optional) - Browser/client info
- `createdAt` (DateTime, auto) - When action occurred

**Relationships:**
- Belongs to: `User`

**Indexes:**
- Action type
- Created timestamp (for time-based queries)
- Resource type
- Composite index on [userId, createdAt] (user activity timeline)
- User ID

**Audit Actions:**
- CREATE
- UPDATE
- DELETE
- LOGIN
- LOGOUT
- UPLOAD
- DOWNLOAD
- EXPORT
- IMPORT
- RESET_PASSWORD
- CHANGE_PASSWORD
- GRANT_ACCESS
- REVOKE_ACCESS

**Audit Resources:**
- USER
- FUND
- DOCUMENT
- CRYPTO_HOLDING
- FUND_ACCESS
- INVITATION
- SYSTEM

---

#### 8. Invitation Model
**Purpose**: User invitation system

**Fields:**
- `id` (String, @id, CUID)
- `email` (String) - Invited email address
- `token` (String, unique) - Invitation token
- `tokenHash` (String, optional) - Hashed token (security)
- `role` (String, default: "USER") - Assigned role
- `expiresAt` (DateTime) - Expiration timestamp
- `usedAt` (DateTime, optional) - When used
- `used` (Boolean, default: false) - Whether invitation was used
- `invitedBy` (String) - User who sent invitation
- `createdAt` (DateTime, auto) - Creation timestamp

**Relationships:**
- Belongs to: `User` (creator)

**Indexes:**
- Token (for lookup)
- Token hash (for secure lookup)
- Email
- Role
- Invited by user

---

#### 9. PasswordReset Model
**Purpose**: Password reset token management

**Fields:**
- `id` (String, @id, CUID)
- `userId` (String) - User requesting reset
- `tokenHash` (String) - Hashed reset token
- `expiresAt` (DateTime) - Expiration timestamp
- `used` (Boolean, default: false) - Whether token was used
- `usedAt` (DateTime, optional) - When used
- `createdAt` (DateTime, auto) - Creation timestamp

**Relationships:**
- Belongs to: `User`

**Indexes:**
- User ID
- Token hash (for lookup)
- Expiration date (for cleanup)

---

#### 10. MFAToken Model
**Purpose**: Multi-factor authentication tokens

**Fields:**
- `id` (String, @id, CUID)
- `userId` (String) - User
- `tokenHash` (String) - Hashed MFA token
- `expiresAt` (DateTime) - Expiration timestamp
- `used` (Boolean, default: false) - Whether token was used
- `usedAt` (DateTime, optional) - When used
- `createdAt` (DateTime, auto) - Creation timestamp

**Relationships:**
- Belongs to: `User`

**Indexes:**
- User ID
- Token hash (for lookup)
- Expiration date

---

#### 11. MFASettings Model
**Purpose**: Multi-factor authentication configuration

**Fields:**
- `id` (String, @id, CUID)
- `userId` (String, unique) - User (one-to-one)
- `enabled` (Boolean, default: false) - MFA status
- `secret` (String, optional) - TOTP secret key
- `backupCodes` (String array) - Backup codes
- `lastUsed` (DateTime, optional) - Last MFA use
- `createdAt` (DateTime, auto) - Creation timestamp
- `updatedAt` (DateTime, auto) - Last update timestamp

**Relationships:**
- Belongs to: `User` (one-to-one)

**Indexes:**
- User ID (unique)

---

#### 12. UserSession Model
**Purpose**: Active user session tracking

**Fields:**
- `id` (String, @id, CUID)
- `userId` (String) - User
- `sessionToken` (String) - Session identifier
- `deviceInfo` (JSON, optional) - Device details
- `ipAddress` (String, optional) - IP address
- `userAgent` (String, optional) - Browser/client
- `lastActivity` (DateTime) - Last activity timestamp
- `expiresAt` (DateTime) - Session expiration
- `isActive` (Boolean, default: true) - Session status
- `createdAt` (DateTime, auto) - Creation timestamp

**Relationships:**
- Belongs to: `User`

**Indexes:**
- User ID
- Session token (for lookup)
- Expiration date (for cleanup)

---

#### 13. SecurityEvent Model
**Purpose**: Security incident logging

**Fields:**
- `id` (String, @id, CUID)
- `userId` (String, optional) - Associated user (nullable)
- `eventType` (String) - Event category
- `description` (String) - Event description
- `ipAddress` (String, optional) - IP address
- `userAgent` (String, optional) - Browser/client
- `metadata` (JSON, optional) - Additional context
- `severity` (String, default: "INFO") - Event severity level
- `createdAt` (DateTime, auto) - Event timestamp

**Relationships:**
- Belongs to: `User` (optional, nullable)

**Indexes:**
- User ID
- Event type
- Timestamp
- Severity level

---

## Enumerations

### Role Enum
```
USER
ADMIN
DATA_MANAGER
```

### DocumentType Enum
```
CAPITAL_CALL
QUARTERLY_REPORT
ANNUAL_REPORT
KYC
COMPLIANCE
OTHER
```

### PaymentStatus Enum
```
PENDING
PAID
LATE
OVERDUE
```

### AuditAction Enum
```
CREATE
UPDATE
DELETE
LOGIN
LOGOUT
UPLOAD
DOWNLOAD
EXPORT
IMPORT
RESET_PASSWORD
CHANGE_PASSWORD
GRANT_ACCESS
REVOKE_ACCESS
```

### AuditResource Enum
```
USER
FUND
DOCUMENT
CRYPTO_HOLDING
FUND_ACCESS
INVITATION
SYSTEM
```

---

## Legacy Models (Need Migration)

**Note**: These snake_case tables appear to be from an earlier version and should be migrated or cleaned up:

- `invitations` - Legacy invitation table
- `users` - Legacy user table

---

## Database Relationships Summary

### New Hierarchical Structure
```
Client (1) ──── (many) User (accounts)
Client (1) ──── (many) Fund ──── (many) Document
```

### Detailed Relationships
```
Client (1) ──── (many) User (accounts)
Client (1) ──── (many) Fund

User (1) ──── (many) Fund (owned)
User (1) ──── (many) FundAccess ──── (many) Fund
User (1) ──── (many) Document (via Fund)
User (1) ──── (many) AuditLog
User (1) ──── (many) Invitation
User (1) ──── (many) PasswordReset
User (1) ──── (many) MFAToken
User (1) ──── (1) MFASettings
User (1) ──── (many) UserSession
User (1) ──── (many) SecurityEvent
User (1) ──── (many) CryptoHolding

Fund (1) ──── (many) Document
Fund (1) ──── (many) NavHistory
Fund (1) ──── (many) FundAccess
```

---

## Key Admin Workflow Considerations

### User Management
- View all users with roles, login history, account status
- Create/update/delete users
- Manage user roles (USER, ADMIN, DATA_MANAGER)
- View user security events and audit logs
- Handle locked accounts and login attempts
- Manage user sessions

### Fund Management
- View all funds with financial metrics
- Assign fund access to users via FundAccess
- Track NAV history over time
- View documents associated with funds
- Manage fund contact information

### Document Management
- View all documents by type
- Track payment status on capital calls
- Monitor due dates
- Upload/manage documents
- View parsed document data

### Security & Audit
- Monitor AuditLog for all system actions
- View SecurityEvent logs for incidents
- Track user activity and changes
- Manage invitations and access grants
- Monitor MFA settings and session activity

### Access Control
- Grant/revoke fund access via FundAccess
- Manage user roles and permissions
- Track access history in AuditLog

---

## Migration Notes

The schema includes migrations in `prisma/migrations/`:
- `add_audit_logs` - Audit logging system
- `add_security_tables` - Security features
- `add_fund_contact_fields` - Fund manager contact info
- `add_user_id_to_fund` - Fund ownership

