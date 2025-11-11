# Invitation Creation Foreign Key Error Fix

## Problem
When creating an invitation through `/api/admin/clients/[clientId]/invitations`, the backend throws:
```
Foreign key constraint violated: `Invitation_invitedBy_fkey (index)`
```

This occurs because the `invitedBy` field references a user ID that doesn't exist in the User table.

## Root Cause
The backend is trying to extract the user ID from the NextAuth session cookie, but:
1. The session cookie from the admin app domain may not be readable by the backend domain
2. The user ID in the session might not exist in the backend's database
3. The session extraction might be failing silently

## Frontend Fix (Completed)
Updated `/api/proxy/[...path]/route.ts` to:
- Extract the user ID from the NextAuth session token
- Pass it explicitly in an `x-user-id` header to the backend
- Log the extracted user ID for debugging

## Backend Fix Required
The backend at `onelp.capital` needs to be updated to:

### Option 1: Use the `x-user-id` header (Recommended)
```typescript
// In the invitation creation route
const userId = req.headers.get('x-user-id') || await getUserIdFromSession(req)

// Verify user exists before creating invitation
const userExists = await prisma.user.findUnique({
  where: { id: userId }
})

if (!userExists) {
  return NextResponse.json(
    { error: 'Invalid user ID for invitation creation' },
    { status: 400 }
  )
}

// Create invitation with verified user ID
const invitation = await prisma.invitation.create({
  data: {
    email,
    token,
    invitedBy: userId, // Use verified user ID
    // ... other fields
  }
})
```

### Option 2: Verify user exists before using
```typescript
// Get user ID from session
const userId = await getUserIdFromSession(req)

// Verify user exists
const user = await prisma.user.findUnique({
  where: { id: userId }
})

if (!user) {
  return NextResponse.json(
    { error: 'User not found. Please ensure you are logged in with a valid account.' },
    { status: 401 }
  )
}

// Create invitation
const invitation = await prisma.invitation.create({
  data: {
    email,
    token,
    invitedBy: user.id,
    // ... other fields
  }
})
```

### Option 3: Handle missing user gracefully
```typescript
try {
  const invitation = await prisma.invitation.create({
    data: {
      email,
      token,
      invitedBy: userId,
      // ... other fields
    }
  })
} catch (error) {
  if (error.code === 'P2003') {
    // Foreign key constraint violation
    return NextResponse.json(
      { 
        error: 'Invalid user session. Please log out and log back in.',
        details: 'The user ID in your session does not exist in the database.'
      },
      { status: 401 }
    )
  }
  throw error
}
```

## Testing
1. Check server logs for `[Proxy] Extracted user ID from session: <id>`
2. Verify the user ID exists in the backend database
3. Ensure the backend reads the `x-user-id` header
4. Test invitation creation after fix

## Additional Notes
- The frontend proxy now extracts and forwards the user ID
- Backend should prefer `x-user-id` header over session cookie parsing
- Backend should validate user exists before creating invitation
- Consider adding better error messages to help debug session issues

