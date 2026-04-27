'use client'

import { Task, VideoProject, TaskCategory } from './types'

const TASKS_KEY = 'productivity_tasks'
const PROJECTS_KEY = 'video_projects'
const USER_KEY = 'user_settings'

// Helper to check if we're on client
const isClient = typeof window !== 'undefined'

// Tasks Storage
export function getTasks(): Task[] {
  if (!isClient) return []
  const data = localStorage.getItem(TASKS_KEY)
  if (!data) return []
  const tasks = JSON.parse(data)
  return tasks.map((task: Task) => ({
    ...task,
    createdAt: new Date(task.createdAt),
    startedAt: task.startedAt ? new Date(task.startedAt) : undefined,
    completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
  }))
}

export function saveTasks(tasks: Task[]): void {
  if (!isClient) return
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

export function addTask(task: Task): void {
  const tasks = getTasks()
  tasks.push(task)
  saveTasks(tasks)
}

export function updateTask(taskId: string, updates: Partial<Task>): void {
  const tasks = getTasks()
  const index = tasks.findIndex(t => t.id === taskId)
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates }
    saveTasks(tasks)
  }
}

export function deleteTask(taskId: string): void {
  const tasks = getTasks().filter(t => t.id !== taskId)
  saveTasks(tasks)
}

export function moveTask(taskId: string, newCategory: TaskCategory): void {
  updateTask(taskId, { category: newCategory })
}

// Video Projects Storage
export function getProjects(): VideoProject[] {
  if (!isClient) return []
  const data = localStorage.getItem(PROJECTS_KEY)
  if (!data) return []
  const projects = JSON.parse(data)
  return projects.map((p: VideoProject) => ({
    ...p,
    createdAt: new Date(p.createdAt),
    results: {
      ...p.results,
      publishedAt: p.results.publishedAt ? new Date(p.results.publishedAt) : undefined,
    },
  }))
}

export function saveProjects(projects: VideoProject[]): void {
  if (!isClient) return
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}

export function addProject(project: VideoProject): void {
  const projects = getProjects()
  projects.push(project)
  saveProjects(projects)
}

export function updateProject(projectId: string, updates: Partial<VideoProject>): void {
  const projects = getProjects()
  const index = projects.findIndex(p => p.id === projectId)
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates }
    saveProjects(projects)
  }
}

export function deleteProject(projectId: string): void {
  const projects = getProjects().filter(p => p.id !== projectId)
  saveProjects(projects)
}

// User Settings
export interface UserSettings {
  name: string
}

export function getUserSettings(): UserSettings {
  if (!isClient) return { name: 'المستخدم' }
  const data = localStorage.getItem(USER_KEY)
  if (!data) return { name: 'المستخدم' }
  return JSON.parse(data)
}

export function saveUserSettings(settings: UserSettings): void {
  if (!isClient) return
  localStorage.setItem(USER_KEY, JSON.stringify(settings))
}

// Smart Task Migration - Move tomorrow tasks to today
export function migrateTasksDaily(): void {
  const tasks = getTasks()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const updatedTasks = tasks.map(task => {
    if (task.category === 'tomorrow') {
      const taskDate = new Date(task.createdAt)
      const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
      
      // If task was created before today, move it to today
      if (taskDay < today) {
        return { ...task, category: 'today' as TaskCategory }
      }
    }
    return task
  })
  
  saveTasks(updatedTasks)
}

// Calculate total time spent today
export function getTodayStats(): { tasksCompleted: number; totalTime: number } {
  const tasks = getTasks()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayTasks = tasks.filter(task => {
    if (task.completedAt) {
      const completedDate = new Date(task.completedAt)
      completedDate.setHours(0, 0, 0, 0)
      return completedDate.getTime() === today.getTime()
    }
    return false
  })
  
  return {
    tasksCompleted: todayTasks.length,
    totalTime: todayTasks.reduce((acc, task) => acc + task.timeSpent, 0),
  }
}
