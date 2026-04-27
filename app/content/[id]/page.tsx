'use client'

import { useEffect, useState, use } from 'react'
import { VideoProject, Scene } from '@/lib/types'
import { getProjects, saveProjects } from '@/lib/store'
import { LocalFile, formatFileSize } from '@/lib/file-system'
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
import { Label } from '@/components/ui/label'
import { ArrowRight, Plus, FileText, Film, BarChart3, Trash2, Save, Video, Music, Image, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MediaBrowser } from '@/components/media-browser'

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
  const [showMediaBrowser, setShowMediaBrowser] = useState(false)

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

  const handleAddSceneFromBrowser = (file: LocalFile) => {
    if (!project) return

    const scene: Scene = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type === 'other' ? 'video' : file.type,
      localPath: file.path,
      notes: `الحجم: ${formatFileSize(file.size)}`,
    }

    setProject({
      ...project,
      scenes: [...project.scenes, scene],
    })

    setShowMediaBrowser(false)
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
      <div className="flex h-[60vh] items-center justify-center">
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/content">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate">{project.name}</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              تم الإنشاء في {new Date(project.createdAt).toLocaleDateString('ar-EG')}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          <Save className="h-4 w-4 ml-2" />
          {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="script" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="script" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <FileText className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">السكريبت</span>
            <span className="sm:hidden">سكريبت</span>
          </TabsTrigger>
          <TabsTrigger value="scenes" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Film className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">المشاهد</span>
            <span className="sm:hidden">مشاهد</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">النتائج</span>
            <span className="sm:hidden">نتائج</span>
          </TabsTrigger>
        </TabsList>

        {/* Script Tab */}
        <TabsContent value="script" className="mt-4 md:mt-6 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">السكريبت</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={project.script}
                onChange={(e) => handleScriptChange(e.target.value)}
                placeholder="اكتب سكريبت الفيديو هنا..."
                className="min-h-[200px] md:min-h-[300px] resize-y text-sm md:text-base"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">المسودة والملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={project.draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                placeholder="اكتب مسودتك وملاحظاتك هنا..."
                className="min-h-[150px] md:min-h-[200px] resize-y text-sm md:text-base"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenes Tab */}
        <TabsContent value="scenes" className="mt-4 md:mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
              <CardTitle className="text-base md:text-lg">المشاهد والوسائط</CardTitle>
              <Dialog open={isAddSceneOpen} onOpenChange={setIsAddSceneOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مشهد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {showMediaBrowser ? 'اختر ملف من جهازك' : 'إضافة مشهد جديد'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {showMediaBrowser ? (
                    <div className="space-y-4 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowMediaBrowser(false)}
                      >
                        <ArrowRight className="h-4 w-4 ml-2" />
                        رجوع
                      </Button>
                      <MediaBrowser
                        onSelectFile={handleAddSceneFromBrowser}
                        selectedFiles={project.scenes.map(s => s.localPath)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4">
                      <Button
                        onClick={() => setShowMediaBrowser(true)}
                        variant="outline"
                        className="w-full h-24 flex flex-col items-center justify-center gap-2 border-dashed"
                      >
                        <FolderOpen className="h-8 w-8 text-primary" />
                        <span>تصفح ملفات جهازك</span>
                        <span className="text-xs text-muted-foreground">
                          الملفات تبقى على جهازك ولن ترفع
                        </span>
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {project.scenes.length === 0 ? (
                <div className="text-center py-8 md:py-12 text-muted-foreground">
                  <Film className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm md:text-base">لا توجد مشاهد. أضف مشهدك الأول!</p>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {project.scenes.map((scene, index) => {
                    const SceneIcon = sceneTypeConfig[scene.type].icon
                    return (
                      <div
                        key={scene.id}
                        className="flex items-center gap-2 md:gap-4 p-3 md:p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 text-primary font-medium text-xs md:text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="p-1.5 md:p-2 rounded-lg bg-muted shrink-0">
                          <SceneIcon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm md:text-base truncate">{scene.name}</h4>
                          <p className="text-xs text-muted-foreground truncate" dir="ltr">
                            {scene.localPath || 'لا يوجد مسار'}
                          </p>
                          {scene.notes && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {scene.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-muted shrink-0">
                          {sceneTypeConfig[scene.type].label}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive shrink-0 h-8 w-8"
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
        <TabsContent value="results" className="mt-4 md:mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">نتائج الفيديو</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="views" className="text-xs md:text-sm">المشاهدات</Label>
                  <Input
                    id="views"
                    type="number"
                    value={project.results.views}
                    onChange={(e) => handleResultsChange('views', parseInt(e.target.value) || 0)}
                    min={0}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="likes" className="text-xs md:text-sm">الإعجابات</Label>
                  <Input
                    id="likes"
                    type="number"
                    value={project.results.likes}
                    onChange={(e) => handleResultsChange('likes', parseInt(e.target.value) || 0)}
                    min={0}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="comments" className="text-xs md:text-sm">التعليقات</Label>
                  <Input
                    id="comments"
                    type="number"
                    value={project.results.comments}
                    onChange={(e) => handleResultsChange('comments', parseInt(e.target.value) || 0)}
                    min={0}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="shares" className="text-xs md:text-sm">المشاركات</Label>
                  <Input
                    id="shares"
                    type="number"
                    value={project.results.shares}
                    onChange={(e) => handleResultsChange('shares', parseInt(e.target.value) || 0)}
                    min={0}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="mt-4 md:mt-6 space-y-1.5 md:space-y-2">
                <Label htmlFor="resultNotes" className="text-xs md:text-sm">ملاحظات الأداء</Label>
                <Textarea
                  id="resultNotes"
                  value={project.results.notes || ''}
                  onChange={(e) => handleResultsChange('notes', e.target.value)}
                  placeholder="اكتب ملاحظاتك حول أداء الفيديو..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* Stats Summary */}
              <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3 text-sm md:text-base">ملخص الأداء</h4>
                <div className="grid grid-cols-4 gap-2 md:gap-4 text-center">
                  <div>
                    <p className="text-lg md:text-2xl font-bold">{project.results.views.toLocaleString('ar-EG')}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">مشاهدة</p>
                  </div>
                  <div>
                    <p className="text-lg md:text-2xl font-bold">{project.results.likes.toLocaleString('ar-EG')}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">إعجاب</p>
                  </div>
                  <div>
                    <p className="text-lg md:text-2xl font-bold">{project.results.comments.toLocaleString('ar-EG')}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">تعليق</p>
                  </div>
                  <div>
                    <p className="text-lg md:text-2xl font-bold">{project.results.shares.toLocaleString('ar-EG')}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">مشاركة</p>
                  </div>
                </div>
                {project.results.views > 0 && (
                  <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border">
                    <p className="text-xs md:text-sm text-muted-foreground">
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
