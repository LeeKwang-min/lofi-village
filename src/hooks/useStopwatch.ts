import { useState, useCallback, useEffect, useRef } from 'react'

export type StopwatchStatus = 'idle' | 'running' | 'paused'

interface UseStopwatchOptions {
  onComplete?: (elapsedSeconds: number) => void
}

interface UseStopwatchReturn {
  elapsed: number // 경과 시간 (초)
  status: StopwatchStatus
  start: () => void
  pause: () => void
  stop: () => void
  reset: () => void
}

export function useStopwatch(options: UseStopwatchOptions = {}): UseStopwatchReturn {
  const { onComplete } = options

  const [elapsed, setElapsed] = useState(0)
  const [status, setStatus] = useState<StopwatchStatus>('idle')

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)
  const startAtRef = useRef<number | null>(null)
  const accumulatedMsRef = useRef(0)
  const statusRef = useRef<StopwatchStatus>('idle')
  const isVisibleRef = useRef(true)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // 메인 프로세스에서 가시성 IPC 수신
  useEffect(() => {
    const unsubscribe = window.electronAPI?.onVisibilityChanged?.((visible) => {
      isVisibleRef.current = visible
      if (visible && statusRef.current === 'running' && startAtRef.current) {
        const total = accumulatedMsRef.current + (Date.now() - startAtRef.current)
        setElapsed(Math.floor(total / 1000))
      }
    })
    return () => unsubscribe?.()
  }, [])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    if (!startAtRef.current) return
    const total = accumulatedMsRef.current + (Date.now() - startAtRef.current)
    if (isVisibleRef.current) {
      setElapsed(Math.floor(total / 1000))
    }
  }, [])

  const start = useCallback(() => {
    if (statusRef.current === 'running') return
    clearTimer()

    startAtRef.current = Date.now()
    statusRef.current = 'running'
    setStatus('running')

    intervalRef.current = setInterval(tick, 200)
  }, [tick, clearTimer])

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return
    clearTimer()

    if (startAtRef.current) {
      accumulatedMsRef.current += Date.now() - startAtRef.current
    }
    startAtRef.current = null

    statusRef.current = 'paused'
    setStatus('paused')
    setElapsed(Math.floor(accumulatedMsRef.current / 1000))
  }, [clearTimer])

  const stop = useCallback(() => {
    if (statusRef.current === 'idle') return
    clearTimer()

    let totalMs = accumulatedMsRef.current
    if (startAtRef.current) {
      totalMs += Date.now() - startAtRef.current
    }

    const totalSeconds = Math.floor(totalMs / 1000)
    onCompleteRef.current?.(totalSeconds)

    // 상태 리셋
    startAtRef.current = null
    accumulatedMsRef.current = 0
    statusRef.current = 'idle'
    setStatus('idle')
    setElapsed(0)
  }, [clearTimer])

  const reset = useCallback(() => {
    clearTimer()
    startAtRef.current = null
    accumulatedMsRef.current = 0
    statusRef.current = 'idle'
    setStatus('idle')
    setElapsed(0)
  }, [clearTimer])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  return { elapsed, status, start, pause, stop, reset }
}

// 스톱워치 시간 포맷팅 (HH:MM:SS 또는 MM:SS)
export function formatStopwatchTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
