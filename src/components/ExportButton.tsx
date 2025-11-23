'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExportButtonProps {
  onExportPDF?: () => Promise<void> | void
  onExportExcel?: () => Promise<void> | void
  onExportCSV?: () => Promise<void> | void
  label?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ExportButton({
  onExportPDF,
  onExportExcel,
  onExportCSV,
  label = 'Export',
  variant = 'secondary',
  size = 'md',
  className,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: 'pdf' | 'excel' | 'csv') => {
    setIsExporting(true)
    try {
      if (type === 'pdf' && onExportPDF) {
        await onExportPDF()
      } else if (type === 'excel' && onExportExcel) {
        await onExportExcel()
      } else if (type === 'csv' && onExportCSV) {
        await onExportCSV()
      }
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const baseClasses = 'inline-flex items-center gap-2 font-medium rounded-xl transition-all duration-200'
  
  const variantClasses = {
    primary: 'bg-accent text-white hover:bg-accent/90 shadow-md hover:shadow-lg',
    secondary: 'bg-white dark:bg-surface text-foreground border border-border hover:bg-surface-hover dark:hover:bg-slate-800/50 shadow-sm',
    ghost: 'text-foreground hover:bg-surface-hover dark:hover:bg-slate-800/50',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }

  // If only one export option is provided, make it a simple button
  const exportOptionsCount = [onExportPDF, onExportExcel, onExportCSV].filter(Boolean).length
  if (exportOptionsCount === 1) {
    const exportType = onExportPDF ? 'pdf' : onExportExcel ? 'excel' : 'csv'
    return (
      <button
        onClick={() => handleExport(exportType)}
        disabled={isExporting}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExporting ? 'Exporting...' : label}</span>
      </button>
    )
  }

  // Multi-option dropdown
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExporting ? 'Exporting...' : label}</span>
      </button>

      {isOpen && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface rounded-xl shadow-xl border border-border z-20">
            <div className="py-2">
              {onExportPDF && (
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover dark:hover:bg-slate-800/50 flex items-center gap-3 transition-colors"
                >
                  <FileText className="w-4 h-4 text-red-500" />
                  <span>Export as PDF</span>
                </button>
              )}

              {onExportExcel && (
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover dark:hover:bg-slate-800/50 flex items-center gap-3 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Export as Excel</span>
                </button>
              )}

              {onExportCSV && (
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover dark:hover:bg-slate-800/50 flex items-center gap-3 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                  <span>Export as CSV</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

