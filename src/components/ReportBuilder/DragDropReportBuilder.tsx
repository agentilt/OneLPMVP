'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  AreaChart as AreaChartIcon,
  Table2,
  Calendar,
  MapPin,
  Building2,
  TrendingUp,
  DollarSign,
  Layers,
  Users,
} from 'lucide-react'
import { DraggableField } from './DraggableField'
import { DropZone } from './DropZone'
import { ChartPreview } from './ChartPreview'

interface Field {
  id: string
  name: string
  type: 'dimension' | 'metric'
  icon?: React.ReactNode
}

interface DragDropReportBuilderProps {
  onConfigChange: (config: ReportBuilderConfig) => void
  initialConfig?: ReportBuilderConfig
}

export interface ReportBuilderConfig {
  dimensions: Field[]
  metrics: Field[]
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'table'
}

const AVAILABLE_DIMENSIONS: Field[] = [
  { id: 'name', name: 'Fund Name', type: 'dimension', icon: <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
  { id: 'vintage', name: 'Vintage Year', type: 'dimension', icon: <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
  { id: 'domicile', name: 'Geography', type: 'dimension', icon: <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
  { id: 'manager', name: 'Manager', type: 'dimension', icon: <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
  { id: 'investmentType', name: 'Investment Type', type: 'dimension', icon: <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
  { id: 'entityType', name: 'Entity Type', type: 'dimension', icon: <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
]

const AVAILABLE_METRICS: Field[] = [
  { id: 'commitment', name: 'Commitment', type: 'metric', icon: <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
  { id: 'paidIn', name: 'Paid-In Capital', type: 'metric', icon: <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
  { id: 'nav', name: 'NAV', type: 'metric', icon: <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
  { id: 'tvpi', name: 'TVPI', type: 'metric', icon: <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
  { id: 'dpi', name: 'DPI', type: 'metric', icon: <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
  { id: 'pic', name: 'PIC', type: 'metric', icon: <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
  { id: 'rvpi', name: 'RVPI', type: 'metric', icon: <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
]

const CHART_TYPES = [
  { id: 'bar', name: 'Bar Chart', icon: BarChart3 },
  { id: 'line', name: 'Line Chart', icon: LineChartIcon },
  { id: 'pie', name: 'Pie Chart', icon: PieChartIcon },
  { id: 'area', name: 'Area Chart', icon: AreaChartIcon },
  { id: 'table', name: 'Table', icon: Table2 },
] as const

export function DragDropReportBuilder({ onConfigChange, initialConfig }: DragDropReportBuilderProps) {
  const [dimensions, setDimensions] = useState<Field[]>(initialConfig?.dimensions || [])
  const [metrics, setMetrics] = useState<Field[]>(initialConfig?.metrics || [])
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area' | 'table'>(
    initialConfig?.chartType || 'bar'
  )
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const availableDimensions = AVAILABLE_DIMENSIONS.filter(
    (d) => !dimensions.find((dim) => dim.id === d.id)
  )

  const availableMetrics = AVAILABLE_METRICS.filter(
    (m) => !metrics.find((met) => met.id === m.id)
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeField = [...AVAILABLE_DIMENSIONS, ...AVAILABLE_METRICS].find(
      (f) => f.id === active.id
    )
    if (!activeField) return

    // Moving from available fields to drop zones
    if (over.id === 'dimensions-drop' && activeField.type === 'dimension') {
      if (!dimensions.find((d) => d.id === activeField.id)) {
        const newDimensions = [...dimensions, activeField]
        setDimensions(newDimensions)
        updateConfig(newDimensions, metrics, chartType)
      }
    } else if (over.id === 'metrics-drop' && activeField.type === 'metric') {
      if (!metrics.find((m) => m.id === activeField.id)) {
        const newMetrics = [...metrics, activeField]
        setMetrics(newMetrics)
        updateConfig(dimensions, newMetrics, chartType)
      }
    }

    // Reordering within drop zones
    if (active.id !== over.id) {
      const activeIndex = dimensions.findIndex((d) => d.id === active.id)
      const overIndex = dimensions.findIndex((d) => d.id === over.id)

      if (activeIndex !== -1 && overIndex !== -1) {
        const newDimensions = arrayMove(dimensions, activeIndex, overIndex)
        setDimensions(newDimensions)
        updateConfig(newDimensions, metrics, chartType)
      }

      const activeMetricIndex = metrics.findIndex((m) => m.id === active.id)
      const overMetricIndex = metrics.findIndex((m) => m.id === over.id)

      if (activeMetricIndex !== -1 && overMetricIndex !== -1) {
        const newMetrics = arrayMove(metrics, activeMetricIndex, overMetricIndex)
        setMetrics(newMetrics)
        updateConfig(dimensions, newMetrics, chartType)
      }
    }
  }

  const handleRemoveDimension = (fieldId: string) => {
    const newDimensions = dimensions.filter((d) => d.id !== fieldId)
    setDimensions(newDimensions)
    updateConfig(newDimensions, metrics, chartType)
  }

  const handleRemoveMetric = (fieldId: string) => {
    const newMetrics = metrics.filter((m) => m.id !== fieldId)
    setMetrics(newMetrics)
    updateConfig(dimensions, newMetrics, chartType)
  }

  const handleChartTypeChange = (type: typeof chartType) => {
    setChartType(type)
    updateConfig(dimensions, metrics, type)
  }

  const updateConfig = (dims: Field[], mets: Field[], type: typeof chartType) => {
    onConfigChange({
      dimensions: dims,
      metrics: mets,
      chartType: type,
    })
  }

  const activeField = activeId
    ? [...AVAILABLE_DIMENSIONS, ...AVAILABLE_METRICS].find((f) => f.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Chart Type Selector */}
        <div className="bg-white dark:bg-surface rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
            Visualization Type
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {CHART_TYPES.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => handleChartTypeChange(type.id)}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                    ${chartType === type.id
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border hover:border-accent/50 hover:bg-accent/5'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{type.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Available Fields */}
        <div className="bg-white dark:bg-surface rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
            Available Fields
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">
                Dimensions (Group By)
              </p>
              <div className="space-y-2">
                {availableDimensions.map((field) => (
                  <DraggableField key={field.id} id={field.id} field={field} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">
                Metrics (Measure)
              </p>
              <div className="space-y-2">
                {availableMetrics.map((field) => (
                  <DraggableField key={field.id} id={field.id} field={field} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drop Zones */}
        <div className="grid grid-cols-2 gap-4">
          <DropZone
            id="dimensions-drop"
            title="Rows / X-Axis"
            fields={dimensions}
            onRemove={handleRemoveDimension}
            emptyMessage="Drag dimensions here"
            icon={<Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          />
          <DropZone
            id="metrics-drop"
            title="Values / Y-Axis"
            fields={metrics}
            onRemove={handleRemoveMetric}
            emptyMessage="Drag metrics here"
            icon={<TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          />
        </div>
      </div>

      <DragOverlay>
        {activeField ? (
          <DraggableField id={activeField.id} field={activeField} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
