'use client'

import { useEffect, useState, useCallback } from 'react'
import { Task, TaskCategory } from '@/lib/types'
import { getTasks, saveTasks, migrateTasksDaily } from '@/lib/store'
import { TaskItem } from '@/components/task-item'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

function formatTimeShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}س ${minutes}د`
  }
  return `${minutes}د`
}

const categoryConfig: Record<TaskCategory, { label: string; shortLabel: string; description: string }> = {
  today: { label: 'اليوم', shortLabel: 'اليوم', description: 'المهام المطلوب إنجازها اليوم' },
  tomorrow: { label: 'غداً', shortLabel: 'غداً', description: 'المهام المجدولة للغد' },
  week: { label: 'هذا الأسبوع', shortLabel: 'الأسبوع', description: 'المهام المجدولة لهذا الأسبوع' },
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState<TaskCategory | 'completed'>('today')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('today')
  const [mounted, setMounted] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    setMounted(true)
    migrateTasksDaily()
    setTasks(getTasks())
  }, [])

  const saveTasksToStorage = useCallback((updatedTasks: Task[]) => {
    setTasks(updatedTasks)
    saveTasks(updatedTasks)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks => {
        const runningTask = prevTasks.find(t => t.isRunning)
        if (runningTask) {
          const updated = prevTasks.map(t =>
            t.id === runningTask.id ? { ...t, timeSpent: t.timeSpent + 1 } : t
          )
          saveTasks(updated)
          return updated
        }
        return prevTasks
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      category: newTaskCategory,
      completed: false,
      createdAt: new Date(),
      timeSpent: 0,
      isRunning: false,
    }

    saveTasksToStorage([...tasks, newTask])
    setNewTaskTitle('')
    setNewTaskDescription('')
    setIsAddDialogOpen(false)
  }

  const handleStartTask = (taskId: string) => {
    const updated = tasks.map(t => ({
      ...t,
      isRunning: t.id === taskId,
      startedAt: t.id === taskId ? new Date() : t.startedAt,
    }))
    saveTasksToStorage(updated)
  }

  const handlePauseTask = (taskId: string) => {
    const updated = tasks.map(t =>
      t.id === taskId ? { ...t, isRunning: false } : t
    )
    saveTasksToStorage(updated)
  }

  const handleCompleteTask = (taskId: string) => {
    const updated = tasks.map(t =>
      t.id === taskId
        ? { ...t, completed: true, isRunning: false, completedAt: new Date() }
        : t
    )
    saveTasksToStorage(updated)
  }

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId)
    saveTasksToStorage(updated)
  }

  const handleMoveTask = (taskId: string, category: TaskCategory) => {
    const updated = tasks.map(t =>
      t.id === taskId ? { ...t, category } : t
    )
    saveTasksToStorage(updated)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeTask = tasks.find(t => t.id === active.id)
    const overTask = tasks.find(t => t.id === over.id)

    if (activeTask && overTask && activeTask.category !== overTask.category) {
      const updated = tasks.map(t =>
        t.id === active.id ? { ...t, category: overTask.category } : t
      )
      saveTasksToStorage(updated)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const activeIndex = tasks.findIndex(t => t.id === active.id)
    const overIndex = tasks.findIndex(t => t.id === over.id)

    if (activeIndex !== -1 && overIndex !== -1) {
      const updated = arrayMove(tasks, activeIndex, overIndex)
      saveTasksToStorage(updated)
    }
  }

  const getTasksByCategory = (category: TaskCategory) =>
    tasks.filter(t => t.category === category && !t.completed)

  const getCompletedTasks = () => tasks.filter(t => t.completed)

  const getCategoryStats = (category: TaskCategory) => {
    const categoryTasks = tasks.filter(t => t.category === category)
    const completed = categoryTasks.filter(t => t.completed).length
    const total = categoryTasks.length
    const totalTime = categoryTasks.reduce((acc, t) => acc + t.timeSpent, 0)
    return { completed, total, totalTime }
  }

  if (!mounted) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const activeTask = tasks.find(t => t.id === activeId)

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">المهام</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة مهامك اليومية والأسبوعية</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 ml-2" />
              إضافة مهمة
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مهمة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان المهمة</Label>
                <Input
                  id="title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="أدخل عنوان المهمة..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">الوصف (اختياري)</Label>
                <Textarea
                  id="description"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="أدخل وصف المهمة..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>إضافة إلى</Label>
                <div className="flex flex-wrap gap-2">
                  {(['today', 'tomorrow', 'week'] as TaskCategory[]).map(cat => (
                    <Button
                      key={cat}
                      variant={newTaskCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewTaskCategory(cat)}
                    >
                      {categoryConfig[cat].label}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleAddTask} className="w-full">
                إضافة المهمة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-3 grid-cols-3">
        {(['today', 'tomorrow', 'week'] as TaskCategory[]).map(category => {
          const stats = getCategoryStats(category)
          return (
            <Card key={category} className="p-3 md:p-4">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                {category === 'today' && <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />}
                {category === 'tomorrow' && <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />}
                {category === 'week' && <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />}
                <span className="text-xs md:text-sm font-medium">{categoryConfig[category].shortLabel}</span>
              </div>
              <div className="text-lg md:text-2xl font-bold">
                {stats.completed}/{stats.total}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {formatTimeShort(stats.totalTime)}
              </p>
            </Card>
          )
        })}
      </div>

      {/* Tasks Tabs */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TaskCategory | 'completed')}>
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="today" className="text-xs md:text-sm py-2">
              <span className="hidden sm:inline">اليوم</span>
              <span className="sm:hidden">اليوم</span>
            </TabsTrigger>
            <TabsTrigger value="tomorrow" className="text-xs md:text-sm py-2">
              <span className="hidden sm:inline">غداً</span>
              <span className="sm:hidden">غداً</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs md:text-sm py-2">
              <span className="hidden sm:inline">الأسبوع</span>
              <span className="sm:hidden">أسبوع</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs md:text-sm py-2">
              <span className="hidden sm:inline">المكتملة</span>
              <span className="sm:hidden">تم</span>
            </TabsTrigger>
          </TabsList>

          {(['today', 'tomorrow', 'week'] as TaskCategory[]).map(category => (
            <TabsContent key={category} value={category} className="mt-4 md:mt-6">
              <div className="space-y-2 md:space-y-3">
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                  {categoryConfig[category].description}
                </p>
                <SortableContext
                  items={getTasksByCategory(category).map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {getTasksByCategory(category).length === 0 ? (
                    <Card className="p-6 md:p-8">
                      <p className="text-center text-sm text-muted-foreground">
                        لا توجد مهام. أضف مهمتك الأولى!
                      </p>
                    </Card>
                  ) : (
                    getTasksByCategory(category).map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onStart={handleStartTask}
                        onPause={handlePauseTask}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        onMove={handleMoveTask}
                      />
                    ))
                  )}
                </SortableContext>
              </div>
            </TabsContent>
          ))}

          <TabsContent value="completed" className="mt-4 md:mt-6">
            <div className="space-y-2 md:space-y-3">
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                المهام التي أنجزتها
              </p>
              {getCompletedTasks().length === 0 ? (
                <Card className="p-6 md:p-8">
                  <p className="text-center text-sm text-muted-foreground">
                    لم تكمل أي مهام بعد. ابدأ العمل!
                  </p>
                </Card>
              ) : (
                <SortableContext
                  items={getCompletedTasks().map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {getCompletedTasks().map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onStart={handleStartTask}
                      onPause={handlePauseTask}
                      onComplete={handleCompleteTask}
                      onDelete={handleDeleteTask}
                      onMove={handleMoveTask}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DragOverlay>
          {activeTask ? (
            <Card className="p-3 md:p-4 shadow-lg opacity-90">
              <div className="font-medium text-sm md:text-base">{activeTask.title}</div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
