'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { DraggableField } from './DraggableField'

interface Field {
  id: string
  name: string
  type: 'dimension' | 'metric'
  icon?: React.ReactNode
}

interface DropZoneProps {
  id: string
  title: string
  fields: Field[]
  onRemove: (fieldId: string) => void
  emptyMessage: string
  icon?: React.ReactNode
}

export function DropZone({ id, title, fields, onRemove, emptyMessage, icon }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="bg-white dark:bg-surface rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-xs text-foreground/50">
          ({fields.length})
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`
          min-h-[120px] p-3 rounded-lg border-2 border-dashed transition-all
          ${isOver 
            ? 'border-accent bg-accent/5' 
            : 'border-border bg-surface/30'
          }
        `}
      >
        {fields.length > 0 ? (
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((field) => (
                <DraggableField
                  key={field.id}
                  id={field.id}
                  field={field}
                  onRemove={() => onRemove(field.id)}
                  isInBuilder
                />
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm text-foreground/60">
              {emptyMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

