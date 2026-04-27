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
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">صناعة المحتوى</h1>
          <p className="text-muted-foreground mt-1">إدارة مشاريع الفيديو الخاصة بك</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              مشروع جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
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
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مشاريع</h3>
            <p className="text-muted-foreground mb-4">
              ابدأ بإنشاء أول مشروع فيديو لك
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء مشروع
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <Card key={project.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="flex flex-col items-center">
                      <Eye className="h-4 w-4 text-muted-foreground mb-1" />
                      <span className="text-sm font-medium">{project.results.views}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <ThumbsUp className="h-4 w-4 text-muted-foreground mb-1" />
                      <span className="text-sm font-medium">{project.results.likes}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mb-1" />
                      <span className="text-sm font-medium">{project.results.comments}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Share2 className="h-4 w-4 text-muted-foreground mb-1" />
                      <span className="text-sm font-medium">{project.results.shares}</span>
                    </div>
                  </div>

                  {/* Progress indicators */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={project.script ? 'text-green-600' : ''}>
                      {project.script ? 'السكريبت جاهز' : 'السكريبت فارغ'}
                    </span>
                    <span>•</span>
                    <span>{project.scenes.length} مشهد</span>
                  </div>

                  <Link href={`/content/${project.id}`}>
                    <Button variant="outline" className="w-full mt-2">
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
