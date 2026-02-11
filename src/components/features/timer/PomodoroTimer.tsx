import { Play, Pause, RotateCcw, SkipForward, Coins } from 'lucide-react'
import { useTimer, formatTime } from '@/hooks/useTimer'
import { useVillageContext } from '@/contexts/VillageContext'
import { useNotification } from '@/hooks/useNotification'
import { useState, useCallback, useEffect, useRef } from 'react'

// 가시성 기반 트랜지션 훅: 백그라운드에서 돌아올 때 트랜지션 일시 비활성화
// 메인 프로세스의 IPC 신호 사용 (backgroundThrottling: false에서도 신뢰 가능)
function useVisibilityTransition() {
  const [enableTransition, setEnableTransition] = useState(true)

  useEffect(() => {
    // 메인 프로세스에서 가시성 변경 수신
    const unsubscribe = window.electronAPI?.onVisibilityChanged?.((visible) => {
      if (visible) {
        // 백그라운드에서 돌아올 때 트랜지션 잠시 비활성화 (즉시 동기화)
        setEnableTransition(false)
        // 다음 프레임에서 트랜지션 다시 활성화
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setEnableTransition(true)
          })
        })
      }
    })

    return () => unsubscribe?.()
  }, [])

  return enableTransition
}

const FOCUS_REWARD = 50 // 집중 완료 시 보상 코인

export function PomodoroTimer() {
  const { addCoins, addFocusTime } = useVillageContext()
  const [showReward, setShowReward] = useState(false)
  const [pendingNotification, setPendingNotification] = useState<'focus' | 'break' | null>(null)
  const enableTransition = useVisibilityTransition()

  const { timeLeft, status, mode, progress, start, pause, reset, skip, extendTime } = useTimer({
    focusMinutes: 60,
    breakMinutes: 10,
    onComplete: (completedMode) => {
      if (completedMode === 'focus') {
        addCoins(FOCUS_REWARD)
        addFocusTime(25)
        setShowReward(true)
        setTimeout(() => setShowReward(false), 2000)
      }
      // 알림은 useEffect에서 처리 (순환 참조 방지)
      setPendingNotification(completedMode)
    }
  })

  // 타이머 함수와 상태를 ref로 저장 (액션 핸들러에서 최신 값 사용)
  const timerActionsRef = useRef({ start, skip, extendTime, mode })
  timerActionsRef.current = { start, skip, extendTime, mode }

  // 알림 액션 핸들러
  const handleNotificationAction = useCallback((actionId: string) => {
    const { start, skip, extendTime, mode } = timerActionsRef.current

    switch (actionId) {
      case 'start-break':
        if (mode === 'focus') {
          skip()
          // skip() 후 상태 업데이트를 기다린 후 start()
          setTimeout(() => timerActionsRef.current.start(), 50)
        }
        break
      case 'extend-focus':
        // 집중 완료 후 mode가 이미 'break'로 전환됨 → 다시 'focus'로 돌아가서 연장
        if (mode === 'break') {
          skip()
          setTimeout(() => {
            timerActionsRef.current.extendTime(5)
            timerActionsRef.current.start()
          }, 50)
        }
        break
      case 'start-focus':
        if (mode === 'break') {
          skip()
          setTimeout(() => timerActionsRef.current.start(), 50)
        }
        break
      case 'snooze':
        // 휴식 완료 후 mode가 이미 'focus'로 전환됨 → 다시 'break'로 돌아가서 연장
        if (mode === 'focus') {
          skip()
          setTimeout(() => {
            timerActionsRef.current.extendTime(5)
            timerActionsRef.current.start()
          }, 50)
        }
        break
      case 'click':
        // 알림 클릭 시 앱 포커스는 main.ts에서 처리됨
        // 추가 동작이 필요하면 여기에 구현
        break
    }
  }, [])

  const { notifyFocusComplete, notifyBreakComplete, ActionId } = useNotification({
    onAction: handleNotificationAction
  })

  // 보류된 알림 처리
  useEffect(() => {
    if (pendingNotification === 'focus') {
      notifyFocusComplete()
    } else if (pendingNotification === 'break') {
      notifyBreakComplete()
    }
    setPendingNotification(null)
  }, [pendingNotification, notifyFocusComplete, notifyBreakComplete])

  const isRunning = status === 'running'
  const isFocus = mode === 'focus'

  return (
    <section className="rounded-xl border border-surface-hover/50 bg-surface/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{isFocus ? '🎯' : '☕'}</span>
          <h2 className="text-sm font-semibold text-text-primary">
            {isFocus ? '집중 타이머' : '휴식 시간'}
          </h2>
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
      <div className="relative mb-4 flex justify-center">
        <svg className="h-52 w-52 -rotate-90 transform">
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
            className={`${enableTransition ? 'transition-all duration-1000' : ''} ${isFocus ? 'text-warm' : 'text-cool'}`}
          />
        </svg>

        {/* 시간 표시 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono text-4xl font-bold ${
              isFocus ? 'text-glow-warm text-warm' : 'text-cool'
            }`}
          >
            {formatTime(timeLeft)}
          </span>
          <span className="mt-1 text-xs text-text-muted">
            {status === 'idle' && '시작하려면 버튼을 누르세요'}
            {status === 'running' && (isFocus ? '집중하는 중...' : '쉬는 중...')}
            {status === 'paused' && '일시정지됨'}
          </span>
        </div>
      </div>

      {/* 보상 알림 */}
      {showReward && (
        <div className="mb-4 flex animate-pulse items-center justify-center gap-2 rounded-lg bg-yellow-500/20 p-2 text-yellow-500">
          <Coins size={16} />
          <span className="text-sm font-medium">+{FOCUS_REWARD} 코인 획득!</span>
        </div>
      )}

      {/* 컨트롤 버튼 */}
      <div className="flex justify-center gap-2">
        {/* 리셋 버튼 */}
        <button
          onClick={reset}
          className="rounded-full bg-background/50 p-3 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          title="리셋"
        >
          <RotateCcw size={18} />
        </button>

        {/* 시작/일시정지 버튼 */}
        <button
          onClick={isRunning ? pause : start}
          className={`rounded-full p-4 font-medium transition-all ${
            isFocus
              ? 'bg-warm/20 text-warm hover:bg-warm/30'
              : 'bg-cool/20 text-cool hover:bg-cool/30'
          } ${isRunning ? 'pulse-warm' : ''}`}
          title={isRunning ? '일시정지' : '시작'}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>

        {/* 스킵 버튼 */}
        <button
          onClick={skip}
          className="rounded-full bg-background/50 p-3 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          title="스킵"
        >
          <SkipForward size={18} />
        </button>
      </div>
    </section>
  )
}
