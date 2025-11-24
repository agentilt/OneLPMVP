'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { ICON_MAP } from './DragDropReportBuilder'

interface DraggableFieldProps {
  id: string
  field: {
    id: string
    name: string
    type: 'dimension' | 'metric'
    iconId?: string
  }
  onRemove?: () => void
  isInBuilder?: boolean
}

export function DraggableField({ id, field, onRemove, isInBuilder }: DraggableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center justify-between gap-2 px-3 py-2 rounded-lg border
        ${field.type === 'dimension' 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
        }
        ${isDragging ? 'shadow-lg' : 'shadow-sm'}
        cursor-move transition-all hover:shadow-md
      `}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-foreground/40" />
        </div>
        {field.iconId && ICON_MAP[field.iconId] && (
          <span className="flex-shrink-0">
            {(() => {
              const IconComponent = ICON_MAP[field.iconId!]
              return field.type === 'dimension' ? (
                <IconComponent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <IconComponent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )
            })()}
          </span>
        )}
        <span className="text-sm font-medium text-foreground truncate">
          {field.name}
        </span>
      </div>
      {isInBuilder && onRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
        >
          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      )}
    </div>
  )
}

