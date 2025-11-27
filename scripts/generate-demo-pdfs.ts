import { PrismaClient, Document as FundDocument, DirectInvestmentDocument as DIDocument } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'

const prisma = new PrismaClient()

const DEMO_CLIENT_ID = 'demo-client-rich'
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents')

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date)
}

function formatCurrency(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return value.toString()
  }
}

function createPdf(
  title: string,
  lines: string[],
  filePath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = fs.createWriteStream(filePath)

    doc.pipe(stream)

    doc.fontSize(20).text(title, { align: 'left' })
    doc.moveDown()

    doc.fontSize(11)
    lines.forEach((line) => {
      if (!line.trim()) {
        doc.moveDown()
      } else {
        doc.text(line)
      }
    })

    doc.end()

    stream.on('finish', () => resolve())
    stream.on('error', (err) => reject(err))
  })
}

async function generateFundDocumentPdfs() {
  console.log('📄 Generating PDFs for fund documents...')

  const documents = await prisma.document.findMany({
    where: {
      fund: {
        clientId: DEMO_CLIENT_ID,
      },
    },
    include: {
      fund: true,
    },
  })

  for (const doc of documents) {
    const fileName = `demo-fund-doc-${doc.id}.pdf`
    const filePath = path.join(OUTPUT_DIR, fileName)
    const publicUrl = `/uploads/documents/${fileName}`

    const lines: string[] = []

    lines.push(`Fund: ${doc.fund.name}`)
    lines.push(`Document Type: ${doc.type}`)
    lines.push(`Upload Date: ${formatDate(doc.uploadDate)}`)
    if (doc.dueDate) {
      lines.push(`Due Date: ${formatDate(doc.dueDate)}`)
    }
    if (doc.callAmount !== null && doc.callAmount !== undefined) {
      const formattedCall = formatCurrency(doc.callAmount)
      lines.push(`Capital Call Amount: ${formattedCall ?? doc.callAmount.toString()}`)
    }
    if (doc.paymentStatus) {
      lines.push(`Payment Status: ${doc.paymentStatus}`)
    }
    if (doc.investmentValue !== null && doc.investmentValue !== undefined) {
      const formattedValue = formatCurrency(doc.investmentValue)
      lines.push(`Investment Value: ${formattedValue ?? doc.investmentValue.toString()}`)
    }

    // Parsed data handling (including distribution-specific metrics)
    const parsed = doc.parsedData as Record<string, unknown> | null
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
        lines.push('')
        lines.push('Distribution Details:')
        if (distributionDate) {
          lines.push(`- Distribution Date: ${formatDate(distributionDate)}`)
          handledKeys.add('distributionDate')
        }
        if (distributionAmount !== undefined) {
          lines.push(`- Amount: ${formatCurrency(distributionAmount) ?? distributionAmount.toString()}`)
          handledKeys.add('amount')
        }
        if (distributionType) {
          lines.push(`- Type: ${distributionType}`)
          handledKeys.add('distributionType')
        }
        if (taxYear !== undefined) {
          lines.push(`- Tax Year: ${taxYear}`)
          handledKeys.add('taxYear')
        }
        if (k1Status) {
          lines.push(`- K-1 Status: ${k1Status}`)
          handledKeys.add('k1Status')
        }
        if (description) {
          lines.push(`- Description: ${description}`)
          handledKeys.add('description')
        }
      }

      // Include any remaining parsedData fields that weren't handled above
      const remainingEntries = Object.entries(parsed).filter(([key]) => !handledKeys.has(key))
      if (remainingEntries.length > 0) {
        lines.push('')
        lines.push('Parsed Data:')
        for (const [key, value] of remainingEntries) {
          lines.push(`${key}: ${String(value)}`)
        }
      }
    }

    await createPdf(doc.title, lines, filePath)

    await prisma.document.update({
      where: { id: doc.id },
      data: { url: publicUrl },
    })
  }

  console.log(`✅ Generated ${documents.length} PDFs for fund documents`)
}

async function generateDirectInvestmentDocumentPdfs() {
  console.log('📄 Generating PDFs for direct investment documents...')

  const documents = await prisma.directInvestmentDocument.findMany({
    where: {
      directInvestment: {
        clientId: DEMO_CLIENT_ID,
      },
    },
    include: {
      directInvestment: true,
    },
  })

  for (const doc of documents) {
    const fileName = `demo-di-doc-${doc.id}.pdf`
    const filePath = path.join(OUTPUT_DIR, fileName)
    const publicUrl = `/uploads/documents/${fileName}`

    const lines: string[] = []

    lines.push(`Direct Investment: ${doc.directInvestment.name}`)
    lines.push(`Investment Type: ${doc.directInvestment.investmentType}`)
    lines.push(`Document Type: ${doc.type}`)
    lines.push(`Upload Date: ${formatDate(doc.uploadDate)}`)
    if (doc.dueDate) {
      lines.push(`Due Date: ${formatDate(doc.dueDate)}`)
    }

    // Executive summary fields (if present)
    if (doc.period) {
      lines.push(`Period: ${doc.period}`)
    }
    if (doc.periodDate) {
      lines.push(`Period Date: ${formatDate(doc.periodDate)}`)
    }
    if (doc.highlights) {
      lines.push('')
      lines.push('Highlights:')
      lines.push(doc.highlights)
    }
    if (doc.lowlights) {
      lines.push('')
      lines.push('Lowlights:')
      lines.push(doc.lowlights)
    }
    if (doc.milestones) {
      lines.push('')
      lines.push('Milestones:')
      lines.push(doc.milestones)
    }

    // Metrics snapshot
    const metricLines: string[] = []
    const metrics: Array<[string, number | null | undefined]> = [
      ['Revenue', doc.revenue],
      ['ARR', doc.arr],
      ['MRR', doc.mrr],
      ['Gross Margin', doc.grossMargin],
      ['Run Rate', doc.runRate],
      ['Burn', doc.burn],
      ['Runway (months)', doc.runway],
      ['Headcount', doc.headcount],
      ['CAC', doc.cac],
      ['LTV', doc.ltv],
      ['NRR', doc.nrr],
      ['Cash Balance', doc.cashBalance],
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
          const formatted = formatCurrency(value)
          metricLines.push(`${label}: ${formatted ?? value.toString()}`)
        } else {
          metricLines.push(`${label}: ${value}`)
        }
      }
    }

    if (metricLines.length > 0) {
      lines.push('')
      lines.push('Metrics Snapshot:')
      lines.push(...metricLines)
    }

    // Include parsedData if present and non-empty
    if (doc.parsedData && typeof doc.parsedData === 'object') {
      const entries = Object.entries(doc.parsedData as Record<string, unknown>)
      if (entries.length > 0) {
        lines.push('')
        lines.push('Parsed Data:')
        for (const [key, value] of entries) {
          lines.push(`${key}: ${String(value)}`)
        }
      }
    }

    await createPdf(doc.title, lines, filePath)

    await prisma.directInvestmentDocument.update({
      where: { id: doc.id },
      data: { url: publicUrl },
    })
  }

  console.log(`✅ Generated ${documents.length} PDFs for direct investment documents`)
}

async function main() {
  try {
    console.log('🚀 Generating demo PDFs for rich demo client documents...')
    ensureOutputDir()

    await generateFundDocumentPdfs()
    await generateDirectInvestmentDocumentPdfs()

    console.log('✅ Demo PDF generation complete')
    console.log(`📂 Files written to: ${OUTPUT_DIR}`)
  } catch (error) {
    console.error('❌ Error generating demo PDFs:', error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
