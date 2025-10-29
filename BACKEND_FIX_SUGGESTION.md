# Backend Error Fix Suggestion

## Issue
The POST `/api/admin/clients/[clientId]/funds` endpoint is returning a generic 500 error without logging the actual error details.

## Fix

Update your backend route file to log more details:

```typescript
// In OneLPMVP/src/app/api/admin/clients/[clientId]/funds/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params
    const body = await request.json()
    
    console.log('[POST /funds] Request body:', JSON.stringify(body, null, 2))
    console.log('[POST /funds] ClientId:', clientId)
    
    const {
      name,
      domicile,
      vintage,
      manager,
      managerEmail,
      managerPhone,
      managerWebsite,
      commitment = 0,
      paidIn = 0,
      nav = 0,
      irr = 0,
      tvpi = 0,
      dpi = 0,
      lastReportDate,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Prepare date - handle both string and Date objects
    let reportDate: Date
    if (lastReportDate) {
      reportDate = new Date(lastReportDate)
      if (isNaN(reportDate.getTime())) {
        reportDate = new Date()
      }
    } else {
      reportDate = new Date()
    }

    console.log('[POST /funds] Creating fund with data:', {
      clientId,
      name,
      domicile,
      vintage: vintage ? parseInt(String(vintage)) : new Date().getFullYear(),
      commitment: parseFloat(String(commitment)),
    })

    const fund = await prisma.fund.create({
      data: {
        clientId,
        name,
        domicile: domicile || '',
        vintage: vintage ? parseInt(String(vintage)) : new Date().getFullYear(),
        manager: manager || '',
        managerEmail: managerEmail || null,
        managerPhone: managerPhone || null,
        managerWebsite: managerWebsite || null,
        commitment: parseFloat(String(commitment)) || 0,
        paidIn: parseFloat(String(paidIn)) || 0,
        nav: parseFloat(String(nav)) || 0,
        irr: parseFloat(String(irr)) || 0,
        tvpi: parseFloat(String(tvpi)) || 0,
        dpi: parseFloat(String(dpi)) || 0,
        lastReportDate: reportDate,
      },
    })

    console.log('[POST /funds] Fund created successfully:', fund.id)
    return NextResponse.json({ data: fund }, { status: 201 })
  } catch (error: any) {
    // Enhanced error logging
    console.error('[error] POST /api/admin/clients/[clientId]/funds error:', error)
    console.error('[error] Error name:', error?.name)
    console.error('[error] Error message:', error?.message)
    console.error('[error] Error stack:', error?.stack)
    console.error('[error] Error code:', error?.code)
    console.error('[error] Error meta:', error?.meta)
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error?.message || 'An error occurred'
      : 'An error occurred'
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        name: error?.name,
        code: error?.code,
      } : undefined
    }, { status: 500 })
  }
}
```

## Common Issues to Check

1. **Prisma Schema**: Make sure your `Fund` model has `clientId` field:
   ```prisma
   model Fund {
     id             String   @id @default(cuid())
     clientId       String
     // ... other fields
     client         Client   @relation(fields: [clientId], references: [id])
   }
   ```

2. **Database Migration**: Run Prisma migrations to ensure schema is up to date:
   ```bash
   npx prisma migrate deploy
   # or in development
   npx prisma db push
   ```

3. **Type Conversions**: The issue might be with parsing numbers/dates. Make sure all numeric fields are properly converted.

## Quick Test

Test the endpoint directly from your backend to see the actual error:

```bash
# From your local machine or backend server
curl -X POST http://localhost:3000/api/admin/clients/YOUR_CLIENT_ID/funds \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "name": "Test Fund",
    "domicile": "Cayman Islands",
    "vintage": 2024,
    "manager": "Test Manager",
    "commitment": 1000000
  }'
```

This will show you the actual error message in the response.

