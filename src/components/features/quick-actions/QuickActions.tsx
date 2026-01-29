/**
 * 퀵 액션 버튼 컴포넌트
 * 할일 목록, 메모장 등 별도 창을 여는 큰 버튼들
 */

import { ListTodo, FileText } from 'lucide-react'

export function QuickActions() {
  const handleOpenTasks = () => {
    window.subWindowAPI?.open('tasks')
  }

  const handleOpenMemo = () => {
    window.subWindowAPI?.open('memo')
  }

  return (
    <section className="p-4 rounded-xl border border-surface-hover/50 bg-surface/50">
      <div className="flex gap-2 items-center mb-3">
        <span className="text-xl">🚀</span>
        <h2 className="text-sm font-semibold text-text-primary">빠른 실행</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* 오늘의 할 일 버튼 */}
        <button
          onClick={handleOpenTasks}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-cool/20 bg-cool/5 transition-all hover:bg-cool/10 hover:border-cool/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cool/20">
            <ListTodo size={24} className="text-cool" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">오늘의 할 일</p>
            <p className="text-xs text-text-muted">할 일 목록 열기</p>
          </div>
        </button>

        {/* 메모장 버튼 */}
        <button
          onClick={handleOpenMemo}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-warm/20 bg-warm/5 transition-all hover:bg-warm/10 hover:border-warm/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-warm/20">
            <FileText size={24} className="text-warm" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">메모장</p>
            <p className="text-xs text-text-muted">아이디어 기록</p>
          </div>
        </button>
      </div>
    </section>
  )
}
