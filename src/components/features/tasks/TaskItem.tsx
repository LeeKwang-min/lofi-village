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
