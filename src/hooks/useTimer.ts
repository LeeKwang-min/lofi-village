import { useState, useCallback, useEffect, useRef } from 'react'

export type TimerStatus = 'idle' | 'running' | 'paused'
export type TimerMode = 'focus' | 'break'

interface UseTimerOptions {
  focusMinutes?: number
  breakMinutes?: number
  onComplete?: (mode: TimerMode) => void
}

interface UseTimerReturn {
  timeLeft: number // 남은 시간 (초)
  status: TimerStatus
  mode: TimerMode
  progress: number // 진행률 (0-1)
  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
  extendTime: (minutes: number) => void // 시간 연장
}

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const {
    focusMinutes = 25,
    breakMinutes = 5,
    onComplete
  } = options

  const [mode, setMode] = useState<TimerMode>('focus')
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60)

  // ============================================
  // 핵심 ref들
  // ============================================
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)

  // endAt 기반 정확한 시간 계산 (드리프트 방지)
  const endAtRef = useRef<number | null>(null)

  // 상태 ref (interval 콜백에서 최신 상태 참조용)
  const modeRef = useRef<TimerMode>('focus')
  const statusRef = useRef<TimerStatus>('idle')

  // 메인 프로세스에서 받은 진짜 가시성 상태 (backgroundThrottling: false에서도 신뢰 가능)
  const isVisibleRef = useRef(true)

  // ============================================
  // 콜백 ref 동기화
  // ============================================
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // ============================================
  // 메인 프로세스에서 가시성 IPC 수신
  // ============================================
  useEffect(() => {
    const unsubscribe = window.electronAPI?.onVisibilityChanged?.((visible) => {
      isVisibleRef.current = visible

      // visible로 돌아올 때 UI 즉시 동기화
      if (visible && statusRef.current === 'running' && endAtRef.current) {
        const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
        setTimeLeft(remaining)
      }
    })

    return () => unsubscribe?.()
  }, [])

  // ============================================
  // 계산된 값들
  // ============================================
  const totalTime = mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60
  const progress = 1 - timeLeft / totalTime

  // ============================================
  // 타이머 정리 함수 (interval 중복 방지 포함)
  // ============================================
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // ============================================
  // 타이머 완료 처리
  // ============================================
  const handleComplete = useCallback(() => {
    clearTimer()
    endAtRef.current = null

    const completedMode = modeRef.current
    onCompleteRef.current?.(completedMode)

    const nextMode = completedMode === 'focus' ? 'break' : 'focus'
    const nextTime = nextMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60

    modeRef.current = nextMode
    statusRef.current = 'idle'

    setMode(nextMode)
    setTimeLeft(nextTime)
    setStatus('idle')
  }, [clearTimer, focusMinutes, breakMinutes])

  // ============================================
  // 타이머 tick (endAt 기반 정확한 계산)
  // ============================================
  const tick = useCallback(() => {
    if (!endAtRef.current) return

    const now = Date.now()
    const remaining = Math.max(0, Math.ceil((endAtRef.current - now) / 1000))

    if (remaining <= 0) {
      // 타이머 완료
      handleComplete()
    } else {
      // visible일 때만 UI 업데이트 (백그라운드에서는 건너뜀)
      if (isVisibleRef.current) {
        setTimeLeft(remaining)
      }
    }
  }, [handleComplete])

  // ============================================
  // 타이머 시작 (중복 가드 포함)
  // ============================================
  const start = useCallback(() => {
    // 중복 가드: 이미 running이면 무시
    if (statusRef.current === 'running') {
      return
    }
    // 기존 interval이 있으면 정리
    if (intervalRef.current) {
      clearTimer()
    }

    // endAt 계산: 현재 timeLeft를 기준으로 목표 시각 설정
    const currentTimeLeft = endAtRef.current
      ? Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
      : timeLeft

    endAtRef.current = Date.now() + currentTimeLeft * 1000

    statusRef.current = 'running'
    setStatus('running')

    // interval 시작 (200ms 간격으로 체크 - 더 정확한 완료 감지)
    intervalRef.current = setInterval(tick, 200)
  }, [timeLeft, tick, clearTimer])

  // ============================================
  // 타이머 일시정지
  // ============================================
  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return

    clearTimer()

    // 남은 시간 저장 (재시작 시 사용)
    if (endAtRef.current) {
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
      setTimeLeft(remaining)
    }
    endAtRef.current = null

    statusRef.current = 'paused'
    setStatus('paused')
  }, [clearTimer])

  // ============================================
  // 타이머 리셋
  // ============================================
  const reset = useCallback(() => {
    clearTimer()
    endAtRef.current = null

    const initialTime = focusMinutes * 60

    statusRef.current = 'idle'
    modeRef.current = 'focus'

    setStatus('idle')
    setMode('focus')
    setTimeLeft(initialTime)
  }, [clearTimer, focusMinutes])

  // ============================================
  // 현재 세션 스킵
  // ============================================
  const skip = useCallback(() => {
    clearTimer()
    endAtRef.current = null

    const nextMode = modeRef.current === 'focus' ? 'break' : 'focus'
    const nextTime = nextMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60

    modeRef.current = nextMode
    statusRef.current = 'idle'

    setMode(nextMode)
    setTimeLeft(nextTime)
    setStatus('idle')
  }, [clearTimer, focusMinutes, breakMinutes])

  // ============================================
  // 시간 연장 (분 단위)
  // ============================================
  const extendTime = useCallback((minutes: number) => {
    const addMs = minutes * 60 * 1000

    if (endAtRef.current && statusRef.current === 'running') {
      // running 중이면 endAt 연장
      endAtRef.current += addMs
    }

    // UI도 업데이트
    setTimeLeft(prev => prev + minutes * 60)
  }, [])

  // ============================================
  // 컴포넌트 언마운트 시 타이머 정리
  // ============================================
  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  return {
    timeLeft,
    status,
    mode,
    progress,
    start,
    pause,
    reset,
    skip,
    extendTime
  }
}

// 시간 포맷팅 헬퍼 함수
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
