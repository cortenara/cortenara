'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getTasks, getProjects, getUserSettings, saveUserSettings, getTodayStats, migrateTasksDaily } from '@/lib/store'
import { Task, VideoProject } from '@/lib/types'
import { Clock, CheckCircle2, Video, User, Edit2, Check } from 'lucide-react'

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours} ساعة ${minutes} دقيقة`
  }
  return `${minutes} دقيقة`
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [userName, setUserName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [stats, setStats] = useState({ tasksCompleted: 0, totalTime: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Migrate tasks on page load
    migrateTasksDaily()
    
    // Load data
    setTasks(getTasks())
    setProjects(getProjects())
    setUserName(getUserSettings().name)
    setStats(getTodayStats())
  }, [])

  const todayTasks = tasks.filter(t => t.category === 'today' && !t.completed)
  const runningTask = tasks.find(t => t.isRunning)

  const handleSaveName = () => {
    saveUserSettings({ name: tempName })
    setUserName(tempName)
    setIsEditingName(false)
  }

  const startEditName = () => {
    setTempName(userName)
    setIsEditingName(true)
  }

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-48"
                placeholder="اسمك"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleSaveName}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-foreground">
                مرحباً، {userName}
              </h1>
              <Button size="icon" variant="ghost" onClick={startEditName}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('ar-EG', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مهام اليوم</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.tasksCompleted} مهمة مكتملة اليوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ساعات العمل</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(stats.totalTime)}</div>
            <p className="text-xs text-muted-foreground">
              إجمالي وقت العمل اليوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفيديوهات</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              مشروع فيديو
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المهمة الحالية</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {runningTask ? runningTask.title : 'لا توجد مهمة'}
            </div>
            <p className="text-xs text-muted-foreground">
              {runningTask ? 'جارية الآن' : 'ابدأ مهمة جديدة'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>مهام اليوم</CardTitle>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد مهام لليوم. أضف مهامك من صفحة المهام!
            </p>
          ) : (
            <div className="space-y-3">
              {todayTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${task.isRunning ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                    <span className="font-medium">{task.title}</span>
                  </div>
                  {task.timeSpent > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {formatTime(task.timeSpent)}
                    </span>
                  )}
                </div>
              ))}
              {todayTasks.length > 5 && (
                <p className="text-center text-sm text-muted-foreground">
                  و {todayTasks.length - 5} مهام أخرى...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>مشاريع الفيديو الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد مشاريع فيديو. أنشئ مشروعك الأول من صفحة صناعة المحتوى!
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 3).map((project) => (
                <div
                  key={project.id}
                  className="rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
                >
                  <h3 className="font-semibold mb-2">{project.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{project.scenes.length} مشهد</span>
                    {project.results.views > 0 && (
                      <span>{project.results.views} مشاهدة</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
