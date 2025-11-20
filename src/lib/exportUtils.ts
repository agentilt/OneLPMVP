import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Type declaration for jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
    lastAutoTable?: {
      finalY: number
    }
  }
}

export interface ExportData {
  title: string
  subtitle?: string
  date: string
  sections: ExportSection[]
}

export interface ExportSection {
  title: string
  type: 'summary' | 'table' | 'text' | 'metrics'
  data: any
}

// PDF Export Functions
export const exportToPDF = (data: ExportData) => {
  const doc = new jsPDF()
  let yPosition = 20

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(data.title, 20, yPosition)
  yPosition += 10

  if (data.subtitle) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(data.subtitle, 20, yPosition)
    yPosition += 8
  }

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated: ${data.date}`, 20, yPosition)
  yPosition += 15

  // Sections
  data.sections.forEach((section) => {
    // Section title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text(section.title, 20, yPosition)
    yPosition += 8

    if (section.type === 'summary') {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      Object.entries(section.data).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 25, yPosition)
        yPosition += 6
      })
      yPosition += 5
    }

    if (section.type === 'metrics') {
      const metrics = section.data as Array<{ label: string; value: string }>
      metrics.forEach((metric) => {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`${metric.label}: ${metric.value}`, 25, yPosition)
        yPosition += 6
      })
      yPosition += 5
    }

    if (section.type === 'table') {
      autoTable(doc, {
        startY: yPosition,
        head: [section.data.headers],
        body: section.data.rows,
        theme: 'grid',
        headStyles: {
          fillColor: [75, 108, 156],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        margin: { left: 20 },
      })
      yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    if (section.type === 'text') {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(section.data, 170)
      doc.text(lines, 25, yPosition)
      yPosition += lines.length * 6 + 5
    }

    // Check if we need a new page
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
    }
  })

  // Footer
  const pageCount = doc.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  return doc
}

// Excel Export Functions
export const exportToExcel = (data: {
  filename: string
  sheets: Array<{
    name: string
    data: any[][]
  }>
}) => {
  const wb = XLSX.utils.book_new()

  data.sheets.forEach((sheet) => {
    const ws = XLSX.utils.aoa_to_sheet(sheet.data)
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  })

  XLSX.writeFile(wb, `${data.filename}.xlsx`)
}

// CSV Export Function
export const exportToCSV = (data: any[][], filename: string) => {
  const ws = XLSX.utils.aoa_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(ws)
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Format currency for exports
export const formatCurrencyForExport = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Format percentage for exports
export const formatPercentForExport = (value: number, decimals = 2): string => {
  return `${value.toFixed(decimals)}%`
}

// Format date for exports
export const formatDateForExport = (date: Date | string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

