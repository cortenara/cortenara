'use client'

import { useState, useEffect } from 'react'
import { Task, TaskCategory } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Play, Pause, CheckCircle2, MoreVertical, Trash2, ArrowRight, Clock, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TaskItemProps {
  task: Task
  onStart: (taskId: string) => void
  onPause: (taskId: string) => void
  onComplete: (taskId: string) => void
  onDelete: (taskId: string) => void
  onMove: (taskId: string, category: TaskCategory) => void
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatTimeShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const categoryLabels: Record<TaskCategory, string> = {
  today: 'اليوم',
  tomorrow: 'غداً',
  week: 'الأسبوع',
}

export function TaskItem({ task, onStart, onPause, onComplete, onDelete, onMove }: TaskItemProps) {
  const [displayTime, setDisplayTime] = useState(task.timeSpent)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (task.isRunning) {
      interval = setInterval(() => {
        setDisplayTime(prev => prev + 1)
      }, 1000)
    } else {
      setDisplayTime(task.timeSpent)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [task.isRunning, task.timeSpent])

  const otherCategories = (['today', 'tomorrow', 'week'] as TaskCategory[]).filter(
    c => c !== task.category
  )

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-3 md:p-4 transition-all',
        isDragging && 'opacity-50 shadow-lg',
        task.completed && 'opacity-60 bg-muted/50',
        task.isRunning && 'ring-2 ring-green-500/50 bg-green-500/5'
      )}
    >
      <div className="flex items-center gap-2 md:gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 md:p-1 text-muted-foreground hover:text-foreground touch-none shrink-0"
        >
          <GripVertical className="h-4 w-4 md:h-5 md:w-5" />
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-medium truncate text-sm md:text-base',
            task.completed && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5 md:mt-1">
              {task.description}
            </p>
          )}
        </div>

        {/* Timer - Hidden on very small screens when not running */}
        <div className={cn(
          "items-center gap-1 md:gap-2 text-xs md:text-sm shrink-0",
          task.isRunning ? "flex" : "hidden sm:flex"
        )}>
          <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground hidden sm:block" />
          <span className={cn(
            'font-mono',
            task.isRunning && 'text-green-500 font-semibold'
          )}>
            <span className="hidden sm:inline">{formatTime(displayTime)}</span>
            <span className="sm:hidden">{formatTimeShort(displayTime)}</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {!task.completed && (
            <>
              {task.isRunning ? (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onPause(task.id)}
                  className="h-7 w-7 md:h-8 md:w-8"
                >
                  <Pause className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onStart(task.id)}
                  className="h-7 w-7 md:h-8 md:w-8"
                >
                  <Play className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="outline"
                onClick={() => onComplete(task.id)}
                className="h-7 w-7 md:h-8 md:w-8 text-green-600 hover:text-green-700 hover:bg-green-50 hidden sm:flex"
              >
                <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 md:h-8 md:w-8">
                <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!task.completed && (
                <>
                  <DropdownMenuItem onClick={() => onComplete(task.id)} className="sm:hidden">
                    <CheckCircle2 className="h-4 w-4 ml-2 text-green-600" />
                    إكمال المهمة
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="sm:hidden" />
                </>
              )}
              {otherCategories.map(category => (
                <DropdownMenuItem key={category} onClick={() => onMove(task.id, category)}>
                  <ArrowRight className="h-4 w-4 ml-2" />
                  نقل إلى {categoryLabels[category]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  )
}
