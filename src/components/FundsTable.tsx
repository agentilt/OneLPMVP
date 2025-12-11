'use client'

import { useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, ValueFormatterParams } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import '@/styles/ag-grid-custom.css'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Download, FileSpreadsheet } from 'lucide-react'

interface Fund {
  id: string
  name: string
  domicile: string
  vintage: number
  manager: string
  commitment: number
  paidIn: number
  nav: number
  tvpi: number
  dpi: number
  lastReportDate: Date
}

interface FundsTableProps {
  funds: Fund[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatMultiple = (value: number) => {
  return value.toFixed(2) + 'x'
}

const calculateTvpi = (nav: number, paidIn: number, dpi: number) => {
  return paidIn > 0 ? (nav / paidIn) + dpi : 0
}

// Custom cell renderer for fund name with link
const FundNameCellRenderer = (props: any) => {
  return (
    <Link 
      href={`/funds/${props.data.id}`}
      className="text-accent hover:text-accent-hover font-semibold transition-colors"
    >
      {props.value}
    </Link>
  )
}

// Custom cell renderer for performance indicator
const PerformanceCellRenderer = (props: any) => {
  const tvpi = calculateTvpi(props.data.nav, props.data.paidIn, props.data.dpi)
  const isPositive = tvpi >= 1.0
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium ${
      isPositive 
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    }`}>
      {isPositive ? (
        <TrendingUp className="w-3.5 h-3.5" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5" />
      )}
      <span>{isPositive ? 'Positive' : 'Negative'}</span>
    </div>
  )
}

export function FundsTable({ funds }: FundsTableProps) {
  const gridRef = useRef<AgGridReact>(null)

  const exportToCSV = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `funds-export-${new Date().toISOString().split('T')[0]}.csv`,
        columnKeys: ['name', 'manager', 'domicile', 'vintage', 'commitment', 'paidIn', 'nav', 'tvpi', 'dpi'],
      })
    }
  }, [])

  const exportToExcel = useCallback(() => {
    if (gridRef.current?.api) {
      // Note: Excel export requires AG Grid Enterprise license
      // For now, we'll export as CSV which can be opened in Excel
      gridRef.current.api.exportDataAsCsv({
        fileName: `funds-export-${new Date().toISOString().split('T')[0]}.csv`,
        columnKeys: ['name', 'manager', 'domicile', 'vintage', 'commitment', 'paidIn', 'nav', 'tvpi', 'dpi'],
      })
    }
  }, [])

  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'Fund Name',
      flex: 2,
      minWidth: 200,
      cellRenderer: FundNameCellRenderer,
      sortable: true,
      filter: 'agTextColumnFilter',
      pinned: 'left',
    },
    {
      field: 'manager',
      headerName: 'Manager',
      flex: 1.5,
      minWidth: 150,
      sortable: true,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'domicile',
      headerName: 'Domicile',
      flex: 0.8,
      minWidth: 100,
      sortable: true,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'vintage',
      headerName: 'Vintage',
      flex: 0.7,
      minWidth: 90,
      sortable: true,
      filter: 'agNumberColumnFilter',
    },
    {
      field: 'commitment',
      headerName: 'Commitment',
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => formatCurrency(params.value),
      type: 'rightAligned',
    },
    {
      field: 'paidIn',
      headerName: 'Paid-in',
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => formatCurrency(params.value),
      type: 'rightAligned',
    },
    {
      field: 'nav',
      headerName: 'NAV',
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => formatCurrency(params.value),
      type: 'rightAligned',
      cellStyle: { color: 'var(--accent-color)', fontWeight: '600' },
    },
    {
      field: 'tvpi',
      headerName: 'TVPI',
      flex: 0.7,
      minWidth: 90,
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueGetter: (params) => calculateTvpi(params.data.nav, params.data.paidIn, params.data.dpi),
      valueFormatter: (params: ValueFormatterParams) => formatMultiple(params.value),
      type: 'rightAligned',
    },
    {
      field: 'dpi',
      headerName: 'DPI',
      flex: 0.7,
      minWidth: 90,
      sortable: true,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => formatMultiple(params.value),
      type: 'rightAligned',
    },
    {
      field: 'performance',
      headerName: 'Performance',
      flex: 1,
      minWidth: 130,
      sortable: true,
      cellRenderer: PerformanceCellRenderer,
      comparator: (valueA: any, valueB: any, nodeA: any, nodeB: any) => {
        const tvpiA = calculateTvpi(nodeA.data.nav, nodeA.data.paidIn, nodeA.data.dpi)
        const tvpiB = calculateTvpi(nodeB.data.nav, nodeB.data.paidIn, nodeB.data.dpi)
        return tvpiA - tvpiB
      },
    },
  ], [])

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  const onGridReady = useCallback((params: any) => {
    params.api.sizeColumnsToFit()
  }, [])

  return (
    <div className="space-y-4">
      {/* Export Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-foreground/60">
          {funds.length} {funds.length === 1 ? 'fund' : 'funds'} • {gridRef.current?.api?.getDisplayedRowCount() || funds.length} displayed
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 glass-panel border border-border rounded-lg text-sm font-medium text-foreground hover:border-accent/40 hover:shadow-lg transition-all duration-150"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-all duration-150 shadow-sm hover:shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="ag-theme-quartz ag-theme-custom" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={funds}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          animateRows={true}
          pagination={true}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          rowSelection="multiple"
          enableCellTextSelection={true}
          ensureDomOrder={true}
          suppressCellFocus={false}
        />
      </div>
    </div>
  )
}

