// Task Types
export type TaskCategory = 'today' | 'tomorrow' | 'week'

export interface Task {
  id: string
  title: string
  description?: string
  category: TaskCategory
  completed: boolean
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  timeSpent: number // in seconds
  isRunning: boolean
}

// Content Creation Types
export interface VideoProject {
  id: string
  name: string
  createdAt: Date
  script: string
  draft: string
  scenes: Scene[]
  results: VideoResults
}

export interface Scene {
  id: string
  name: string
  type: 'video' | 'audio' | 'image'
  localPath: string
  notes?: string
}

export interface VideoResults {
  views: number
  likes: number
  comments: number
  shares: number
  publishedAt?: Date
  notes?: string
}

// Stats
export interface DailyStats {
  date: string
  tasksCompleted: number
  totalTimeSpent: number // in seconds
  videosCreated: number
}
