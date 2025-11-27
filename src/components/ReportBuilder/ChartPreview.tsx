'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'
import { formatCurrency, formatMultiple } from '@/lib/utils'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

interface ChartPreviewProps {
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'table'
  data: any[]
  xAxisField?: string
  yAxisFields?: string[]
  colors?: string[]
  currencyCode?: string
  maskedMetrics?: string[]
}

// More vibrant, distinct colors with better contrast
const DEFAULT_COLORS = [
  '#2563eb', // bold blue
  '#059669', // bold emerald
  '#dc2626', // bold red
  '#7c3aed', // bold violet
  '#ea580c', // bold orange
  '#0891b2', // bold cyan
  '#d946ef', // bold fuchsia
  '#65a30d', // bold lime
]

// Chart styling constants for better readability
const AXIS_STYLE = {
  fontSize: 13,
  fontWeight: 500,
  fill: '#475569', // slate-600 for light mode
}

const AXIS_STYLE_DARK = {
  fontSize: 13,
  fontWeight: 500,
  fill: '#cbd5e1', // slate-300 for dark mode
}

const GRID_STYLE = {
  stroke: '#e2e8f0', // slate-200
  strokeDasharray: '3 3',
  opacity: 0.6,
}

const LEGEND_STYLE = {
  fontSize: 13,
  fontWeight: 500,
}

export function ChartPreview({ 
  chartType, 
  data, 
  xAxisField = 'name', 
  yAxisFields = ['value'],
  colors = DEFAULT_COLORS,
  currencyCode = 'USD',
  maskedMetrics = [],
}: ChartPreviewProps) {
  const hasMasked = maskedMetrics.length > 0
  const maskedLabel =
    maskedMetrics.length > 3
      ? `${maskedMetrics.slice(0, 3).join(', ')}…`
      : maskedMetrics.join(', ')

  // If everything selected was masked, show a clear cue instead of empty data
  if ((yAxisFields.length === 0 || !yAxisFields.some(Boolean)) && hasMasked) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm px-4 text-center">
        All selected metrics are masked by your role. Hidden: {maskedLabel || 'metrics'}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] bg-surface/30 rounded-lg border-2 border-dashed border-border">
        <p className="text-sm text-foreground/60">No data to display</p>
      </div>
    )
  }

  const formatValue = (value: any, key: string) => {
    if (typeof value !== 'number') return value
    if (key.toLowerCase().includes('amount') || 
        key.toLowerCase().includes('commitment') || 
        key.toLowerCase().includes('nav') ||
        key.toLowerCase().includes('paid') ||
        key.toLowerCase().includes('distribution') ||
        key.toLowerCase().includes('unfunded') ||
        key.toLowerCase().includes('value')) {
      return formatCurrency(value, currencyCode)
    }
    if (key.toLowerCase().includes('tvpi') || 
        key.toLowerCase().includes('dpi') ||
        key.toLowerCase().includes('irr') ||
        key.toLowerCase().includes('pic') ||
        key.toLowerCase().includes('rvpi') ||
        key.toLowerCase().includes('moic')) {
      return formatMultiple(value)
    }
    return value.toLocaleString()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg shadow-xl p-4">
          <p className="font-bold text-base mb-3 text-slate-900 dark:text-slate-100">{label}</p>
          <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {entry.name}:
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {formatValue(entry.value, entry.name)}
                </span>
              </div>
          ))}
          </div>
        </div>
      )
    }
    return null
  }

  if (chartType === 'table') {
    const columnDefs: ColDef[] = Object.keys(data[0] || {}).map((key) => ({
      field: key,
      headerName: key.replace(/([A-Z])/g, ' $1').trim(),
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => {
        return formatValue(params.value, key)
      },
      sortable: true,
      filter: true,
    }))

    return (
      <div className="h-[500px] w-full relative">
        {hasMasked && (
          <div className="absolute right-3 top-3 z-10 text-[11px] px-2 py-1 rounded bg-amber-100 text-amber-900 border border-amber-200 shadow-sm">
            Some metrics hidden: {maskedLabel}
          </div>
        )}
        <AgGridReact
          theme={themeQuartz}
          rowData={data}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={10}
          defaultColDef={{
            resizable: true,
          }}
        />
      </div>
    )
  }

  if (chartType === 'pie') {
    // For pie charts, use first metric field
    const valueField = yAxisFields[0]
    
    // Custom label with better visibility
    const renderLabel = (entry: any) => {
      const percent = ((entry.value / data.reduce((sum, item) => sum + item[valueField], 0)) * 100).toFixed(1)
      return `${entry.name}: ${percent}%`
    }
    
    return (
      <div className="relative">
        {hasMasked && (
          <div className="absolute right-3 top-3 z-10 text-[11px] px-2 py-1 rounded bg-amber-100 text-amber-900 border border-amber-200 shadow-sm">
            Some metrics hidden: {maskedLabel}
          </div>
        )}
        <ResponsiveContainer width="100%" height={450}>
          <PieChart>
            <Pie
              data={data}
              dataKey={valueField}
              nameKey={xAxisField}
              cx="50%"
              cy="50%"
              outerRadius={130}
              innerRadius={60}
              paddingAngle={2}
              label={renderLabel}
              labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }}
              iconType="circle"
              iconSize={10}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (chartType === 'bar') {
    return (
      <div className="relative">
        {hasMasked && (
          <div className="absolute right-3 top-3 z-10 text-[11px] px-2 py-1 rounded bg-amber-100 text-amber-900 border border-amber-200 shadow-sm">
            Some metrics hidden: {maskedLabel}
          </div>
        )}
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis 
              dataKey={xAxisField} 
              tick={AXIS_STYLE}
              stroke="#cbd5e1"
              tickLine={{ stroke: '#cbd5e1' }}
              height={60}
              angle={-15}
              textAnchor="end"
            />
            <YAxis 
              tick={AXIS_STYLE}
              stroke="#cbd5e1"
              tickLine={{ stroke: '#cbd5e1' }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', ...LEGEND_STYLE }}
              iconType="rect"
              iconSize={14}
            />
            {yAxisFields.map((field, index) => (
              <Bar 
                key={field}
                dataKey={field} 
                fill={colors[index % colors.length]}
                name={field.replace(/([A-Z])/g, ' $1').trim()}
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (chartType === 'line') {
    return (
      <div className="relative">
        {hasMasked && (
          <div className="absolute right-3 top-3 z-10 text-[11px] px-2 py-1 rounded bg-amber-100 text-amber-900 border border-amber-200 shadow-sm">
            Some metrics hidden: {maskedLabel}
          </div>
        )}
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis 
              dataKey={xAxisField} 
              tick={AXIS_STYLE}
              stroke="#cbd5e1"
              tickLine={{ stroke: '#cbd5e1' }}
              height={60}
              angle={-15}
              textAnchor="end"
            />
            <YAxis 
              tick={AXIS_STYLE}
              stroke="#cbd5e1"
              tickLine={{ stroke: '#cbd5e1' }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1 }} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', ...LEGEND_STYLE }}
              iconType="line"
              iconSize={20}
            />
            {yAxisFields.map((field, index) => (
              <Line
                key={field}
                type="monotone"
                dataKey={field}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 7, strokeWidth: 2 }}
                name={field.replace(/([A-Z])/g, ' $1').trim()}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (chartType === 'area') {
    return (
      <div className="relative">
        {hasMasked && (
          <div className="absolute right-3 top-3 z-10 text-[11px] px-2 py-1 rounded bg-amber-100 text-amber-900 border border-amber-200 shadow-sm">
            Some metrics hidden: {maskedLabel}
          </div>
        )}
        <ResponsiveContainer width="100%" height={450}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              {yAxisFields.map((field, index) => (
                <linearGradient key={field} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.05}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis 
              dataKey={xAxisField} 
              tick={AXIS_STYLE}
              stroke="#cbd5e1"
              tickLine={{ stroke: '#cbd5e1' }}
              height={60}
              angle={-15}
              textAnchor="end"
            />
            <YAxis 
              tick={AXIS_STYLE}
              stroke="#cbd5e1"
              tickLine={{ stroke: '#cbd5e1' }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1 }} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', ...LEGEND_STYLE }}
              iconType="rect"
              iconSize={14}
            />
            {yAxisFields.map((field, index) => (
              <Area
                key={field}
                type="monotone"
                dataKey={field}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                fill={`url(#gradient-${index})`}
                name={field.replace(/([A-Z])/g, ' $1').trim()}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return null
}
