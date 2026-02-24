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
