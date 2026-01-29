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

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)

  // onComplete 콜백 최신 상태 유지
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // 현재 모드의 총 시간 (초)
  const totalTime = mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60

  // 진행률 계산
  const progress = 1 - timeLeft / totalTime

  // 타이머 정리 함수
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // 타이머 tick: 1초마다 호출되어 시간을 감소시킴
  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        setTimeout(() => {
          clearTimer()
          onCompleteRef.current?.(mode)
          const nextMode = mode === 'focus' ? 'break' : 'focus'
          setMode(nextMode)
          setTimeLeft(nextMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60)
          setStatus('idle')
        }, 0)
        return 0
      }
      return prev - 1
    })
  }, [clearTimer, mode, focusMinutes, breakMinutes])

  // 타이머 시작
  const start = useCallback(() => {
    if (status === 'running') return

    setStatus('running')
    intervalRef.current = setInterval(tick, 1000)
  }, [status, tick])

  // 타이머 일시정지
  const pause = useCallback(() => {
    if (status !== 'running') return

    clearTimer()
    setStatus('paused')
  }, [status, clearTimer])

  // 타이머 리셋
  const reset = useCallback(() => {
    clearTimer()
    setStatus('idle')
    setMode('focus')
    setTimeLeft(focusMinutes * 60)
  }, [clearTimer, focusMinutes])

  // 현재 세션 스킵
  const skip = useCallback(() => {
    clearTimer()
    const nextMode = mode === 'focus' ? 'break' : 'focus'
    setMode(nextMode)
    setTimeLeft(nextMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60)
    setStatus('idle')
  }, [clearTimer, mode, focusMinutes, breakMinutes])

  // 시간 연장 (분 단위)
  const extendTime = useCallback((minutes: number) => {
    setTimeLeft(prev => prev + minutes * 60)
  }, [])

  // 컴포넌트 언마운트 시 타이머 정리
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
