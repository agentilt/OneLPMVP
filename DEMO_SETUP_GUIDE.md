# Demo User Setup Guide

## Overview
This guide helps you set up a demo user that can login without MFA requirements for development and demonstration purposes.

## Demo User Credentials
- **Email**: `demo@onelp.capital`
- **Password**: `demo123`
- **Role**: USER
- **MFA**: Disabled (for easy demo access)

## Setup Methods

### Method 1: Using the Demo Script (Recommended)

1. **Run the demo user creation script**:
   ```bash
   npm run demo:create
   ```

2. **The script will**:
   - Create a demo user with email `demo@onelp.capital`
   - Set password to `demo123`
   - Disable MFA for this user
   - Create a sample fund for demonstration
   - Grant access to the sample fund

### Method 2: Using Database Seed

1. **Run the database seed**:
   ```bash
   npm run db:seed
   ```

2. **This will create**:
   - Admin user
   - Demo user (no MFA)
   - Data manager user
   - Sample funds and data

### Method 3: Manual Database Creation

If you prefer to create the user manually:

```sql
-- Create demo user
INSERT INTO "User" (
  "id", "email", "name", "firstName", "lastName", "password", 
  "role", "mfaEnabled", "emailVerified", "lastLoginAt", 
  "loginAttempts", "lockedUntil", "createdAt", "updatedAt"
) VALUES (
  'demo-user-id', 'demo@onelp.capital', 'Demo User', 'Demo', 'User',
  '$2b$12$hashedpassword', 'USER', false, NOW(), NOW(), 0, null, NOW(), NOW()
);
```

## Authentication Logic

The system automatically skips MFA for demo users:

```typescript
// In src/lib/auth.ts
const isDemoUser = user.email === 'demo@onelp.capital' || user.email === 'demo@example.com'
if (user.mfaEnabled && user.mfaSettings?.enabled && !isDemoUser) {
  // MFA logic only applies to non-demo users
}
```

## Demo Features

The demo user has access to:
- ✅ Login without MFA
- ✅ View sample fund data
- ✅ Access user dashboard
- ✅ All standard user features
- ❌ Admin functions (requires admin role)

## Security Notes

- Demo user is explicitly configured with `mfaEnabled: false`
- Password is simple for demo purposes (`demo123`)
- Only works for specific demo email addresses
- Production users still require MFA when enabled

## Testing the Demo

1. **Start your application**:
   ```bash
   npm run dev
   ```

2. **Navigate to login page**

3. **Use demo credentials**:
   - Email: `demo@onelp.capital`
   - Password: `demo123`

4. **Should login successfully** without MFA prompt

## Troubleshooting

### If demo user doesn't exist:
```bash
npm run demo:create
```

### If MFA is still required:
- Check that the email matches exactly: `demo@onelp.capital`
- Verify the user has `mfaEnabled: false` in database
- Check the authentication logic in `src/lib/auth.ts`

### If login fails:
- Ensure database migrations are run: `npm run db:push`
- Check that the user exists in the database
- Verify password hash is correct

## Customization

To add more demo users or change the demo email:

1. **Update the authentication logic** in `src/lib/auth.ts`:
   ```typescript
   const isDemoUser = user.email === 'demo@onelp.capital' || 
                     user.email === 'your-custom-demo@email.com'
   ```

2. **Update the demo creation script** in `scripts/create-demo-user.ts`

3. **Update the seed script** in `prisma/seed.ts`
