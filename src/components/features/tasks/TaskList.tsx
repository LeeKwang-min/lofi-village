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
