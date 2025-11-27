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

    // Fetch user to get clientId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clientId: true },
    })

    // Verify user has access to this fund
    const hasAccess =
      // User owns the fund
      document.fund.userId === session.user.id ||
      // User is ADMIN
      session.user.role === 'ADMIN' ||
      // User is DATA_MANAGER
      session.user.role === 'DATA_MANAGER' ||
      // User's client owns the fund
      (user?.clientId && document.fund.clientId === user.clientId) ||
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
      doc.text(`Fund: ${document.fund.name}`)
      doc.text(`Type: ${document.type}`)
      doc.text(`Upload Date: ${formatDate(document.uploadDate)}`)
      if (document.dueDate) doc.text(`Due Date: ${formatDate(document.dueDate)}`)
      if (document.callAmount !== null && document.callAmount !== undefined) {
        doc.text(`Capital Call Amount: ${formatCurrency(document.callAmount)}`)
      }
      if (document.paymentStatus) doc.text(`Payment Status: ${document.paymentStatus}`)
      if (document.investmentValue !== null && document.investmentValue !== undefined) {
        doc.text(`Investment Value: ${formatCurrency(document.investmentValue)}`)
      }

      const parsed = document.parsedData as Record<string, unknown> | null
      const handledKeys = new Set<string>()

      if (parsed && typeof parsed === 'object') {
        const distributionDate = parsed['distributionDate']
          ? new Date(parsed['distributionDate'] as string | number | Date)
          : null
        const distributionAmount = parsed['amount'] as number | undefined
        const distributionType = parsed['distributionType'] as string | undefined
        const taxYear = parsed['taxYear'] as number | undefined
        const k1Status = parsed['k1Status'] as string | undefined
        const description = parsed['description'] as string | undefined

        if (distributionDate || distributionAmount || distributionType || taxYear || k1Status || description) {
          doc.moveDown()
          doc.fontSize(12).text('Distribution Details', { underline: true })
          doc.fontSize(11)
          if (distributionDate) {
            doc.text(`- Distribution Date: ${formatDate(distributionDate)}`)
            handledKeys.add('distributionDate')
          }
          if (distributionAmount !== undefined) {
            doc.text(`- Amount: ${formatCurrency(distributionAmount)}`)
            handledKeys.add('amount')
          }
          if (distributionType) {
            doc.text(`- Type: ${distributionType}`)
            handledKeys.add('distributionType')
          }
          if (taxYear !== undefined) {
            doc.text(`- Tax Year: ${taxYear}`)
            handledKeys.add('taxYear')
          }
          if (k1Status) {
            doc.text(`- K-1 Status: ${k1Status}`)
            handledKeys.add('k1Status')
          }
          if (description) {
            doc.text(`- Description: ${description}`)
            handledKeys.add('description')
          }
        }

        const remainingEntries = Object.entries(parsed).filter(([key]) => !handledKeys.has(key))
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
    let pdfResponse: Response | null = null

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
          console.error('Error reading local document file, generating on-the-fly:', fsError)
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
        // Extract file ID from various Google Drive URL formats
        const fileIdMatch = sourceUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
        if (fileIdMatch) {
          fileId = fileIdMatch[1]
        } else {
          const idMatch = sourceUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)
          if (idMatch) {
            fileId = idMatch[1]
          }
        }
        
        if (fileId) {
          fetchUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
          console.log(`[INFO] Converted Google Drive URL from ${sourceUrl} to ${fetchUrl}`)
        }
      }

      // Try Google Drive API first if credentials are configured
      if (fileId && googleapis && process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
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
          
          const buffer = Buffer.from(fileResponse.data as ArrayBuffer)
          const pdfMagicBytes = buffer.slice(0, 4)
          const isPdf = pdfMagicBytes[0] === 0x25 && pdfMagicBytes[1] === 0x50 && pdfMagicBytes[2] === 0x44 && pdfMagicBytes[3] === 0x46
          
          if (isPdf) {
            console.log(`[INFO] Successfully fetched PDF via Google Drive API`)
            pdfResponse = new Response(buffer, {
              status: 200,
              headers: { 'Content-Type': 'application/pdf' },
            })
          }
        } catch (apiError: any) {
          console.error(`[ERROR] Google Drive API fetch failed:`, apiError.message)
        }
      }

      // Fallback to public download if API not used or failed
      if (!pdfResponse) {
        pdfResponse = await fetch(fetchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; OneLP-Document-Proxy/1.0)',
          },
          redirect: 'follow',
        })

        if (!pdfResponse.ok) {
          console.error(`Failed to fetch PDF from source: ${pdfResponse.status} ${pdfResponse.statusText}`)
          return NextResponse.json(
            { error: 'Failed to retrieve document' },
            { status: 502 }
          )
        }
      }

      // Ensure pdfResponse is assigned
      if (!pdfResponse) {
        console.error('Failed to fetch document: pdfResponse is null')
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

    // Get document content (pdfResponse is guaranteed to be non-null here)
    const pdfBuffer = await pdfResponse!.arrayBuffer()
    const finalContentType = pdfResponse.headers.get('content-type') || ''

    // Check if the content is a PDF or an image (PNG/JPEG)
    const magicBytes = new Uint8Array(pdfBuffer).slice(0, 4)
    
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
    }

    // Return document (PDF or image) with appropriate headers
    return new NextResponse(pdfBuffer, {
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
  } catch (error) {
    console.error('Document proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
