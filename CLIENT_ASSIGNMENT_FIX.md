# Client Assignment Fix for User Invitations

## Problem
When an admin creates a user invitation through the client detail page (`/clients/[clientId]`), the invitation is created successfully and the user can register, but the `clientId` is not assigned to the user account. The user is created without being associated with the client.

## Root Cause
1. The `Invitation` model does not have a `clientId` field to store which client the invitation is for
2. When creating an invitation via `/api/admin/clients/${clientId}/invitations`, the backend doesn't store the `clientId` on the invitation
3. When accepting the invitation, the backend doesn't read or apply the `clientId` to the newly created user

## Solution

### Step 1: Database Migration - Add `clientId` to Invitation Table

The backend database needs a migration to add a `clientId` field to the `Invitation` table:

```sql
-- Add clientId column to Invitation table
ALTER TABLE "Invitation" 
ADD COLUMN IF NOT EXISTS "clientId" TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_invitation_client_id ON "Invitation"("clientId");

-- Add foreign key constraint (optional, but recommended)
-- Note: Only add this if you want to enforce referential integrity
-- ALTER TABLE "Invitation" 
-- ADD CONSTRAINT "Invitation_clientId_fkey" 
-- FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL;
```

### Step 2: Update Prisma Schema (Backend)

Update the `Invitation` model in your Prisma schema:

```prisma
model Invitation {
  id        String   @id @default(uuid())
  email     String
  token     String   @unique
  tokenHash String?
  role      String   @default("USER")
  expiresAt DateTime
  usedAt    DateTime?
  used      Boolean  @default(false)
  invitedBy String
  clientId  String?  // NEW: Add this field
  createdAt DateTime @default(now())

  User   User    @relation(fields: [invitedBy], references: [id])
  Client Client? @relation(fields: [clientId], references: [id]) // NEW: Add relation

  @@map("Invitation")
}
```

### Step 3: Backend - Store `clientId` When Creating Invitation

Update the invitation creation endpoint at `/api/admin/clients/[clientId]/invitations`:

```typescript
// POST /api/admin/clients/[clientId]/invitations
export async function POST(
  request: Request,
  context: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await context.params
  const body = await request.json()
  const { email } = body

  // Get user ID from x-user-id header (set by proxy) or session
  const userId = request.headers.get('x-user-id') || await getUserIdFromSession(request)

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return NextResponse.json(
      { error: 'User not found. Please log in again.' },
      { status: 401 }
    )
  }

  // Verify client exists
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  })

  if (!client) {
    return NextResponse.json(
      { error: 'Client not found' },
      { status: 404 }
    )
  }

  // Generate invitation token
  const token = generateInvitationToken()
  const tokenHash = await hashToken(token)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

  // Create invitation with clientId
  const invitation = await prisma.invitation.create({
    data: {
      email,
      token: tokenHash,
      role: 'USER',
      expiresAt,
      invitedBy: userId,
      clientId: clientId, // NEW: Store the clientId
    }
  })

  // Send invitation email (include token in email)
  await sendInvitationEmail(email, token, clientId)

  return NextResponse.json({
    data: {
      id: invitation.id,
      email: invitation.email,
      token: token, // Return plain token for frontend to construct link
      clientId: invitation.clientId,
    }
  })
}
```

### Step 4: Backend - Apply `clientId` When Accepting Invitation

Update the invitation acceptance endpoint at `/api/invitations/accept`:

```typescript
// POST /api/invitations/accept
export async function POST(request: Request) {
  const body = await request.json()
  const { token, email, password, name, platformTermsAccepted, websiteTermsAccepted, privacyAccepted } = body

  // Find invitation by token
  const tokenHash = await hashToken(token)
  const invitation = await prisma.invitation.findUnique({
    where: { token: tokenHash },
    include: { Client: true } // Include client relation
  })

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invalid or expired invitation token' },
      { status: 400 }
    )
  }

  if (invitation.used) {
    return NextResponse.json(
      { error: 'This invitation has already been used' },
      { status: 400 }
    )
  }

  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json(
      { error: 'Email does not match invitation' },
      { status: 400 }
    )
  }

  if (new Date() > invitation.expiresAt) {
    return NextResponse.json(
      { error: 'Invitation has expired' },
      { status: 400 }
    )
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user with clientId from invitation
  const user = await prisma.user.create({
    data: {
      email: invitation.email,
      password: hashedPassword,
      name: name || null,
      role: invitation.role || 'USER',
      clientId: invitation.clientId, // NEW: Set clientId from invitation
      emailVerified: new Date(),
      // Set consent timestamps if provided
      ...(platformTermsAccepted && { termsAcceptedAt: new Date() }),
      ...(privacyAccepted && { privacyAcceptedAt: new Date() }),
    }
  })

  // Mark invitation as used
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      used: true,
      usedAt: new Date(),
    }
  })

  // Log audit events
  await prisma.auditLog.createMany({
    data: [
      {
        userId: user.id,
        action: 'USER_REGISTERED',
        resource: 'USER',
        resourceId: user.id,
        description: `User registered via invitation`,
      },
      ...(platformTermsAccepted ? [{
        userId: user.id,
        action: 'TERMS_ACCEPTED',
        resource: 'USER',
        resourceId: user.id,
        description: 'Platform Terms of Use accepted',
      }] : []),
      ...(privacyAccepted ? [{
        userId: user.id,
        action: 'PRIVACY_POLICY_ACCEPTED',
        resource: 'USER',
        resourceId: user.id,
        description: 'Privacy Policy accepted',
      }] : []),
    ]
  })

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clientId: user.clientId, // Return clientId in response
    }
  })
}
```

### Step 5: Update Invitation Validation Endpoint (Optional)

If you want to return the `clientId` when validating an invitation (for display purposes):

```typescript
// GET /api/invitations/validate?token=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'Token is required' },
      { status: 400 }
    )
  }

  const tokenHash = await hashToken(token)
  const invitation = await prisma.invitation.findUnique({
    where: { token: tokenHash },
    include: { Client: true }
  })

  if (!invitation) {
    return NextResponse.json({
      valid: false,
      error: 'Invalid invitation token'
    })
  }

  if (invitation.used) {
    return NextResponse.json({
      valid: false,
      error: 'This invitation has already been used'
    })
  }

  if (new Date() > invitation.expiresAt) {
    return NextResponse.json({
      valid: false,
      error: 'Invitation has expired'
    })
  }

  return NextResponse.json({
    valid: true,
    email: invitation.email,
    clientId: invitation.clientId, // NEW: Return clientId
    clientName: invitation.Client?.name, // NEW: Return client name if available
  })
}
```

## Testing Checklist

1. ✅ Create invitation through `/api/admin/clients/[clientId]/invitations`
   - Verify invitation is created with `clientId` set
   - Check database to confirm `clientId` is stored

2. ✅ Validate invitation token
   - Verify `clientId` is returned in validation response

3. ✅ Accept invitation and register user
   - Verify user is created with `clientId` set
   - Check database to confirm user has correct `clientId`
   - Verify user appears in client's user list

4. ✅ Test edge cases
   - Invitation without `clientId` (should still work for backwards compatibility)
   - Expired invitation
   - Already used invitation
   - Invalid token

## Migration Notes

- The `clientId` field is nullable (`String?`) to maintain backwards compatibility with existing invitations
- Existing invitations without `clientId` will continue to work, but won't assign users to clients
- New invitations created through the client detail page will have `clientId` set
- Users created from invitations with `clientId` will be automatically assigned to that client

## Frontend Changes

No frontend changes are required! The frontend is already correctly:
- Passing `clientId` in the URL path when creating invitations
- Using the invitation token for registration
- The backend just needs to store and apply the `clientId` as described above

