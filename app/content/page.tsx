'use client'

import { useEffect, useState } from 'react'
import { VideoProject } from '@/lib/types'
import { getProjects, saveProjects } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, FolderOpen, Video, Trash2, Eye, ThumbsUp, MessageSquare, Share2 } from 'lucide-react'
import Link from 'next/link'

export default function ContentPage() {
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setProjects(getProjects())
  }, [])

  const handleAddProject = () => {
    if (!newProjectName.trim()) return

    const newProject: VideoProject = {
      id: crypto.randomUUID(),
      name: newProjectName.trim(),
      createdAt: new Date(),
      script: '',
      draft: '',
      scenes: [],
      results: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      },
    }

    const updated = [...projects, newProject]
    setProjects(updated)
    saveProjects(updated)
    setNewProjectName('')
    setIsAddDialogOpen(false)
  }

  const handleDeleteProject = (projectId: string) => {
    const updated = projects.filter(p => p.id !== projectId)
    setProjects(updated)
    saveProjects(updated)
  }

  if (!mounted) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">صناعة المحتوى</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة مشاريع الفيديو</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 ml-2" />
              مشروع جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>إنشاء مشروع فيديو جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المشروع</Label>
                <Input
                  id="name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="مثال: فيديو 1، مقدمة القناة..."
                />
              </div>
              <Button onClick={handleAddProject} className="w-full">
                إنشاء المشروع
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="p-8 md:p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <FolderOpen className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">لا توجد مشاريع</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ابدأ بإنشاء أول مشروع فيديو لك
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء مشروع
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <Card key={project.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 md:pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div className="p-1.5 md:p-2 rounded-lg bg-primary/10 shrink-0">
                      <Video className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm md:text-lg truncate">{project.name}</CardTitle>
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive h-7 w-7 md:h-8 md:w-8 shrink-0"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-1 md:gap-2 text-center">
                    <div className="flex flex-col items-center">
                      <Eye className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground mb-0.5" />
                      <span className="text-xs md:text-sm font-medium">{project.results.views}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <ThumbsUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground mb-0.5" />
                      <span className="text-xs md:text-sm font-medium">{project.results.likes}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <MessageSquare className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground mb-0.5" />
                      <span className="text-xs md:text-sm font-medium">{project.results.comments}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Share2 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground mb-0.5" />
                      <span className="text-xs md:text-sm font-medium">{project.results.shares}</span>
                    </div>
                  </div>

                  {/* Progress indicators */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] md:text-xs text-muted-foreground">
                    <span className={project.script ? 'text-green-600' : ''}>
                      {project.script ? 'السكريبت جاهز' : 'السكريبت فارغ'}
                    </span>
                    <span>-</span>
                    <span>{project.scenes.length} مشهد</span>
                  </div>

                  <Link href={`/content/${project.id}`}>
                    <Button variant="outline" className="w-full mt-2 text-xs md:text-sm h-8 md:h-9">
                      فتح المشروع
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
