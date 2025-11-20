import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { format, config, data } = await request.json()

    if (!data || !data.data) {
      return NextResponse.json({ error: 'No data to export' }, { status: 400 })
    }

    if (format === 'excel' || format === 'csv') {
      // Generate CSV format
      const rows = data.data
      if (rows.length === 0) {
        return NextResponse.json({ error: 'No data to export' }, { status: 400 })
      }

      // Get headers from first row
      const headers = Object.keys(rows[0])
      
      // Create CSV content
      let csv = headers.join(',') + '\n'
      rows.forEach((row: any) => {
        const values = headers.map((header) => {
          let value = row[header]
          // Handle values that might contain commas
          if (typeof value === 'string' && value.includes(',')) {
            value = `"${value}"`
          }
          return value ?? ''
        })
        csv += values.join(',') + '\n'
      })

      const safeName = (config?.name || 'report').replace(/[^a-z0-9-_]/gi, '_') || 'report'
      const filename = `${safeName}-${format}.csv`

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    if (format === 'pdf') {
      // For now, return a simple text PDF
      // TODO: Implement proper PDF generation with libraries like jsPDF or PDFKit
      return NextResponse.json({ error: 'PDF export coming soon' }, { status: 501 })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Export report error:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}
