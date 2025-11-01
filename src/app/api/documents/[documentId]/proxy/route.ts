import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * Secure document proxy endpoint
 * 
 * This endpoint:
 * 1. Verifies user authentication
 * 2. Checks user has access to the fund that owns the document
 * 3. Fetches the PDF from the source (Google Drive, S3, etc.) server-side
 * 4. Streams it to the client with proper security headers
 * 5. Logs access for audit purposes
 * 
 * URL: /api/documents/[documentId]/proxy
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params
    const session = await getServerSession(authOptions)

    // Verify authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch document with fund relationship
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        fund: {
          include: {
            fundAccess: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this fund
    const hasAccess =
      // User owns the fund
      document.fund.userId === session.user.id ||
      // User is ADMIN
      session.user.role === 'ADMIN' ||
      // User is DATA_MANAGER
      session.user.role === 'DATA_MANAGER' ||
      // User has explicit fund access
      document.fund.fundAccess.some(
        (access) => access.userId === session.user.id
      )

    if (!hasAccess) {
      // Log unauthorized access attempt
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'DOWNLOAD',
          resource: 'DOCUMENT',
          resourceId: documentId,
          description: `Unauthorized document access attempt: ${document.title}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })

      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Log authorized access
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DOWNLOAD',
        resource: 'DOCUMENT',
        resourceId: documentId,
        description: `Document accessed: ${document.title}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    // Fetch PDF from source (Google Drive, local storage, etc.)
    const sourceUrl = document.url
    let pdfResponse: Response

    try {
      // Handle Google Drive URLs - convert to direct download URL
      let fetchUrl = sourceUrl
      
      if (sourceUrl.includes('drive.google.com')) {
        // Extract file ID from various Google Drive URL formats:
        // - https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
        // - https://drive.google.com/file/d/{FILE_ID}/view?usp=drive_link
        // - https://drive.google.com/file/d/{FILE_ID}/view
        // - https://drive.google.com/open?id={FILE_ID}
        let fileId: string | null = null
        
        // Try standard format: /file/d/{FILE_ID}/
        const fileIdMatch = sourceUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
        if (fileIdMatch) {
          fileId = fileIdMatch[1]
        } else {
          // Try alternative format: ?id={FILE_ID}
          const idMatch = sourceUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)
          if (idMatch) {
            fileId = idMatch[1]
          }
        }
        
        if (fileId) {
          // Use export format for PDFs from Google Drive
          // This requires the file to be shared with "Anyone with the link" OR
          // Use Google Drive API with service account for private files
          fetchUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
          console.log(`[INFO] Converted Google Drive URL from ${sourceUrl} to ${fetchUrl}`)
        } else {
          console.warn(`[WARN] Could not extract file ID from Google Drive URL: ${sourceUrl}`)
        }
      }

      // Fetch the PDF from the source
      pdfResponse = await fetch(fetchUrl, {
        headers: {
          // Add any required headers for authentication if needed
          // For Google Drive API, you'd add: Authorization: `Bearer ${accessToken}`
        },
      })

      if (!pdfResponse.ok) {
        console.error(`Failed to fetch PDF from source: ${pdfResponse.status} ${pdfResponse.statusText}`)
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

    // Return PDF with security headers
    // Note: CSP 'default-src none' can block iframe embedding, so we use a more permissive policy
    return new NextResponse(pdfBuffer, {
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
  } catch (error) {
    console.error('Document proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

