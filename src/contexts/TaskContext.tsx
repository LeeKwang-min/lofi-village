/**
 * Task Context Provider
 * 칸반 태스크 상태를 전역에서 관리 (멀티윈도우 동기화 포함)
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  text: string
  status: TaskStatus
  description: string
  createdAt: number
  updatedAt: number
}

interface TaskContextType {
  tasks: Task[]
  addTask: (text: string) => void
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, newStatus: TaskStatus) => void
  reorderTasks: (reorderedTasks: Task[]) => void
  getTasksByStatus: (status: TaskStatus) => Task[]
}

const TaskContext = createContext<TaskContextType | null>(null)

const STORAGE_KEY = 'lofi-village-tasks'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// 기존 데이터 마이그레이션 (completed: boolean → status: TaskStatus)
interface LegacyTask {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

function isNewFormatTask(item: unknown): item is Task {
  return typeof item === 'object' && item !== null && 'status' in item
}

function isLegacyTask(item: unknown): item is LegacyTask {
  return typeof item === 'object' && item !== null && 'completed' in item && !('status' in item)
}

function migrateTasks(data: unknown[]): Task[] {
  return data.filter((item) => isNewFormatTask(item) || isLegacyTask(item)).map((item) => {
    if (isNewFormatTask(item)) return item
    const legacy = item as LegacyTask
    return {
      id: legacy.id,
      text: legacy.text,
      status: (legacy.completed ? 'done' : 'todo') as TaskStatus,
      description: '',
      createdAt: legacy.createdAt,
      updatedAt: legacy.createdAt,
    }
  })
}

function loadTasks(): Task[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return migrateTasks(parsed)
  } catch {
    return []
  }
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())

  // tasks 변경 시 localStorage 저장
  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  // 다른 윈도우의 storage 변경 감지
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setTasks(migrateTasks(JSON.parse(e.newValue)))
        } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 윈도우 포커스 시 localStorage에서 리로드
  useEffect(() => {
    const handleFocus = () => {
      setTasks(loadTasks())
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const addTask = useCallback((text: string) => {
    if (!text.trim()) return
    const now = Date.now()
    const newTask: Task = {
      id: generateId(),
      text: text.trim(),
      status: 'todo',
      description: '',
      createdAt: now,
      updatedAt: now,
    }
    setTasks((prev) => {
      const updated = [...prev, newTask]
      saveTasks(updated) // 즉시 저장 (서브 윈도우 닫힘 대비)
      return updated
    })
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks((prev) => {
      const updated = prev.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: Date.now() } : task
      )
      saveTasks(updated)
      return updated
    })
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const updated = prev.filter((task) => task.id !== id)
      saveTasks(updated)
      return updated
    })
  }, [])

  const moveTask = useCallback((id: string, newStatus: TaskStatus) => {
    setTasks((prev) => {
      const updated = prev.map((task) =>
        task.id === id ? { ...task, status: newStatus, updatedAt: Date.now() } : task
      )
      saveTasks(updated)
      return updated
    })
  }, [])

  const reorderTasks = useCallback((reorderedTasks: Task[]) => {
    setTasks(() => {
      saveTasks(reorderedTasks)
      return reorderedTasks
    })
  }, [])

  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks.filter((task) => task.status === status)
  }, [tasks])

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, moveTask, reorderTasks, getTasksByStatus }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTask() {
  const context = useContext(TaskContext)
  if (!context) throw new Error('useTask must be used within a TaskProvider')
  return context
}
