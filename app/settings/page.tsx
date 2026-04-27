'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getUserSettings, saveUserSettings, getTasks, getProjects, saveTasks, saveProjects } from '@/lib/store'
import { Trash2, Save, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function SettingsPage() {
  const [userName, setUserName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({ tasks: 0, projects: 0 })

  useEffect(() => {
    setMounted(true)
    setUserName(getUserSettings().name)
    setStats({
      tasks: getTasks().length,
      projects: getProjects().length,
    })
  }, [])

  const handleSave = () => {
    setIsSaving(true)
    saveUserSettings({ name: userName })
    setTimeout(() => setIsSaving(false), 500)
  }

  const handleClearTasks = () => {
    saveTasks([])
    setStats(prev => ({ ...prev, tasks: 0 }))
  }

  const handleClearProjects = () => {
    saveProjects([])
    setStats(prev => ({ ...prev, projects: 0 }))
  }

  const handleClearAll = () => {
    saveTasks([])
    saveProjects([])
    setStats({ tasks: 0, projects: 0 })
  }

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">إدارة حسابك وتفضيلاتك</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>الملف الشخصي</CardTitle>
          <CardDescription>معلوماتك الشخصية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم</Label>
            <Input
              id="name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="أدخل اسمك"
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 ml-2" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </CardContent>
      </Card>

      {/* Data Stats */}
      <Card>
        <CardHeader>
          <CardTitle>إحصائيات البيانات</CardTitle>
          <CardDescription>ملخص البيانات المحفوظة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{stats.tasks}</p>
              <p className="text-sm text-muted-foreground">مهمة محفوظة</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{stats.projects}</p>
              <p className="text-sm text-muted-foreground">مشروع فيديو</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            منطقة الخطر
          </CardTitle>
          <CardDescription>
            هذه الإجراءات لا يمكن التراجع عنها
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <p className="font-medium">حذف جميع المهام</p>
              <p className="text-sm text-muted-foreground">سيتم حذف {stats.tasks} مهمة</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف جميع المهام نهائياً. لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearTasks} className="bg-destructive text-white hover:bg-destructive/90">
                    حذف الكل
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <p className="font-medium">حذف جميع المشاريع</p>
              <p className="text-sm text-muted-foreground">سيتم حذف {stats.projects} مشروع</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف جميع مشاريع الفيديو نهائياً. لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearProjects} className="bg-destructive text-white hover:bg-destructive/90">
                    حذف الكل
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
            <div>
              <p className="font-medium text-destructive">حذف جميع البيانات</p>
              <p className="text-sm text-muted-foreground">مسح كل البيانات والبدء من جديد</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف الكل
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تحذير!</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف جميع المهام والمشاريع نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-white hover:bg-destructive/90">
                    حذف كل البيانات
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
