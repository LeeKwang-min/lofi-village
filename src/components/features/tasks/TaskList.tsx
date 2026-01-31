import { useState, useEffect } from 'react'
import { Plus, Check, Trash2 } from 'lucide-react'

interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

const STORAGE_KEY = 'lofi-village-tasks'

// localStorage에서 할 일 목록 불러오기
function loadTasks(): Task[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  return []
}

// localStorage에 할 일 목록 저장
function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

// 고유 ID 생성
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

interface TaskListProps {
  isStandalone?: boolean  // 별도 창에서 사용할 때 true
}

export function TaskList({ isStandalone = false }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskText, setNewTaskText] = useState('')

  // 컴포넌트 마운트 시 할 일 목록 로드
  useEffect(() => {
    setTasks(loadTasks())
  }, [])

  // tasks가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (tasks.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      saveTasks(tasks)
    }
  }, [tasks])

  // 새 할 일 추가
  const addTask = () => {
    if (!newTaskText.trim()) return

    const newTask: Task = {
      id: generateId(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: Date.now()
    }

    setTasks((prev) => [...prev, newTask])
    setNewTaskText('')
  }

  // Enter 키로 할 일 추가
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask()
    }
  }

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    )
  }

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length

  return (
    <section className={`${isStandalone ? 'h-full flex flex-col' : 'p-4 rounded-xl border border-surface-hover/50 bg-surface/50'}`}>
      {!isStandalone && (
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2 items-center">
            <span className="text-xl">📝</span>
            <h2 className="text-sm font-semibold text-text-primary">오늘 할 일</h2>
          </div>
          {totalCount > 0 && (
            <span className="text-xs text-text-muted">
              {completedCount}/{totalCount} 완료
            </span>
          )}
        </div>
      )}

      {/* 진행률 (standalone 모드) */}
      {isStandalone && totalCount > 0 && (
        <div className="mb-4 p-3 rounded-xl border border-cool/20 bg-cool/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-text-primary">오늘의 진행률</span>
            <span className="text-sm text-cool font-bold">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-cool transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-text-muted">
            {completedCount}/{totalCount} 완료
          </p>
        </div>
      )}

      {/* 할 일 입력 */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="새로운 할 일..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border transition-colors border-surface-hover bg-background/50 text-text-primary placeholder:text-text-muted focus:border-warm/50 focus:outline-none focus:ring-1 focus:ring-warm/20"
        />
        <button
          onClick={addTask}
          disabled={!newTaskText.trim()}
          className="p-2 rounded-lg transition-colors bg-warm/20 text-warm hover:bg-warm/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* 할 일 목록 */}
      <div className={`overflow-y-auto space-y-2 custom-scrollbar ${isStandalone ? 'flex-1' : 'max-h-48'}`}>
        {tasks.length === 0 ? (
          <div className="flex gap-2 items-center p-2 rounded-lg bg-background/30">
            <div className="w-4 h-4 rounded-full border-2 border-cool/30" />
            <span className="text-sm text-text-muted">할 일을 추가해보세요</span>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-2 rounded-lg p-2 transition-colors ${
                task.completed ? 'bg-background/20' : 'bg-background/50 hover:bg-background/70'
              }`}
            >
              {/* 완료 체크박스 */}
              <button
                onClick={() => toggleTask(task.id)}
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                  task.completed
                    ? 'border-cool bg-cool text-background'
                    : 'border-cool/50 hover:border-cool'
                }`}
              >
                {task.completed && <Check size={12} />}
              </button>

              {/* 할 일 텍스트 */}
              <span
                className={`flex-1 text-sm transition-colors ${
                  task.completed ? 'text-text-muted line-through' : 'text-text-primary'
                }`}
              >
                {task.text}
              </span>

              {/* 삭제 버튼 */}
              <button
                onClick={() => deleteTask(task.id)}
                className="p-1 rounded opacity-0 transition-colors text-text-muted hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                style={{ opacity: 1 }} // 항상 보이게 (hover 효과는 나중에)
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
