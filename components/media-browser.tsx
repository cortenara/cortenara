'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LocalFile,
  LocalFolder,
  isFileSystemAccessSupported,
  requestDirectoryAccess,
  scanDirectory,
  getFileUrl,
  revokeFileUrl,
  formatFileSize,
  storeDirectoryHandle,
  getStoredDirectoryHandle,
  verifyPermission,
} from '@/lib/file-system'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FolderOpen,
  Video,
  Music,
  Image,
  ChevronLeft,
  RefreshCw,
  X,
  Play,
  AlertTriangle,
  HardDrive,
  Folder,
  FileWarning,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaBrowserProps {
  onSelectFile?: (file: LocalFile) => void
  selectedFiles?: string[]
}

export function MediaBrowser({ onSelectFile, selectedFiles = [] }: MediaBrowserProps) {
  const [isSupported, setIsSupported] = useState(true)
  const [rootFolder, setRootFolder] = useState<LocalFolder | null>(null)
  const [currentFolder, setCurrentFolder] = useState<LocalFolder | null>(null)
  const [folderPath, setFolderPath] = useState<LocalFolder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<LocalFile | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    setIsSupported(isFileSystemAccessSupported())
    
    // Try to restore previous directory handle
    const restoreHandle = async () => {
      try {
        const handle = await getStoredDirectoryHandle()
        if (handle) {
          const hasPermission = await verifyPermission(handle)
          if (hasPermission) {
            setIsLoading(true)
            const folder = await scanDirectory(handle)
            setRootFolder(folder)
            setCurrentFolder(folder)
            setIsLoading(false)
          }
        }
      } catch {
        // Silent fail - user will need to select directory again
      }
    }
    
    restoreHandle()
  }, [])

  const handleSelectDirectory = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const handle = await requestDirectoryAccess()
      if (!handle) {
        setIsLoading(false)
        return
      }

      await storeDirectoryHandle(handle)
      const folder = await scanDirectory(handle)
      setRootFolder(folder)
      setCurrentFolder(folder)
      setFolderPath([])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!rootFolder?.handle) return
    setIsLoading(true)
    try {
      const folder = await scanDirectory(rootFolder.handle)
      setRootFolder(folder)
      // Navigate back to same path if possible
      let current = folder
      const newPath: LocalFolder[] = []
      for (const f of folderPath) {
        const found = current.folders.find(sub => sub.name === f.name)
        if (found) {
          newPath.push(found)
          current = found
        } else {
          break
        }
      }
      setFolderPath(newPath)
      setCurrentFolder(current)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToFolder = (folder: LocalFolder) => {
    setFolderPath([...folderPath, currentFolder!])
    setCurrentFolder(folder)
  }

  const navigateBack = () => {
    if (folderPath.length === 0) return
    const newPath = [...folderPath]
    const parent = newPath.pop()!
    setFolderPath(newPath)
    setCurrentFolder(parent)
  }

  const navigateToRoot = () => {
    setFolderPath([])
    setCurrentFolder(rootFolder)
  }

  const handlePreview = useCallback(async (file: LocalFile) => {
    setPreviewFile(file)
    try {
      const url = await getFileUrl(file.handle)
      setPreviewUrl(url)
    } catch {
      setError('فشل في تحميل الملف')
    }
  }, [])

  const closePreview = useCallback(() => {
    if (previewUrl) {
      revokeFileUrl(previewUrl)
    }
    setPreviewFile(null)
    setPreviewUrl(null)
  }, [previewUrl])

  const getFileIcon = (type: LocalFile['type']) => {
    switch (type) {
      case 'video':
        return <Video className="h-8 w-8 text-blue-500" />
      case 'audio':
        return <Music className="h-8 w-8 text-purple-500" />
      case 'image':
        return <Image className="h-8 w-8 text-green-500" />
      default:
        return <FileWarning className="h-8 w-8 text-gray-500" />
    }
  }

  if (!isSupported) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">المتصفح غير مدعوم</h3>
          <p className="text-muted-foreground text-sm">
            للأسف، متصفحك لا يدعم File System Access API.
            <br />
            جرب استخدام Chrome أو Edge أو Opera.
          </p>
        </div>
      </Card>
    )
  }

  if (!rootFolder) {
    return (
      <Card className="p-6 md:p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <HardDrive className="h-16 w-16 text-primary/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">اختر مجلد العمل</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md">
            اختر المجلد الذي يحتوي على ملفات الوسائط الخاصة بك.
            <br />
            الملفات ستبقى على جهازك ولن تُرفع.
          </p>
          {error && (
            <p className="text-destructive text-sm mb-4">{error}</p>
          )}
          <Button onClick={handleSelectDirectory} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                جاري المسح...
              </>
            ) : (
              <>
                <FolderOpen className="h-4 w-4 ml-2" />
                اختيار مجلد
              </>
            )}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={navigateToRoot}
          disabled={folderPath.length === 0}
        >
          <HardDrive className="h-4 w-4 ml-1" />
          <span className="hidden sm:inline">{rootFolder.name}</span>
        </Button>
        
        {folderPath.length > 0 && (
          <Button variant="ghost" size="sm" onClick={navigateBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="flex-1 text-sm text-muted-foreground truncate">
          {currentFolder?.path}
        </div>

        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>

        <Button variant="outline" size="sm" onClick={handleSelectDirectory}>
          <FolderOpen className="h-4 w-4 ml-1" />
          <span className="hidden sm:inline">تغيير</span>
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : currentFolder ? (
        <div className="space-y-4">
          {/* Folders */}
          {currentFolder.folders.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">المجلدات</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {currentFolder.folders.map((folder) => (
                  <button
                    key={folder.path}
                    onClick={() => navigateToFolder(folder)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-center"
                  >
                    <Folder className="h-10 w-10 text-amber-500" />
                    <span className="text-xs truncate w-full">{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {currentFolder.files.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                الملفات ({currentFolder.files.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {currentFolder.files.map((file) => {
                  const isSelected = selectedFiles.includes(file.path)
                  return (
                    <Card
                      key={file.path}
                      className={cn(
                        "cursor-pointer hover:shadow-md transition-all overflow-hidden",
                        isSelected && "ring-2 ring-primary"
                      )}
                      onClick={() => onSelectFile?.(file)}
                      onDoubleClick={() => handlePreview(file)}
                    >
                      <div className="aspect-video bg-muted flex items-center justify-center relative">
                        {getFileIcon(file.type)}
                        <button
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePreview(file)
                          }}
                        >
                          <Play className="h-8 w-8 text-white" />
                        </button>
                      </div>
                      <CardContent className="p-2">
                        <p className="text-xs font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {currentFolder.folders.length === 0 && currentFolder.files.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد ملفات وسائط في هذا المجلد</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => closePreview()}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-base truncate pr-8">
              {previewFile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {previewUrl && previewFile && (
              <div className="relative bg-black rounded-lg overflow-hidden">
                {previewFile.type === 'video' && (
                  <video
                    src={previewUrl}
                    controls
                    autoPlay
                    className="w-full max-h-[70vh]"
                  />
                )}
                {previewFile.type === 'audio' && (
                  <div className="p-8 flex flex-col items-center gap-4">
                    <Music className="h-24 w-24 text-purple-500" />
                    <audio src={previewUrl} controls autoPlay className="w-full" />
                  </div>
                )}
                {previewFile.type === 'image' && (
                  <img
                    src={previewUrl}
                    alt={previewFile.name}
                    className="w-full max-h-[70vh] object-contain"
                  />
                )}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatFileSize(previewFile?.size || 0)}</span>
              <span>{previewFile?.path}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
