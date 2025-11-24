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
import { ColDef } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

interface ChartPreviewProps {
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'table'
  data: any[]
  xAxisField?: string
  yAxisFields?: string[]
  colors?: string[]
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
]

export function ChartPreview({ 
  chartType, 
  data, 
  xAxisField = 'name', 
  yAxisFields = ['value'],
  colors = DEFAULT_COLORS 
}: ChartPreviewProps) {
  
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
        key.toLowerCase().includes('paid')) {
      return formatCurrency(value)
    }
    if (key.toLowerCase().includes('tvpi') || 
        key.toLowerCase().includes('dpi') ||
        key.toLowerCase().includes('moic')) {
      return formatMultiple(value)
    }
    return value.toLocaleString()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value, entry.name)}
            </p>
          ))}
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
      <div className="ag-theme-quartz h-[500px] w-full">
        <AgGridReact
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
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            dataKey={valueField}
            nameKey={xAxisField}
            cx="50%"
            cy="50%"
            outerRadius={120}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis 
            dataKey={xAxisField} 
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            opacity={0.5}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            opacity={0.5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {yAxisFields.map((field, index) => (
            <Bar 
              key={field}
              dataKey={field} 
              fill={colors[index % colors.length]}
              name={field.replace(/([A-Z])/g, ' $1').trim()}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis 
            dataKey={xAxisField} 
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            opacity={0.5}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            opacity={0.5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {yAxisFields.map((field, index) => (
            <Line
              key={field}
              type="monotone"
              dataKey={field}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              name={field.replace(/([A-Z])/g, ' $1').trim()}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis 
            dataKey={xAxisField} 
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            opacity={0.5}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            opacity={0.5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {yAxisFields.map((field, index) => (
            <Area
              key={field}
              type="monotone"
              dataKey={field}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.3}
              name={field.replace(/([A-Z])/g, ' $1').trim()}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return null
}

