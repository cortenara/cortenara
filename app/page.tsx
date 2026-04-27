'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getTasks, getProjects, getUserSettings, saveUserSettings, getTodayStats, migrateTasksDaily } from '@/lib/store'
import { Task, VideoProject } from '@/lib/types'
import { Clock, CheckCircle2, Video, Play, Edit2, Check } from 'lucide-react'
import Link from 'next/link'

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours} ساعة ${minutes} دقيقة`
  }
  return `${minutes} دقيقة`
}

function formatTimeShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}س ${minutes}د`
  }
  return `${minutes}د`
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
    migrateTasksDaily()
    
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
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-32 md:w-48"
                placeholder="اسمك"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleSaveName}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl md:text-3xl font-bold text-foreground">
                مرحبا، {userName}
              </h1>
              <Button size="icon" variant="ghost" onClick={startEditName} className="h-8 w-8">
                <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </>
          )}
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">
          {new Date().toLocaleDateString('ar-EG', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">مهام اليوم</CardTitle>
            <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{todayTasks.length}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {stats.tasksCompleted} مكتملة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">ساعات العمل</CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{formatTimeShort(stats.totalTime)}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              إجمالي اليوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">الفيديوهات</CardTitle>
            <Video className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{projects.length}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              مشروع
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">المهمة الحالية</CardTitle>
            <Play className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm md:text-lg font-bold truncate">
              {runningTask ? runningTask.title : 'لا توجد مهمة'}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {runningTask ? `${formatTimeShort(runningTask.timeSpent)} جارية` : 'ابدأ مهمة'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg">مهام اليوم</CardTitle>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="text-xs">
                عرض الكل
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <p className="text-sm text-muted-foreground mb-3">
                لا توجد مهام لليوم
              </p>
              <Link href="/tasks">
                <Button size="sm">إضافة مهمة</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {todayTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 md:p-4"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${task.isRunning ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                    <span className="font-medium text-sm md:text-base truncate">{task.title}</span>
                  </div>
                  {task.timeSpent > 0 && (
                    <span className="text-xs md:text-sm text-muted-foreground shrink-0 mr-2">
                      {formatTimeShort(task.timeSpent)}
                    </span>
                  )}
                </div>
              ))}
              {todayTasks.length > 5 && (
                <p className="text-center text-xs md:text-sm text-muted-foreground pt-2">
                  و {todayTasks.length - 5} مهام أخرى...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg">مشاريع الفيديو</CardTitle>
            <Link href="/content">
              <Button variant="ghost" size="sm" className="text-xs">
                عرض الكل
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <p className="text-sm text-muted-foreground mb-3">
                لا توجد مشاريع
              </p>
              <Link href="/content">
                <Button size="sm">إنشاء مشروع</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 3).map((project) => (
                <Link key={project.id} href={`/content/${project.id}`}>
                  <div className="rounded-lg border border-border p-3 md:p-4 hover:bg-accent/50 transition-colors">
                    <h3 className="font-semibold text-sm md:text-base mb-1 md:mb-2 truncate">{project.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                      <span>{project.scenes.length} مشهد</span>
                      {project.results.views > 0 && (
                        <span>{project.results.views.toLocaleString('ar-EG')} مشاهدة</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
