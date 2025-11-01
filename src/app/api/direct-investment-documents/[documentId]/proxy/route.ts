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
      let fileId: string | null = null
      
      if (sourceUrl.includes('drive.google.com')) {
        // Extract file ID from various Google Drive URL formats:
        // - https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
        // - https://drive.google.com/file/d/{FILE_ID}/view?usp=drive_link
        // - https://drive.google.com/file/d/{FILE_ID}/view
        // - https://drive.google.com/open?id={FILE_ID}
        
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

      console.log(`[INFO] Fetching PDF from: ${fetchUrl}`)
      // Fetch the PDF from the source
      // Note: We follow redirects and handle Google Drive's virus scan warnings
      pdfResponse = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OneLP-Document-Proxy/1.0)',
        },
        redirect: 'follow',
      })

      console.log(`[INFO] PDF fetch response status: ${pdfResponse.status} ${pdfResponse.statusText}`)
      const contentType = pdfResponse.headers.get('content-type') || ''
      console.log(`[INFO] PDF fetch content-type: ${contentType}`)

      // Check if we got a PDF or if Google Drive returned something else
      if (!pdfResponse.ok) {
        console.error(`[ERROR] Failed to fetch PDF from source: ${pdfResponse.status} ${pdfResponse.statusText}`)
        const errorText = await pdfResponse.text().catch(() => 'Unable to read error response')
        console.error(`[ERROR] Error response body: ${errorText.substring(0, 500)}`)
        return NextResponse.json(
          { error: 'Failed to retrieve document' },
          { status: 502 }
        )
      }

      // Google Drive sometimes returns HTML/virus scan pages or image previews instead of the actual PDF
      // If we get a non-PDF content type (including images like PNG previews), try alternative export methods
      const isPdfContentType = contentType.includes('application/pdf') || contentType.includes('application/octet-stream')
      const isImagePreview = contentType.includes('image/')
      
      if (!isPdfContentType) {
        console.warn(`[WARN] Received ${contentType} instead of PDF${isImagePreview ? ' (image preview detected)' : ''}. Trying alternative Google Drive export methods.`)
        
        if (!fileId) {
          console.error(`[ERROR] Cannot try alternative methods without file ID`)
        } else {
          // Method 1: Try with confirm=t parameter to bypass virus scan warning and force download
          // This is important for files that trigger Google Drive's virus scan
          const altUrl1 = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t&uuid=`
          console.log(`[INFO] Trying alternative URL 1 (with confirm): ${altUrl1}`)
          
          try {
            const altResponse1 = await fetch(altUrl1, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/pdf,application/octet-stream,*/*',
              },
              redirect: 'follow',
            })
            
            const altContentType1 = altResponse1.headers.get('content-type') || ''
            console.log(`[INFO] Alternative fetch 1 status: ${altResponse1.status}, content-type: ${altContentType1}`)
            
            if (altResponse1.ok && (altContentType1.includes('application/pdf') || altContentType1.includes('application/octet-stream'))) {
              pdfResponse = altResponse1
              console.log(`[INFO] Alternative URL 1 succeeded with correct content-type`)
            } else if (altContentType1.includes('application/pdf') || altContentType1.includes('application/octet-stream')) {
              pdfResponse = altResponse1
              console.log(`[INFO] Using alternative URL 1 despite non-200 status`)
            } else if (!altContentType1.includes('image/')) {
              // Method 2: Try the file/d format with export parameter
              const altUrl2 = `https://drive.google.com/file/d/${fileId}/export?format=pdf`
              console.log(`[INFO] Trying alternative URL 2 (export format): ${altUrl2}`)
              
              const altResponse2 = await fetch(altUrl2, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                  'Accept': 'application/pdf,*/*',
                },
                redirect: 'follow',
              })
              
              const altContentType2 = altResponse2.headers.get('content-type') || ''
              console.log(`[INFO] Alternative fetch 2 status: ${altResponse2.status}, content-type: ${altContentType2}`)
              
              if (altResponse2.ok && (altContentType2.includes('application/pdf') || altContentType2.includes('application/octet-stream'))) {
                pdfResponse = altResponse2
                console.log(`[INFO] Alternative URL 2 succeeded with correct content-type`)
              }
            }
          } catch (altError) {
            console.error(`[ERROR] Alternative fetch methods failed:`, altError)
          }
        }
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
    const finalContentType = pdfResponse.headers.get('content-type') || ''
    console.log(`[INFO] PDF fetched successfully, size: ${pdfBuffer.byteLength} bytes`)
    console.log(`[INFO] Final content-type: ${finalContentType}`)

    // Check if the content actually looks like a PDF (starts with PDF magic bytes)
    const pdfMagicBytes = new Uint8Array(pdfBuffer).slice(0, 4)
    const isPdf = pdfMagicBytes[0] === 0x25 && pdfMagicBytes[1] === 0x50 && pdfMagicBytes[2] === 0x44 && pdfMagicBytes[3] === 0x46 // "%PDF"
    
    if (!isPdf) {
      console.error(`[ERROR] Downloaded content does not appear to be a PDF. Magic bytes: ${Array.from(pdfMagicBytes).map(b => '0x' + b.toString(16)).join(' ')}`)
      // Try to read first 500 chars to see if it's HTML
      const textDecoder = new TextDecoder()
      const firstBytes = pdfBuffer.byteLength > 500 ? pdfBuffer.slice(0, 500) : pdfBuffer
      const preview = textDecoder.decode(firstBytes)
      console.error(`[ERROR] Content preview: ${preview.substring(0, 200)}`)
      
      return NextResponse.json(
        { 
          error: 'Failed to retrieve PDF. Google Drive may be blocking the download or the file may not be accessible.',
          details: 'The file returned was not a valid PDF. Please ensure the file is shared with "Anyone with the link" and is not restricted.'
        },
        { status: 502 }
      )
    }

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

