'use client'

export interface LocalFile {
  name: string
  path: string
  type: 'video' | 'audio' | 'image' | 'other'
  size: number
  lastModified: Date
  handle: FileSystemFileHandle
}

export interface LocalFolder {
  name: string
  path: string
  files: LocalFile[]
  folders: LocalFolder[]
  handle: FileSystemDirectoryHandle
}

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.wmv', '.flv']
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.aac', '.ogg', '.m4a', '.flac', '.wma']
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']

export function getFileType(filename: string): LocalFile['type'] {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video'
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio'
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  return 'other'
}

export function isMediaFile(filename: string): boolean {
  const type = getFileType(filename)
  return type !== 'other'
}

// Check if File System Access API is supported
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

// Request directory access
export async function requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API غير مدعوم في هذا المتصفح')
  }

  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read',
    })
    return dirHandle
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return null // User cancelled
    }
    throw error
  }
}

// Scan directory for media files
export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  path: string = '',
  depth: number = 0,
  maxDepth: number = 3
): Promise<LocalFolder> {
  const folder: LocalFolder = {
    name: dirHandle.name,
    path: path || dirHandle.name,
    files: [],
    folders: [],
    handle: dirHandle,
  }

  if (depth >= maxDepth) return folder

  try {
    for await (const entry of dirHandle.values()) {
      const entryPath = path ? `${path}/${entry.name}` : entry.name

      if (entry.kind === 'file') {
        if (isMediaFile(entry.name)) {
          const fileHandle = entry as FileSystemFileHandle
          try {
            const file = await fileHandle.getFile()
            folder.files.push({
              name: entry.name,
              path: entryPath,
              type: getFileType(entry.name),
              size: file.size,
              lastModified: new Date(file.lastModified),
              handle: fileHandle,
            })
          } catch {
            // Skip files we can't access
          }
        }
      } else if (entry.kind === 'directory') {
        const subDirHandle = entry as FileSystemDirectoryHandle
        const subFolder = await scanDirectory(subDirHandle, entryPath, depth + 1, maxDepth)
        if (subFolder.files.length > 0 || subFolder.folders.length > 0) {
          folder.folders.push(subFolder)
        }
      }
    }
  } catch {
    // Skip directories we can't access
  }

  // Sort files by name
  folder.files.sort((a, b) => a.name.localeCompare(b.name, 'ar'))
  folder.folders.sort((a, b) => a.name.localeCompare(b.name, 'ar'))

  return folder
}

// Get file URL for preview (creates object URL)
export async function getFileUrl(fileHandle: FileSystemFileHandle): Promise<string> {
  const file = await fileHandle.getFile()
  return URL.createObjectURL(file)
}

// Revoke file URL to free memory
export function revokeFileUrl(url: string): void {
  URL.revokeObjectURL(url)
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت'
  const k = 1024
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get thumbnail for video (first frame)
export async function getVideoThumbnail(fileHandle: FileSystemFileHandle): Promise<string | null> {
  return new Promise(async (resolve) => {
    try {
      const file = await fileHandle.getFile()
      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.src = url
      video.muted = true
      video.preload = 'metadata'

      video.onloadeddata = () => {
        video.currentTime = 1 // Seek to 1 second
      }

      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7)
          URL.revokeObjectURL(url)
          resolve(thumbnail)
        } else {
          URL.revokeObjectURL(url)
          resolve(null)
        }
      }

      video.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }

      // Timeout after 5 seconds
      setTimeout(() => {
        URL.revokeObjectURL(url)
        resolve(null)
      }, 5000)
    } catch {
      resolve(null)
    }
  })
}

// Storage key for directory handle
const DIRECTORY_HANDLE_KEY = 'media_directory_handle'

// Store directory handle for persistence (requires user gesture to restore)
export async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  if ('indexedDB' in window) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FileHandles', 1)
      
      request.onerror = () => reject(request.error)
      
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles')
        }
      }
      
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('handles', 'readwrite')
        const store = tx.objectStore('handles')
        store.put(handle, DIRECTORY_HANDLE_KEY)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }
    })
  }
}

// Retrieve stored directory handle
export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if ('indexedDB' in window) {
    return new Promise((resolve) => {
      const request = indexedDB.open('FileHandles', 1)
      
      request.onerror = () => resolve(null)
      
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles')
        }
      }
      
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('handles', 'readonly')
        const store = tx.objectStore('handles')
        const getRequest = store.get(DIRECTORY_HANDLE_KEY)
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result || null)
        }
        getRequest.onerror = () => resolve(null)
      }
    })
  }
  return null
}

// Verify we still have permission to access the directory
export async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    const permission = await handle.queryPermission({ mode: 'read' })
    if (permission === 'granted') return true
    
    const requestResult = await handle.requestPermission({ mode: 'read' })
    return requestResult === 'granted'
  } catch {
    return false
  }
}
