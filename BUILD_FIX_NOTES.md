# Build Fix - Next.js 15 Async Params

## Issue
Build was failing with error:
```
Type error: Route "src/app/api/admin/clients/[clientId]/funds/[fundId]/route.ts" has an invalid "GET" export:
  Type "{ params: { clientId: string; fundId: string; }; }" is not a valid type for the function's second argument.
```

## Cause
In Next.js 15, the `params` object in route handlers is now async and must be awaited.

## Solution
Changed all route handlers to use `Promise<{...}>` for params:

**Before:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const client = await prisma.client.findUnique({
    where: { id: params.clientId }
  })
}
```

**After:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  })
}
```

## Files Fixed
1. ✅ `src/app/api/admin/clients/[clientId]/route.ts`
2. ✅ `src/app/api/admin/clients/[clientId]/funds/route.ts`
3. ✅ `src/app/api/admin/clients/[clientId]/funds/[fundId]/route.ts`

## Status
✅ All linter errors resolved
✅ Build should now pass

