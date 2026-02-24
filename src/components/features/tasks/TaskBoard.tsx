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
        // 섹션 순서대로 재구성
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

  const totalCount = tasks.length
  const doneCount = tasks.filter((t) => t.status === 'done').length
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length
  const donePercent = totalCount > 0 ? (doneCount / totalCount) * 100 : 0
  const inProgressPercent = totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0

  return (
    <div className="flex flex-col h-full">
      {/* 진행률 */}
      {totalCount > 0 && (
        <div className="px-3 pt-3 pb-1">
          <div className="p-3 rounded-xl border border-cool/20 bg-cool/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-text-primary">진행률</span>
              <span className="text-sm font-bold text-cool">
                {Math.round(donePercent)}%
              </span>
            </div>
            <div className="flex overflow-hidden h-2 rounded-full bg-surface">
              <div
                className="h-full transition-all duration-300 bg-cool"
                style={{ width: `${donePercent}%` }}
              />
              <div
                className="h-full transition-all duration-300 bg-warm"
                style={{ width: `${inProgressPercent}%` }}
              />
            </div>
            <div className="flex gap-3 mt-2 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-cool" />
                완료 {doneCount}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-warm" />
                진행중 {inProgressCount}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-surface border border-surface-hover/50" />
                미완료 {totalCount - doneCount - inProgressCount}
              </span>
            </div>
          </div>
        </div>
      )}

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
