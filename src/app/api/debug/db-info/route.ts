import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Diagnostic endpoint to check database connection
// Returns connection info without exposing credentials
export async function GET(request: NextRequest) {
  try {
    // Parse DATABASE_URL to get connection details (without password)
    const dbUrl = process.env.DATABASE_URL || ''
    const urlObj = new URL(dbUrl)
    
    // Get database name from connection
    const dbName = urlObj.pathname.replace('/', '')
    
    // Query the database to get current database name and schema
    const dbInfo = await prisma.$queryRaw<Array<{ current_database: string, current_schema: string }>>`
      SELECT current_database(), current_schema()
    `
    
    // Check if Client table exists
    const clientTableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Client'
      ) as exists
    `
    
    // Get table count for Client
    let clientCount = 0
    try {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM "Client"
      `
      clientCount = Number(result[0]?.count || 0)
    } catch (e) {
      // Table doesn't exist or error
    }
    
    return NextResponse.json({
      connection: {
        host: urlObj.hostname,
        port: urlObj.port,
        database: dbName,
        schema: dbInfo[0]?.current_schema || 'unknown',
        // Don't expose username or password
      },
      currentDatabase: dbInfo[0]?.current_database || 'unknown',
      clientTable: {
        exists: clientTableExists[0]?.exists || false,
        recordCount: clientCount,
      },
      timestamp: new Date().toISOString(),
    }, {
      // Cache control - no caching for diagnostic endpoints
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to query database',
      message: error.message,
      connectionString: process.env.DATABASE_URL 
        ? `${new URL(process.env.DATABASE_URL).protocol}//${new URL(process.env.DATABASE_URL).hostname}:${new URL(process.env.DATABASE_URL).port}/${new URL(process.env.DATABASE_URL).pathname.split('/').pop()}`
        : 'Not set',
    }, { status: 500 })
  }
}

