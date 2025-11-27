import { Worker, Job } from 'bullmq'
import { getRedisClient } from '@/lib/redis'
import { exportQueue } from '@/lib/exportQueue'
import * as XLSX from 'xlsx'
import PDFDocument from 'pdfkit'
import { format as formatDate } from 'date-fns'

type ExportPayload = {
  summary?: Record<string, any>
  data?: any[]
  name?: string
  reportingCurrency?: string
  filters?: Record<string, any>
}

const connection = getRedisClient()

function sanitizeFileName(name: string) {
  return (name || 'export')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'export'
}

function buildXlsxBuffer(payload: ExportPayload) {
  const wb = XLSX.utils.book_new()

  const summaryRows = Object.entries(payload.summary || {}).map(([k, v]) => ({ Metric: k, Value: v }))
  if (summaryRows.length > 0) {
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')
  }

  const dataRows = Array.isArray(payload.data) ? payload.data : []
  if (dataRows.length > 0) {
    const wsData = XLSX.utils.json_to_sheet(dataRows)
    XLSX.utils.book_append_sheet(wb, wsData, 'Data')
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  return buffer
}

function buildPdfBuffer(payload: ExportPayload) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: true, margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const title = payload.name || 'Report Export'
    const asOf = formatDate(new Date(), 'yyyy-MM-dd HH:mm')

    // Watermark
    doc.save()
    doc.fontSize(50)
      .fillColor('lightgrey')
      .rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] })
      .opacity(0.15)
      .text('CONFIDENTIAL', doc.page.width / 4, doc.page.height / 4)
    doc.restore()

    doc.fontSize(18).fillColor('#000').text(title)
    doc.moveDown(0.3)
    doc.fontSize(10).fillColor('#444').text(`Generated: ${asOf}`)
    doc.moveDown(0.5)

    if (payload.summary) {
      doc.fontSize(12).fillColor('#111').text('Summary', { underline: true })
      doc.moveDown(0.3)
      Object.entries(payload.summary).forEach(([k, v]) => {
        doc.fontSize(10).fillColor('#222').text(`${k}: ${v}`)
      })
      doc.moveDown(0.5)
    }

    const rows = Array.isArray(payload.data) ? payload.data.slice(0, 50) : []
    if (rows.length > 0) {
      doc.fontSize(12).fillColor('#111').text('Data (first 50 rows)', { underline: true })
      doc.moveDown(0.3)
      const headers = Object.keys(rows[0])
      doc.fontSize(9).fillColor('#222').text(headers.join(' | '))
      rows.forEach((row) => {
        const line = headers.map((h) => String(row[h] ?? '')).join(' | ')
        doc.text(line)
      })
    } else {
      doc.fontSize(10).fillColor('#444').text('No data available.')
    }

    doc.end()
  })
}

async function generateReportExport(data: { type: string; format: string; payload: ExportPayload; userId: string }) {
  const baseName = sanitizeFileName(data.payload?.name || `${data.type}-export`)

  if (data.format === 'xlsx') {
    const buffer = buildXlsxBuffer(data.payload)
    const url = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${buffer.toString('base64')}`
    return { url, format: 'xlsx', filename: `${baseName}.xlsx` }
  }

  if (data.format === 'pdf') {
    const buffer = await buildPdfBuffer(data.payload)
    const url = `data:application/pdf;base64,${buffer.toString('base64')}`
    return { url, format: 'pdf', filename: `${baseName}.pdf` }
  }

  // Fallback to CSV in-memory for unknown formats
  const rows = Array.isArray(data.payload?.data) ? data.payload.data : []
  const csv =
    rows.length > 0
      ? [
          Object.keys(rows[0]).join(','),
          ...rows.map((r) =>
            Object.keys(rows[0])
              .map((k) => {
                const val = r[k]
                if (val == null) return ''
                const str = String(val)
                return str.includes(',') ? `"${str}"` : str
              })
              .join(',')
          ),
        ].join('\n')
      : ''
  const url = `data:text/csv;base64,${Buffer.from(csv).toString('base64')}`
  return { url, format: 'csv', filename: `${baseName}.csv` }
}

new Worker(
  exportQueue.name,
  async (job: Job) => {
    const { type, format, payload, userId } = job.data || {}
    job.updateProgress(10)
    const result = await generateReportExport({ type, format, payload, userId })
    job.updateProgress(100)
    return result
  },
  { connection }
)

console.log('Export worker started and listening for export-jobs')
