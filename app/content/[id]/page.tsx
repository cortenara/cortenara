'use client'

import { useEffect, useState, use } from 'react'
import { VideoProject, Scene } from '@/lib/types'
import { getProjects, saveProjects } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowRight, Plus, FileText, Film, BarChart3, Trash2, Save, Video, Music, Image } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type SceneType = 'video' | 'audio' | 'image'

const sceneTypeConfig: Record<SceneType, { label: string; icon: typeof Video }> = {
  video: { label: 'فيديو', icon: Video },
  audio: { label: 'صوت', icon: Music },
  image: { label: 'صورة', icon: Image },
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [project, setProject] = useState<VideoProject | null>(null)
  const [allProjects, setAllProjects] = useState<VideoProject[]>([])
  const [mounted, setMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddSceneOpen, setIsAddSceneOpen] = useState(false)
  const [newScene, setNewScene] = useState({
    name: '',
    type: 'video' as SceneType,
    localPath: '',
    notes: '',
  })

  useEffect(() => {
    setMounted(true)
    const projects = getProjects()
    setAllProjects(projects)
    const found = projects.find(p => p.id === resolvedParams.id)
    if (found) {
      setProject(found)
    }
  }, [resolvedParams.id])

  const handleSave = () => {
    if (!project) return
    setIsSaving(true)
    
    const updated = allProjects.map(p =>
      p.id === project.id ? project : p
    )
    saveProjects(updated)
    setAllProjects(updated)
    
    setTimeout(() => setIsSaving(false), 500)
  }

  const handleScriptChange = (script: string) => {
    if (!project) return
    setProject({ ...project, script })
  }

  const handleDraftChange = (draft: string) => {
    if (!project) return
    setProject({ ...project, draft })
  }

  const handleResultsChange = (field: keyof VideoProject['results'], value: number | string) => {
    if (!project) return
    setProject({
      ...project,
      results: { ...project.results, [field]: value },
    })
  }

  const handleAddScene = () => {
    if (!project || !newScene.name.trim()) return

    const scene: Scene = {
      id: crypto.randomUUID(),
      name: newScene.name.trim(),
      type: newScene.type,
      localPath: newScene.localPath.trim(),
      notes: newScene.notes.trim() || undefined,
    }

    setProject({
      ...project,
      scenes: [...project.scenes, scene],
    })

    setNewScene({ name: '', type: 'video', localPath: '', notes: '' })
    setIsAddSceneOpen(false)
  }

  const handleDeleteScene = (sceneId: string) => {
    if (!project) return
    setProject({
      ...project,
      scenes: project.scenes.filter(s => s.id !== sceneId),
    })
  }

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-xl font-semibold mb-4">المشروع غير موجود</h2>
        <Button onClick={() => router.push('/content')}>
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للمشاريع
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/content">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              تم الإنشاء في {new Date(project.createdAt).toLocaleDateString('ar-EG')}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 ml-2" />
          {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="script" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="script" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            السكريبت
          </TabsTrigger>
          <TabsTrigger value="scenes" className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            المشاهد
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            النتائج
          </TabsTrigger>
        </TabsList>

        {/* Script Tab */}
        <TabsContent value="script" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>السكريبت</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={project.script}
                onChange={(e) => handleScriptChange(e.target.value)}
                placeholder="اكتب سكريبت الفيديو هنا..."
                className="min-h-[300px] resize-y"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>المسودة والملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={project.draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                placeholder="اكتب مسودتك وملاحظاتك هنا..."
                className="min-h-[200px] resize-y"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenes Tab */}
        <TabsContent value="scenes" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>المشاهد والوسائط</CardTitle>
              <Dialog open={isAddSceneOpen} onOpenChange={setIsAddSceneOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مشهد
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة مشهد جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="sceneName">اسم المشهد</Label>
                      <Input
                        id="sceneName"
                        value={newScene.name}
                        onChange={(e) => setNewScene({ ...newScene, name: e.target.value })}
                        placeholder="مثال: مقدمة، لقطة 1..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sceneType">نوع الملف</Label>
                      <Select
                        value={newScene.type}
                        onValueChange={(v) => setNewScene({ ...newScene, type: v as SceneType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">فيديو</SelectItem>
                          <SelectItem value="audio">صوت</SelectItem>
                          <SelectItem value="image">صورة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="localPath">مسار الملف على الجهاز</Label>
                      <Input
                        id="localPath"
                        value={newScene.localPath}
                        onChange={(e) => setNewScene({ ...newScene, localPath: e.target.value })}
                        placeholder="مثال: C:\Videos\clip1.mp4"
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground">
                        هذا المسار للرجوع إليه فقط - الملف لن يُرفع
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sceneNotes">ملاحظات (اختياري)</Label>
                      <Textarea
                        id="sceneNotes"
                        value={newScene.notes}
                        onChange={(e) => setNewScene({ ...newScene, notes: e.target.value })}
                        placeholder="أي ملاحظات إضافية..."
                        rows={2}
                      />
                    </div>
                    <Button onClick={handleAddScene} className="w-full">
                      إضافة المشهد
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {project.scenes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد مشاهد. أضف مشهدك الأول!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.scenes.map((scene, index) => {
                    const SceneIcon = sceneTypeConfig[scene.type].icon
                    return (
                      <div
                        key={scene.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                          {index + 1}
                        </div>
                        <div className="p-2 rounded-lg bg-muted">
                          <SceneIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{scene.name}</h4>
                          <p className="text-sm text-muted-foreground truncate" dir="ltr">
                            {scene.localPath || 'لا يوجد مسار'}
                          </p>
                          {scene.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {scene.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted">
                          {sceneTypeConfig[scene.type].label}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteScene(scene.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>نتائج الفيديو</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="views">عدد المشاهدات</Label>
                  <Input
                    id="views"
                    type="number"
                    value={project.results.views}
                    onChange={(e) => handleResultsChange('views', parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="likes">عدد الإعجابات</Label>
                  <Input
                    id="likes"
                    type="number"
                    value={project.results.likes}
                    onChange={(e) => handleResultsChange('likes', parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comments">عدد التعليقات</Label>
                  <Input
                    id="comments"
                    type="number"
                    value={project.results.comments}
                    onChange={(e) => handleResultsChange('comments', parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shares">عدد المشاركات</Label>
                  <Input
                    id="shares"
                    type="number"
                    value={project.results.shares}
                    onChange={(e) => handleResultsChange('shares', parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="resultNotes">ملاحظات الأداء</Label>
                <Textarea
                  id="resultNotes"
                  value={project.results.notes || ''}
                  onChange={(e) => handleResultsChange('notes', e.target.value)}
                  placeholder="اكتب ملاحظاتك حول أداء الفيديو..."
                  rows={4}
                />
              </div>

              {/* Stats Summary */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3">ملخص الأداء</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{project.results.views.toLocaleString('ar-EG')}</p>
                    <p className="text-xs text-muted-foreground">مشاهدة</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{project.results.likes.toLocaleString('ar-EG')}</p>
                    <p className="text-xs text-muted-foreground">إعجاب</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{project.results.comments.toLocaleString('ar-EG')}</p>
                    <p className="text-xs text-muted-foreground">تعليق</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{project.results.shares.toLocaleString('ar-EG')}</p>
                    <p className="text-xs text-muted-foreground">مشاركة</p>
                  </div>
                </div>
                {project.results.views > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      نسبة التفاعل:{' '}
                      <span className="font-medium text-foreground">
                        {((project.results.likes + project.results.comments) / project.results.views * 100).toFixed(2)}%
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
