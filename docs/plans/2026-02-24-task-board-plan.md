# Task Board (칸반 스타일 할 일 목록) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 단순 체크리스트 형태의 "오늘의 할 일"을 3-섹션 칸반 보드("할 일 목록")로 확장하고, DnD와 투두별 메모 기능을 추가한다.

**Architecture:** TaskContext로 상태를 중앙 관리하고, @dnd-kit으로 섹션 간/내 드래그 앤 드롭을 구현한다. 기존 localStorage 키를 유지하면서 데이터 마이그레이션을 자동 처리한다. EventContext 패턴을 따라 멀티 윈도우 동기화를 지원한다.

**Tech Stack:** React 18, @dnd-kit/core + @dnd-kit/sortable, Tailwind CSS, Lucide Icons, localStorage

**Design Doc:** `docs/plans/2026-02-24-task-board-design.md`

---

### Task 1: @dnd-kit 패키지 설치

**Files:**
- Modify: `package.json`

**Step 1: 패키지 설치**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Step 2: 빌드 검증**

```bash
npm run build
```
Expected: 빌드 성공, 에러 없음

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @dnd-kit packages for task board DnD"
```

---

### Task 2: TaskContext 생성 (상태 관리 + 마이그레이션)

**Files:**
- Create: `src/contexts/TaskContext.tsx`

**Step 1: TaskContext 작성**

EventContext 패턴을 따라 구현한다. 핵심 사항:
- `Task` 인터페이스: `{ id, text, status, description, createdAt, updatedAt }`
- `TaskStatus` 타입: `'todo' | 'in-progress' | 'done'`
- 마이그레이션: 기존 `completed: boolean` 형태 데이터를 자동 감지하여 변환
- `StorageEvent` + `focus` 이벤트로 멀티 윈도우 동기화
- `addTask` 콜백에서 localStorage 즉시 쓰기 (서브 윈도우 닫힘 대비)

```typescript
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

function migrateTasks(data: unknown[]): Task[] {
  return data.map((item: any) => {
    if ('status' in item) return item as Task
    // Legacy format
    const legacy = item as LegacyTask
    return {
      id: legacy.id,
      text: legacy.text,
      status: legacy.completed ? 'done' : 'todo' as TaskStatus,
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
    setTasks(reorderedTasks)
    saveTasks(reorderedTasks)
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
```

**Step 2: 빌드 검증**

```bash
npm run build
```
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add src/contexts/TaskContext.tsx
git commit -m "feat(tasks): add TaskContext with status model and data migration"
```

---

### Task 3: TaskItem 컴포넌트 생성

**Files:**
- Create: `src/components/features/tasks/TaskItem.tsx`

**Step 1: TaskItem 작성**

`useSortable` 훅을 사용한 드래그 가능한 투두 항목. 클릭 시 인라인 확장으로 메모 편집.

```typescript
import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ChevronDown, ChevronUp, Trash2, Circle, Loader, CheckCircle2 } from 'lucide-react'
import type { Task, TaskStatus } from '../../../contexts/TaskContext'

interface TaskItemProps {
  task: Task
  onUpdate: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  onDelete: (id: string) => void
  onMove: (id: string, newStatus: TaskStatus) => void
  isDragOverlay?: boolean
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  'todo': 'in-progress',
  'in-progress': 'done',
  'done': 'todo',
}

const StatusIcon = ({ status, onClick }: { status: TaskStatus; onClick: () => void }) => {
  const base = 'w-5 h-5 cursor-pointer transition-colors flex-shrink-0'
  switch (status) {
    case 'todo':
      return <Circle className={`${base} text-text-muted hover:text-cool`} onClick={onClick} size={18} />
    case 'in-progress':
      return <Loader className={`${base} text-warm hover:text-warm/80`} onClick={onClick} size={18} />
    case 'done':
      return <CheckCircle2 className={`${base} text-cool hover:text-cool/80`} onClick={onClick} size={18} />
  }
}

export function TaskItem({ task, onUpdate, onDelete, onMove, isDragOverlay }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descValue, setDescValue] = useState(task.description)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const handleStatusCycle = () => {
    onMove(task.id, STATUS_CYCLE[task.status])
  }

  const handleSaveDesc = () => {
    onUpdate(task.id, { description: descValue })
    setEditingDesc(false)
  }

  const handleDescKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDescValue(task.description)
      setEditingDesc(false)
    }
  }

  const wrapperClass = isDragOverlay
    ? 'rounded-lg border border-cool/30 bg-surface p-2 shadow-lg'
    : 'rounded-lg border border-surface-hover/30 bg-background/50 p-2 transition-colors hover:bg-background/70'

  return (
    <div ref={setNodeRef} style={style} className={wrapperClass}>
      <div className="flex items-center gap-2">
        {/* 드래그 핸들 */}
        <button
          className="cursor-grab touch-none text-text-muted/50 hover:text-text-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>

        {/* 상태 아이콘 */}
        <StatusIcon status={task.status} onClick={handleStatusCycle} />

        {/* 텍스트 */}
        <span
          className={`flex-1 text-sm ${
            task.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary'
          }`}
        >
          {task.text}
        </span>

        {/* 메모 표시 (디스크립션이 있으면 점 표시) */}
        {task.description && !expanded && (
          <span className="w-1.5 h-1.5 rounded-full bg-warm/60 flex-shrink-0" />
        )}

        {/* 확장 토글 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 rounded text-text-muted/50 hover:text-text-muted transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* 인라인 확장 영역 */}
      {expanded && (
        <div className="mt-2 ml-7 space-y-2">
          {/* 메모/디스크립션 */}
          {editingDesc ? (
            <div className="space-y-1">
              <textarea
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onBlur={handleSaveDesc}
                onKeyDown={handleDescKeyDown}
                autoFocus
                rows={3}
                placeholder="메모를 입력하세요..."
                className="w-full px-2 py-1.5 text-xs rounded border border-surface-hover bg-background/50 text-text-primary placeholder:text-text-muted/50 focus:border-warm/50 focus:outline-none focus:ring-1 focus:ring-warm/20 resize-none"
              />
              <p className="text-[10px] text-text-muted">Esc: 취소 | 바깥 클릭: 저장</p>
            </div>
          ) : (
            <div
              onClick={() => {
                setDescValue(task.description)
                setEditingDesc(true)
              }}
              className="px-2 py-1.5 text-xs rounded border border-dashed border-surface-hover/50 text-text-muted cursor-pointer hover:border-warm/30 hover:bg-warm/5 min-h-[2rem] transition-colors"
            >
              {task.description || '메모 추가...'}
            </div>
          )}

          {/* 삭제 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={() => onDelete(task.id)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded text-danger/70 hover:bg-danger/10 hover:text-danger transition-colors"
            >
              <Trash2 size={12} />
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: 빌드 검증**

```bash
npm run build
```
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add src/components/features/tasks/TaskItem.tsx
git commit -m "feat(tasks): add TaskItem component with DnD and inline memo"
```

---

### Task 4: TaskSection 컴포넌트 생성

**Files:**
- Create: `src/components/features/tasks/TaskSection.tsx`

**Step 1: TaskSection 작성**

`SortableContext`로 감싸는 드롭 영역. 섹션 헤더에 개수 + 접기/펼치기.

```typescript
import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { TaskItem } from './TaskItem'
import type { Task, TaskStatus } from '../../../contexts/TaskContext'

interface TaskSectionProps {
  status: TaskStatus
  tasks: Task[]
  onUpdate: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  onDelete: (id: string) => void
  onMove: (id: string, newStatus: TaskStatus) => void
}

const SECTION_CONFIG: Record<TaskStatus, { label: string; icon: string; color: string }> = {
  'todo': { label: '미완료', icon: '○', color: 'text-text-muted' },
  'in-progress': { label: '진행중', icon: '◐', color: 'text-warm' },
  'done': { label: '완료', icon: '●', color: 'text-cool' },
}

export function TaskSection({ status, tasks, onUpdate, onDelete, onMove }: TaskSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { setNodeRef, isOver } = useDroppable({ id: `section-${status}` })

  const config = SECTION_CONFIG[status]
  const taskIds = tasks.map((t) => t.id)

  return (
    <div className="space-y-1.5">
      {/* 섹션 헤더 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 w-full text-left group"
      >
        {collapsed ? (
          <ChevronRight size={14} className="text-text-muted/50" />
        ) : (
          <ChevronDown size={14} className="text-text-muted/50" />
        )}
        <span className={`text-sm ${config.color}`}>{config.icon}</span>
        <span className="text-xs font-medium text-text-primary">{config.label}</span>
        <span className="text-xs text-text-muted">({tasks.length})</span>
      </button>

      {/* 드롭 영역 */}
      {!collapsed && (
        <div
          ref={setNodeRef}
          className={`space-y-1.5 min-h-[2rem] rounded-lg p-1 transition-colors ${
            isOver ? 'bg-cool/10 ring-1 ring-cool/20' : ''
          }`}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onMove={onMove}
              />
            ))}
          </SortableContext>

          {tasks.length === 0 && (
            <div className={`rounded-lg border border-dashed border-surface-hover/30 p-3 text-center text-xs text-text-muted/50 transition-colors ${
              isOver ? 'border-cool/30 bg-cool/5' : ''
            }`}>
              {status === 'todo' ? '새 할 일을 추가하세요' : '여기로 드래그하세요'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

**Step 2: 빌드 검증**

```bash
npm run build
```
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add src/components/features/tasks/TaskSection.tsx
git commit -m "feat(tasks): add TaskSection component with droppable zone"
```

---

### Task 5: TaskBoard 컴포넌트 생성 (DnD 컨텍스트)

**Files:**
- Create: `src/components/features/tasks/TaskBoard.tsx`

**Step 1: TaskBoard 작성**

DndContext + DragOverlay로 전체 칸반 보드를 관리. 섹션 간 이동 + 섹션 내 재정렬 로직 포함.

```typescript
import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { TaskSection } from './TaskSection'
import { TaskItem } from './TaskItem'
import { useTask, type TaskStatus } from '../../../contexts/TaskContext'

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done']

export function TaskBoard() {
  const { tasks, addTask, updateTask, deleteTask, moveTask, reorderTasks } = useTask()
  const [newTaskText, setNewTaskText] = useState('')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => tasks.filter((t) => t.status === status),
    [tasks]
  )

  const findTaskStatus = (taskId: string): TaskStatus | undefined => {
    return tasks.find((t) => t.id === taskId)?.status
  }

  // 드롭 대상의 섹션 status를 결정
  const getDropStatus = (overId: string): TaskStatus | undefined => {
    // section-{status} 형태의 드롭 영역인 경우
    if (overId.startsWith('section-')) {
      return overId.replace('section-', '') as TaskStatus
    }
    // 다른 task 위에 드롭한 경우, 해당 task의 status
    return findTaskStatus(overId)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string)
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // DragOverlay가 시각적 피드백을 제공하므로 별도 처리 불필요
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTaskId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeStatus = findTaskStatus(activeId)
    const overStatus = getDropStatus(overId)

    if (!activeStatus || !overStatus) return

    if (activeStatus !== overStatus) {
      // 섹션 간 이동
      const updated = tasks.map((t) =>
        t.id === activeId ? { ...t, status: overStatus, updatedAt: Date.now() } : t
      )
      reorderTasks(updated)
    } else if (activeId !== overId && !overId.startsWith('section-')) {
      // 같은 섹션 내 재정렬
      const sectionTasks = getTasksByStatus(activeStatus)
      const oldIndex = sectionTasks.findIndex((t) => t.id === activeId)
      const newIndex = sectionTasks.findIndex((t) => t.id === overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(sectionTasks, oldIndex, newIndex)
        // 전체 tasks 배열에서 해당 섹션 부분만 교체
        const otherTasks = tasks.filter((t) => t.status !== activeStatus)
        const result = [...otherTasks]
        // 원래 순서를 유지하면서 해당 섹션 tasks를 올바른 위치에 삽입
        let insertIdx = 0
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].status === activeStatus) {
            insertIdx = result.findIndex(
              (t, idx) => idx >= insertIdx && tasks.indexOf(t) > i
            )
            if (insertIdx === -1) insertIdx = result.length
            break
          }
        }
        // 간단한 접근: 섹션 순서대로 재구성
        const rebuilt: typeof tasks = []
        for (const status of STATUSES) {
          if (status === activeStatus) {
            rebuilt.push(...reordered)
          } else {
            rebuilt.push(...tasks.filter((t) => t.status === status))
          }
        }
        reorderTasks(rebuilt)
      }
    }
  }

  const handleAddTask = () => {
    if (!newTaskText.trim()) return
    addTask(newTaskText)
    setNewTaskText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isComposing = e.nativeEvent.isComposing
    if (!isComposing && e.code === 'Enter') {
      handleAddTask()
    }
  }

  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null

  return (
    <div className="flex flex-col h-full">
      {/* 입력 영역 */}
      <div className="flex gap-2 p-3">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="새로운 할 일..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border transition-colors border-surface-hover bg-background/50 text-text-primary placeholder:text-text-muted focus:border-warm/50 focus:outline-none focus:ring-1 focus:ring-warm/20"
        />
        <button
          onClick={handleAddTask}
          disabled={!newTaskText.trim()}
          className="p-2 rounded-lg transition-colors bg-warm/20 text-warm hover:bg-warm/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* 칸반 섹션들 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {STATUSES.map((status) => (
            <TaskSection
              key={status}
              status={status}
              tasks={getTasksByStatus(status)}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onMove={moveTask}
            />
          ))}

          <DragOverlay>
            {activeTask ? (
              <TaskItem
                task={activeTask}
                onUpdate={() => {}}
                onDelete={() => {}}
                onMove={() => {}}
                isDragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
```

**Step 2: 빌드 검증**

```bash
npm run build
```
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add src/components/features/tasks/TaskBoard.tsx
git commit -m "feat(tasks): add TaskBoard with DnD context and kanban layout"
```

---

### Task 6: TaskList 수정 (컴팩트 뷰 + TaskContext 사용)

**Files:**
- Modify: `src/components/features/tasks/TaskList.tsx`

**Step 1: TaskList를 컴팩트 요약 뷰로 전환**

기존 독립적인 상태 관리를 제거하고 TaskContext를 사용하도록 변경. `isStandalone` 모드에서는 TaskBoard를 렌더링하고, 메인 앱에서는 상태별 개수 요약을 표시.

```typescript
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTask } from '../../../contexts/TaskContext'
import { TaskBoard } from './TaskBoard'

interface TaskListProps {
  isStandalone?: boolean
}

export function TaskList({ isStandalone = false }: TaskListProps) {
  const { tasks, addTask } = useTask()
  const [newTaskText, setNewTaskText] = useState('')

  const todoCount = tasks.filter((t) => t.status === 'todo').length
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length
  const doneCount = tasks.filter((t) => t.status === 'done').length
  const totalCount = tasks.length

  // Standalone 모드: TaskBoard 전체 렌더링
  if (isStandalone) {
    return <TaskBoard />
  }

  // 메인 앱 컴팩트 뷰
  const handleAddTask = () => {
    if (!newTaskText.trim()) return
    addTask(newTaskText)
    setNewTaskText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isComposing = e.nativeEvent.isComposing
    if (!isComposing && e.code === 'Enter') {
      handleAddTask()
    }
  }

  return (
    <section className="p-4 rounded-xl border border-surface-hover/50 bg-surface/50">
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2 items-center">
          <span className="text-xl">📋</span>
          <h2 className="text-sm font-semibold text-text-primary">할 일 목록</h2>
        </div>
        {totalCount > 0 && (
          <div className="flex gap-2 text-xs text-text-muted">
            <span>미완료 {todoCount}</span>
            <span className="text-text-muted/30">|</span>
            <span className="text-warm">진행중 {inProgressCount}</span>
            <span className="text-text-muted/30">|</span>
            <span className="text-cool">완료 {doneCount}</span>
          </div>
        )}
      </div>

      {/* 빠른 추가 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="새로운 할 일..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border transition-colors border-surface-hover bg-background/50 text-text-primary placeholder:text-text-muted focus:border-warm/50 focus:outline-none focus:ring-1 focus:ring-warm/20"
        />
        <button
          onClick={handleAddTask}
          disabled={!newTaskText.trim()}
          className="p-2 rounded-lg transition-colors bg-warm/20 text-warm hover:bg-warm/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </div>
    </section>
  )
}
```

**Step 2: barrel export 업데이트**

`src/components/features/tasks/index.ts`:

```typescript
export { TaskList } from './TaskList'
export { TaskBoard } from './TaskBoard'
```

**Step 3: 빌드 검증**

```bash
npm run build
```
Expected: 빌드 성공

**Step 4: Commit**

```bash
git add src/components/features/tasks/
git commit -m "feat(tasks): refactor TaskList to use TaskContext with compact summary view"
```

---

### Task 7: App.tsx 수정 (TaskProvider + 명칭 변경)

**Files:**
- Modify: `src/App.tsx`

**Step 1: App.tsx 수정**

변경 내역:
1. `TaskProvider` import 추가
2. `MainApp`에서 `TaskProvider`로 감싸기 (QuickActions 내 TaskList가 context 사용)
3. `TasksWindow`에서 `TaskProvider`로 감싸기
4. SubWindowShell 타이틀을 `"할 일 목록"`으로 변경
5. 이모지를 `"📋"`로 변경

**App.tsx에서 변경할 부분들:**

import 추가:
```typescript
import { TaskProvider } from './contexts/TaskContext'
```

MainApp 함수 내 Provider 추가 (기존 AlarmProvider 안쪽):
```tsx
<AlarmProvider>
  <TaskProvider>
    <ReminderWrapper>
      ...
    </ReminderWrapper>
  </TaskProvider>
</AlarmProvider>
```

TasksWindow 함수 변경:
```tsx
function TasksWindow() {
  return (
    <TaskProvider>
      <SubWindowShell title="할 일 목록" emoji="📋">
        <TaskList isStandalone />
      </SubWindowShell>
    </TaskProvider>
  )
}
```

**Step 2: 빌드 검증**

```bash
npm run build
```
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(tasks): integrate TaskProvider and rename to 할 일 목록"
```

---

### Task 8: electron/main.ts 수정 (SubWindow 설정)

**Files:**
- Modify: `electron/main.ts:49-53`

**Step 1: SubWindow 설정 변경**

```typescript
const SUB_WINDOW_CONFIGS: Record<SubWindowType, SubWindowConfig> = {
  tasks: { title: '할 일 목록', width: 480, height: 600 },
  history: { title: '집중 기록', width: 450, height: 600 },
  memo: { title: '메모장', width: 400, height: 500 },
  schedule: { title: '일정 추가', width: 400, height: 620 },
}
```

**Step 2: 빌드 검증**

```bash
npm run build
```
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add electron/main.ts
git commit -m "feat(tasks): update sub-window config for task board size"
```

---

### Task 9: QuickActions 텍스트 변경

**Files:**
- Modify: `src/components/features/quick-actions/QuickActions.tsx:29-30`

**Step 1: 텍스트 변경**

```tsx
{/* 변경 전 */}
<p className="text-sm font-medium text-text-primary">오늘의 할 일</p>
<p className="text-xs text-text-muted">할 일 목록 열기</p>

{/* 변경 후 */}
<p className="text-sm font-medium text-text-primary">할 일 목록</p>
<p className="text-xs text-text-muted">칸반 보드 열기</p>
```

**Step 2: 빌드 검증**

```bash
npm run build
```
Expected: 빌드 성공

**Step 3: Commit**

```bash
git add src/components/features/quick-actions/QuickActions.tsx
git commit -m "feat(tasks): update quick actions button text"
```

---

### Task 10: 통합 검증

**Step 1: 전체 빌드**

```bash
npm run build
```
Expected: 빌드 성공

**Step 2: dev 모드 실행 및 수동 검증**

```bash
npm run dev
```

검증 체크리스트:
- [ ] 메인 앱에서 "할 일 목록" 카드가 상태별 개수(미완료/진행중/완료)를 표시하는지
- [ ] 메인 앱에서 빠른 추가로 할 일이 추가되는지
- [ ] QuickActions 버튼이 "할 일 목록"으로 표시되는지
- [ ] SubWindow가 "할 일 목록" 타이틀로 열리는지
- [ ] SubWindow 크기가 480x600인지
- [ ] 3개 섹션(미완료/진행중/완료)이 표시되는지
- [ ] DnD로 섹션 간 이동이 되는지
- [ ] DnD로 섹션 내 순서 변경이 되는지
- [ ] 상태 아이콘 클릭으로 미완료→진행중→완료 순환되는지
- [ ] 항목 확장 시 메모 편집이 되는지
- [ ] 삭제가 정상 동작하는지
- [ ] 기존 데이터(completed: boolean) 마이그레이션이 정상인지
- [ ] 메인↔서브 윈도우 간 데이터 동기화가 되는지

**Step 3: 최종 Commit**

```bash
git add -A
git commit -m "feat(tasks): complete task board kanban implementation"
```
