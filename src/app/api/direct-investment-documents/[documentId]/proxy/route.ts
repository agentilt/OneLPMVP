import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * Secure document proxy endpoint for Direct Investment Documents
 * 
 * This endpoint:
 * 1. Verifies user authentication
 * 2. Checks user has access to the direct investment that owns the document
 * 3. Fetches the PDF from the source (Google Drive, S3, etc.) server-side
 * 4. Streams it to the client with proper security headers
 * 5. Logs access for audit purposes
 * 
 * URL: /api/direct-investment-documents/[documentId]/proxy
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params
    console.log(`[INFO] Direct investment document proxy requested: ${documentId}`)
    const session = await getServerSession(authOptions)

    // Verify authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch document with direct investment relationship
    const document = await prisma.directInvestmentDocument.findUnique({
      where: { id: documentId },
      include: {
        directInvestment: true,
      },
    })

    if (!document) {
      console.log(`[ERROR] Document not found: ${documentId}`)
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    console.log(`[INFO] Document found: ${document.title}, URL: ${document.url}`)

    // Fetch user to get clientId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clientId: true },
    })

    // Verify user has access to this direct investment
    const hasAccess =
      // User owns the direct investment
      document.directInvestment.userId === session.user.id ||
      // User is ADMIN
      session.user.role === 'ADMIN' ||
      // User is DATA_MANAGER
      session.user.role === 'DATA_MANAGER' ||
      // User's client owns the direct investment
      (user?.clientId && document.directInvestment.clientId === user.clientId)

    if (!hasAccess) {
      console.log(`[WARN] Access denied for user ${session.user.id} to document ${documentId}`)
      // Log unauthorized access attempt
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'DOWNLOAD',
          resource: 'DIRECT_INVESTMENT_DOCUMENT',
          resourceId: documentId,
          description: `Unauthorized access attempt to direct investment document: ${document.title}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })

      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    console.log(`[INFO] Access granted for user ${session.user.id} to document ${documentId}`)

    // Log authorized access
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DOWNLOAD',
        resource: 'DIRECT_INVESTMENT_DOCUMENT',
        resourceId: documentId,
        description: `Accessed direct investment document: ${document.title}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    // Fetch PDF from source (Google Drive, local storage, etc.)
    const sourceUrl = document.url
    let pdfResponse: Response

    try {
      // Handle Google Drive URLs - convert to direct download URL
      let fetchUrl = sourceUrl
      
      if (sourceUrl.includes('drive.google.com')) {
        // Extract file ID from Google Drive URL
        const fileIdMatch = sourceUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
        if (fileIdMatch) {
          const fileId = fileIdMatch[1]
          // Use export format for PDFs from Google Drive
          // This requires the file to be shared with "Anyone with the link" OR
          // Use Google Drive API with service account for private files
          fetchUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
        }
      }

      console.log(`[INFO] Fetching PDF from: ${fetchUrl}`)
      // Fetch the PDF from the source
      pdfResponse = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'OneLP-Document-Proxy/1.0',
        },
      })

      console.log(`[INFO] PDF fetch response status: ${pdfResponse.status} ${pdfResponse.statusText}`)
      console.log(`[INFO] PDF fetch content-type: ${pdfResponse.headers.get('content-type')}`)

      if (!pdfResponse.ok) {
        console.error(`[ERROR] Failed to fetch PDF from source: ${pdfResponse.status} ${pdfResponse.statusText}`)
        const errorText = await pdfResponse.text().catch(() => 'Unable to read error response')
        console.error(`[ERROR] Error response body: ${errorText.substring(0, 500)}`)
        return NextResponse.json(
          { error: 'Failed to retrieve document' },
          { status: 502 }
        )
      }
    } catch (error) {
      console.error('Error fetching PDF from source:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve document' },
        { status: 502 }
      )
    }

    // Get PDF content
    const pdfBuffer = await pdfResponse.arrayBuffer()
    console.log(`[INFO] PDF fetched successfully, size: ${pdfBuffer.byteLength} bytes`)

    // Return PDF with security headers
    // Note: CSP 'default-src none' can block iframe embedding, so we use a more permissive policy
    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(document.title)}.pdf"`,
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        // Allow embedding in iframe from same origin, but restrict other resources
        'Content-Security-Policy': "frame-ancestors 'self'; default-src 'none'",
        // Prevent caching of sensitive documents
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
    
    console.log(`[INFO] Returning PDF response with headers`)
    return response
  } catch (error) {
    console.error('[ERROR] Direct investment document proxy error:', error)
    if (error instanceof Error) {
      console.error('[ERROR] Error message:', error.message)
      console.error('[ERROR] Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

