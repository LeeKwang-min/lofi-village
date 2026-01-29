/**
 * 스케줄 타이머 컴포넌트
 * 기존 PomodoroTimer UI를 기반으로 동적 시간 및 일정 연동 지원
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Coins } from 'lucide-react'
import { useScheduleContext } from '@/contexts/ScheduleContext'
import { useNotification } from '@/hooks/useNotification'
import { formatTime } from '@/hooks/useTimer'

const FOCUS_REWARD_PER_30MIN = 25

export function ScheduleTimer() {
  const {
    timeLeft,
    status,
    progress,
    currentItem,
    nextItem,
    start,
    pause,
    reset,
    skip,
    extendTime,
  } = useScheduleContext()

  const [showReward, setShowReward] = useState(false)
  const [lastReward, setLastReward] = useState(0)
  const [pendingNotification, setPendingNotification] = useState<'focus' | 'break' | null>(null)

  // 현재 모드 결정 (currentItem 또는 nextItem 기준)
  const activeItem = currentItem || nextItem
  const isFocus = activeItem ? activeItem.type === 'focus' : true
  const isRunning = status === 'running'

  // 타이머 함수 ref (알림 액션 핸들러용)
  const timerActionsRef = useRef({ start, skip, extendTime, isFocus })
  timerActionsRef.current = { start, skip, extendTime, isFocus }

  // 알림 액션 핸들러
  const handleNotificationAction = useCallback((actionId: string) => {
    const { start, skip, extendTime, isFocus } = timerActionsRef.current

    switch (actionId) {
      case 'start-break':
        // 휴식 시작 (다음 일정이 휴식이면 시작)
        start()
        break
      case 'extend-focus':
        // 5분 연장하고 다시 시작
        extendTime(5)
        start()
        break
      case 'start-focus':
        // 집중 시작 (다음 일정이 집중이면 시작)
        start()
        break
      case 'snooze':
        // 5분 더 쉬기
        extendTime(5)
        start()
        break
      case 'click':
        // 알림 클릭 - 앱 포커스
        break
    }
  }, [])

  const { notifyFocusComplete, notifyBreakComplete } = useNotification({
    onAction: handleNotificationAction,
  })

  // 완료 감지 및 보상 표시
  useEffect(() => {
    if (timeLeft === 0 && status === 'idle' && currentItem === null && activeItem) {
      // 일정이 완료됨
      if (!isFocus) {
        // 이전 아이템이 집중이었다면 (지금 break로 전환된 상태)
        setPendingNotification('focus')
      } else {
        setPendingNotification('break')
      }
    }
  }, [timeLeft, status, currentItem, activeItem, isFocus])

  // 보류된 알림 처리
  useEffect(() => {
    if (pendingNotification === 'focus') {
      notifyFocusComplete()
      // 보상 애니메이션 표시
      if (activeItem) {
        const reward = Math.floor((activeItem.durationMinutes / 30) * FOCUS_REWARD_PER_30MIN)
        setLastReward(reward)
        setShowReward(true)
        setTimeout(() => setShowReward(false), 2000)
      }
    } else if (pendingNotification === 'break') {
      notifyBreakComplete()
    }
    setPendingNotification(null)
  }, [pendingNotification, notifyFocusComplete, notifyBreakComplete, activeItem])

  // 타이틀 결정
  const title = activeItem?.title || (isFocus ? '집중 타이머' : '휴식 시간')
  const subtitle = currentItem
    ? `${currentItem.durationMinutes}분 ${isFocus ? '집중' : '휴식'}`
    : nextItem
      ? `다음: ${nextItem.title} (${nextItem.durationMinutes}분)`
      : null

  return (
    <section className="p-4 rounded-xl border border-surface-hover/50 bg-surface/50">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <span className="text-xl">{isFocus ? '🎯' : '☕'}</span>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
            {subtitle && (
              <p className="text-xs text-text-muted">{subtitle}</p>
            )}
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            isFocus ? 'bg-warm/20 text-warm' : 'bg-cool/20 text-cool'
          }`}
        >
          {isFocus ? 'FOCUS' : 'BREAK'}
        </span>
      </div>

      {/* 프로그레스 링 */}
      <div className="flex relative justify-center mb-4">
        <svg className="w-52 h-52 transform -rotate-90">
          {/* 배경 원 */}
          <circle
            cx="104"
            cy="104"
            r="92"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-surface"
          />
          {/* 진행 원 */}
          <circle
            cx="104"
            cy="104"
            r="92"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 92}
            strokeDashoffset={2 * Math.PI * 92 * (1 - progress)}
            className={`transition-all duration-1000 ${isFocus ? 'text-warm' : 'text-cool'}`}
          />
        </svg>

        {/* 시간 표시 */}
        <div className="flex absolute inset-0 flex-col justify-center items-center">
          <span
            className={`font-mono text-4xl font-bold ${
              isFocus ? 'text-glow-warm text-warm' : 'text-cool'
            }`}
          >
            {formatTime(timeLeft)}
          </span>
          <span className="mt-1 text-xs text-text-muted">
            {status === 'idle' && !currentItem && !nextItem && '일정을 추가하세요'}
            {status === 'idle' && (currentItem || nextItem) && '시작하려면 버튼을 누르세요'}
            {status === 'running' && (isFocus ? '집중하는 중...' : '쉬는 중...')}
            {status === 'paused' && '일시정지됨'}
          </span>
        </div>
      </div>

      {/* 보상 알림 */}
      {showReward && (
        <div className="flex gap-2 justify-center items-center p-2 mb-4 text-yellow-500 rounded-lg animate-pulse bg-yellow-500/20">
          <Coins size={16} />
          <span className="text-sm font-medium">+{lastReward} 코인 획득!</span>
        </div>
      )}

      {/* 컨트롤 버튼 */}
      <div className="flex gap-2 justify-center">
        {/* 리셋 버튼 */}
        <button
          onClick={reset}
          className="p-3 rounded-full transition-colors bg-background/50 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          title="리셋"
        >
          <RotateCcw size={18} />
        </button>

        {/* 시작/일시정지 버튼 */}
        <button
          onClick={isRunning ? pause : start}
          disabled={!currentItem && !nextItem}
          className={`rounded-full p-4 font-medium transition-all ${
            isFocus
              ? 'bg-warm/20 text-warm hover:bg-warm/30'
              : 'bg-cool/20 text-cool hover:bg-cool/30'
          } ${isRunning ? 'pulse-warm' : ''} ${
            !currentItem && !nextItem ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={isRunning ? '일시정지' : '시작'}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>

        {/* 스킵 버튼 */}
        <button
          onClick={skip}
          disabled={!currentItem && !nextItem}
          className={`p-3 rounded-full transition-colors bg-background/50 text-text-secondary hover:bg-surface-hover hover:text-text-primary ${
            !currentItem && !nextItem ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="스킵"
        >
          <SkipForward size={18} />
        </button>
      </div>
    </section>
  )
}
