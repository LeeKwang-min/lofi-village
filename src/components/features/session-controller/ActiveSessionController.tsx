/**
 * ActiveSessionController - 미니 세션 컨트롤러
 * TitleBar 아래에 위치하며, 활성 세션이 있을 때만 표시
 */

import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import { useScheduleContext } from '@/contexts/ScheduleContext'
import { formatTime } from '@/hooks/useTimer'

// TODO(human): shouldShow 조건 로직 구현
// 컨트롤러를 표시할지 결정하는 함수
// 참고할 수 있는 상태: status ('idle' | 'running' | 'paused'), currentItem, nextItem
function shouldShow(status: string, currentItem: unknown, nextItem: unknown): boolean {
  void status
  void currentItem
  void nextItem

  if (status === 'running' || status === 'paused') {
    return true
  }

  return false
}

export function ActiveSessionController() {
  const { timeLeft, status, progress, currentItem, nextItem, start, pause, reset, skip } =
    useScheduleContext()

  const activeItem = currentItem || nextItem
  const isFocus = activeItem ? activeItem.type === 'focus' : true
  const isRunning = status === 'running'

  const title = activeItem?.title || (isFocus ? '집중 타이머' : '휴식 시간')
  const subtitle = currentItem
    ? `${currentItem.durationMinutes}분 ${isFocus ? '집중' : '휴식'}`
    : nextItem
      ? `다음: ${nextItem.title}`
      : null

  const visible = shouldShow(status, currentItem, nextItem)

  // 미니 프로그레스 링 치수
  const ringSize = 48
  const ringRadius = 18
  const ringCircumference = 2 * Math.PI * ringRadius

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        visible ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="flex items-center gap-3 border-b border-surface-hover/50 bg-surface/30 px-4 py-2 backdrop-blur-sm">
        {/* 좌측: 미니 프로그레스 링 (시간 텍스트 내장) */}
        <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="-rotate-90 transform">
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-surface"
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringCircumference * (1 - progress)}
              className={`transition-all duration-1000 ${isFocus ? 'text-warm' : 'text-cool'}`}
            />
          </svg>
          <span
            className={`absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold ${
              isFocus ? 'text-warm' : 'text-cool'
            }`}
          >
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* 중앙: 세션 정보 */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{title}</p>
          {subtitle && <p className="truncate text-xs text-text-muted">{subtitle}</p>}
        </div>

        {/* 우측: 컨트롤 버튼 */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={reset}
            className="rounded-full p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            title="리셋"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={isRunning ? pause : start}
            className={`rounded-full p-1.5 transition-colors ${
              isFocus ? 'text-warm hover:bg-warm/20' : 'text-cool hover:bg-cool/20'
            }`}
            title={isRunning ? '일시정지' : '시작'}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={skip}
            className="rounded-full p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            title="스킵"
          >
            <SkipForward size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
