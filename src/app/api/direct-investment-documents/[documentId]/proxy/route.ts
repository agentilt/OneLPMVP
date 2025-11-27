import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { promises as fs } from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(date))
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return String(value ?? '')
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

// Google Drive API support (optional - requires service account)
let googleapis: any = null
try {
  googleapis = require('googleapis')
} catch (e) {
  // googleapis not installed - will fall back to public download methods
}

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

    // Helper to generate a PDF buffer on the fly (fallback when local file missing)
    const generatePdfBuffer = async () => {
      const chunks: Buffer[] = []
      const doc = new PDFDocument({ size: 'A4', margin: 50 })

      doc.on('data', (chunk: Buffer | Uint8Array) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      )

      doc.fontSize(18).text(document.title, { align: 'left' })
      doc.moveDown()

      doc.fontSize(11)
      doc.text(`Direct Investment: ${document.directInvestment.name}`)
      doc.text(`Investment Type: ${document.directInvestment.investmentType}`)
      doc.text(`Document Type: ${document.type}`)
      doc.text(`Upload Date: ${formatDate(document.uploadDate)}`)
      if (document.dueDate) doc.text(`Due Date: ${formatDate(document.dueDate)}`)
      if (document.period) doc.text(`Period: ${document.period}`)
      if (document.periodDate) doc.text(`Period Date: ${formatDate(document.periodDate)}`)
      if (document.highlights) {
        doc.moveDown()
        doc.fontSize(12).text('Highlights', { underline: true })
        doc.fontSize(11).text(document.highlights)
      }
      if (document.lowlights) {
        doc.moveDown()
        doc.fontSize(12).text('Lowlights', { underline: true })
        doc.fontSize(11).text(document.lowlights)
      }
      if (document.milestones) {
        doc.moveDown()
        doc.fontSize(12).text('Milestones', { underline: true })
        doc.fontSize(11).text(document.milestones)
      }

      // Metrics snapshot
      const metricLines: string[] = []
      const metrics: Array<[string, number | null | undefined]> = [
        ['Revenue', document.revenue],
        ['ARR', document.arr],
        ['MRR', document.mrr],
        ['Gross Margin', document.grossMargin],
        ['Run Rate', document.runRate],
        ['Burn', document.burn],
        ['Runway (months)', document.runway],
        ['Headcount', document.headcount],
        ['CAC', document.cac],
        ['LTV', document.ltv],
        ['NRR', document.nrr],
        ['Cash Balance', document.cashBalance],
      ]

      for (const [label, value] of metrics) {
        if (value !== null && value !== undefined) {
          if (label === 'Gross Margin' || label === 'NRR') {
            metricLines.push(`${label}: ${(value * 100).toFixed(1)}%`)
          } else if (
            label === 'Revenue' ||
            label === 'ARR' ||
            label === 'MRR' ||
            label === 'Run Rate' ||
            label === 'Burn' ||
            label === 'CAC' ||
            label === 'LTV' ||
            label === 'Cash Balance'
          ) {
            metricLines.push(`${label}: ${formatCurrency(value)}`)
          } else {
            metricLines.push(`${label}: ${value}`)
          }
        }
      }

      if (metricLines.length > 0) {
        doc.moveDown()
        doc.fontSize(12).text('Metrics Snapshot', { underline: true })
        doc.fontSize(11)
        metricLines.forEach((line) => doc.text(line))
      }

      const parsed = document.parsedData as Record<string, unknown> | null
      if (parsed && typeof parsed === 'object') {
        const remainingEntries = Object.entries(parsed)
        if (remainingEntries.length > 0) {
          doc.moveDown()
          doc.fontSize(12).text('Additional Details', { underline: true })
          doc.fontSize(11)
          for (const [key, value] of remainingEntries) {
            doc.text(`${key}: ${String(value)}`)
          }
        }
      }

      doc.end()
      return Buffer.concat(chunks)
    }

    // Fetch PDF from source (Google Drive, local storage, etc.)
    const sourceUrl = document.url
    let pdfResponse: Response

    try {
      // Handle local files stored under /public (e.g., /uploads/documents/...)
      if (sourceUrl && (sourceUrl.startsWith('/uploads/') || !sourceUrl.startsWith('http'))) {
        const relativePath = sourceUrl.startsWith('/')
          ? sourceUrl.slice(1)
          : sourceUrl
        const filePath = path.join(process.cwd(), 'public', relativePath)

        try {
          const fileBuffer = await fs.readFile(filePath)

          return new NextResponse(fileBuffer as any, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${encodeURIComponent(document.title)}.pdf"`,
              'X-Content-Type-Options': 'nosniff',
              'Content-Security-Policy': "frame-ancestors 'self'; default-src 'none'",
              'Cache-Control': 'private, no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          })
        } catch (fsError) {
          console.error('Error reading local direct investment document file, generating on-the-fly:', fsError)
          const buffer = await generatePdfBuffer()
          return new NextResponse(buffer as any, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${encodeURIComponent(document.title)}.pdf"`,
              'X-Content-Type-Options': 'nosniff',
              'Content-Security-Policy': "frame-ancestors 'self'; default-src 'none'",
              'Cache-Control': 'private, no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          })
        }
      }

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
      
      // First, try Google Drive API if credentials are configured
      if (!isPdfContentType && fileId && googleapis && process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
        console.log(`[INFO] Attempting to fetch via Google Drive API using service account`)
        try {
          const { google } = googleapis
          const auth = new google.auth.JWT(
            process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL,
            null,
            process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            ['https://www.googleapis.com/auth/drive.readonly']
          )
          
          const drive = google.drive({ version: 'v3', auth })
          const fileResponse = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
          )
          
          // Verify it's a PDF
          const buffer = Buffer.from(fileResponse.data as ArrayBuffer)
          const pdfMagicBytes = buffer.slice(0, 4)
          const isPdf = pdfMagicBytes[0] === 0x25 && pdfMagicBytes[1] === 0x50 && pdfMagicBytes[2] === 0x44 && pdfMagicBytes[3] === 0x46
          
          if (isPdf) {
            console.log(`[INFO] Successfully fetched PDF via Google Drive API`)
            pdfResponse = new Response(buffer, {
              status: 200,
              headers: {
                'Content-Type': 'application/pdf',
              },
            })
          } else {
            console.warn(`[WARN] Google Drive API returned non-PDF content`)
          }
        } catch (apiError: any) {
          console.error(`[ERROR] Google Drive API fetch failed:`, apiError.message)
          // Fall through to try alternative methods
        }
      }
      
      // If still no PDF, try alternative download methods
      if (!isPdfContentType && (!pdfResponse || !pdfResponse.headers.get('content-type')?.includes('application/pdf'))) {
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
            } else {
              // Method 1 didn't work, try Method 2: Use the file/d format with export parameter
              const altUrl2 = `https://drive.google.com/file/d/${fileId}/export?format=pdf`
              console.log(`[INFO] Alternative URL 1 failed (got ${altContentType1}), trying alternative URL 2 (export format): ${altUrl2}`)
              
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
              } else if (altContentType2.includes('application/pdf') || altContentType2.includes('application/octet-stream')) {
                pdfResponse = altResponse2
                console.log(`[INFO] Using alternative URL 2 despite non-200 status`)
              } else {
                // Method 3: Try direct download link format
                const altUrl3 = `https://drive.google.com/uc?id=${fileId}&export=download`
                console.log(`[INFO] Alternative URL 2 failed (got ${altContentType2}), trying alternative URL 3: ${altUrl3}`)
                
                const altResponse3 = await fetch(altUrl3, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/pdf,application/octet-stream,*/*',
                  },
                  redirect: 'follow',
                })
                
                const altContentType3 = altResponse3.headers.get('content-type') || ''
                console.log(`[INFO] Alternative fetch 3 status: ${altResponse3.status}, content-type: ${altContentType3}`)
                
                if (altResponse3.ok && (altContentType3.includes('application/pdf') || altContentType3.includes('application/octet-stream'))) {
                  pdfResponse = altResponse3
                  console.log(`[INFO] Alternative URL 3 succeeded with correct content-type`)
                } else if (altContentType3.includes('application/pdf') || altContentType3.includes('application/octet-stream')) {
                  pdfResponse = altResponse3
                  console.log(`[INFO] Using alternative URL 3 despite non-200 status`)
                } else {
                  console.warn(`[WARN] All alternative methods failed. Original response was ${contentType}, methods returned: ${altContentType1}, ${altContentType2}, ${altContentType3}`)
                }
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

    // Check if the content is a PDF or an image (PNG/JPEG)
    const magicBytes = new Uint8Array(pdfBuffer).slice(0, 4)
    const magicBytesHex = Array.from(magicBytes).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
    
    const isPdf = magicBytes[0] === 0x25 && magicBytes[1] === 0x50 && magicBytes[2] === 0x44 && magicBytes[3] === 0x46 // "%PDF"
    const isPng = magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4e && magicBytes[3] === 0x47 // PNG
    const isJpeg = magicBytes[0] === 0xff && magicBytes[1] === 0xd8 && magicBytes[2] === 0xff // JPEG
    
    let contentType = 'application/pdf'
    let fileExtension = 'pdf'
    
    if (isPng) {
      contentType = 'image/png'
      fileExtension = 'png'
      console.log(`[INFO] Detected PNG image - serving as image preview`)
    } else if (isJpeg) {
      contentType = 'image/jpeg'
      fileExtension = 'jpg'
      console.log(`[INFO] Detected JPEG image - serving as image preview`)
    } else if (!isPdf) {
      // Not a PDF and not an image - error out
      console.error(`[ERROR] Downloaded content is not a PDF or image. Magic bytes: ${magicBytesHex}`)
      
      // Determine what type of file we actually got
      let detectedType = 'unknown'
      if (magicBytesHex.includes('0x3c 0x68 0x74 0x6d') || magicBytesHex.includes('0x3c 0x48 0x54 0x4d')) {
        detectedType = 'HTML'
      }
      
      console.error(`[ERROR] Detected file type: ${detectedType}`)
      
      let errorMessage = 'Failed to retrieve document from Google Drive.'
      let errorDetails = ''
      
      if (detectedType === 'HTML') {
        errorMessage = 'Google Drive returned an HTML page instead of the document.'
        errorDetails = 'This usually means Google Drive is showing a virus scan warning or access restriction page. The file may need to be shared differently or accessed via Google Drive API.'
      } else {
        errorDetails = 'The file returned was not a valid PDF or image. Please ensure the file is shared with "Anyone with the link" and is not restricted.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          detectedFileType: detectedType,
          suggestion: 'For secure file access, consider using the Google Drive API with a service account as described in SECURE_DOCUMENT_DISPLAY_GUIDE.md'
        },
        { status: 502 }
      )
    }

    // Return document (PDF or image) with appropriate headers
    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(document.title)}.${fileExtension}"`,
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
