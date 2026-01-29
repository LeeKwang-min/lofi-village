/**
 * 서브 윈도우용 레이아웃 쉘
 * 별도 창(할일, 집중기록)에서 사용하는 간소화된 레이아웃
 */

import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface SubWindowShellProps {
  title: string
  emoji: string
  children: ReactNode
}

export function SubWindowShell({ title, emoji, children }: SubWindowShellProps) {
  const handleClose = () => {
    window.subWindowAPI?.closeSelf()
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 타이틀 바 */}
      <div
        className="flex justify-between items-center px-4 h-12 border-b shrink-0 border-surface-hover/50 bg-surface/80"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex gap-2 items-center">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-semibold text-text-primary">{title}</span>
        </div>

        <button
          onClick={handleClose}
          className="p-1.5 rounded-md text-text-secondary transition-colors hover:bg-red-500/20 hover:text-red-400"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="닫기"
        >
          <X size={16} />
        </button>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-hidden p-4">
        {children}
      </div>
    </div>
  )
}
