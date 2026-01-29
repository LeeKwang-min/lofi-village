/**
 * 일정 연동 타이머 훅
 * scheduleQueueService와 React 상태를 연동하여 동적 타이머 기능을 제공합니다.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { scheduleQueueService } from '@/services/schedule'
import { ScheduleItem, QueueStats, SchedulePreset } from '@/types/schedule'

export type ScheduleTimerStatus = 'idle' | 'running' | 'paused'

interface UseScheduleTimerOptions {
  onItemComplete?: (item: ScheduleItem) => void
  onQueueUpdate?: () => void
}

interface UseScheduleTimerReturn {
  // 타이머 상태
  timeLeft: number
  status: ScheduleTimerStatus
  progress: number

  // 현재 일정 정보
  currentItem: ScheduleItem | null
  nextItem: ScheduleItem | null
  pendingItems: ScheduleItem[]
  queueStats: QueueStats

  // 타이머 제어
  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
  extendTime: (minutes: number) => void

  // 일정 관리
  addFocusSession: (title: string, durationMinutes: number, autoInsertBreak?: boolean, emoji?: string) => void
  addPreset: (preset: SchedulePreset) => void
  removeItem: (itemId: string) => void
  clearCompleted: () => void
  clearAll: () => void

  // 동적 시간 설정
  setDuration: (minutes: number) => void
}

export function useScheduleTimer(options: UseScheduleTimerOptions = {}): UseScheduleTimerReturn {
  const { onItemComplete, onQueueUpdate } = options

  // 상태
  const [status, setStatus] = useState<ScheduleTimerStatus>('idle')
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentItem, setCurrentItem] = useState<ScheduleItem | null>(null)
  const [nextItem, setNextItem] = useState<ScheduleItem | null>(null)
  const [pendingItems, setPendingItems] = useState<ScheduleItem[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats>({
    totalItems: 0,
    pendingItems: 0,
    completedItems: 0,
    totalFocusMinutes: 0,
    completedFocusMinutes: 0,
  })

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onItemCompleteRef = useRef(onItemComplete)
  const onQueueUpdateRef = useRef(onQueueUpdate)

  // 콜백 refs 업데이트
  useEffect(() => {
    onItemCompleteRef.current = onItemComplete
    onQueueUpdateRef.current = onQueueUpdate
  }, [onItemComplete, onQueueUpdate])

  // 총 시간 (현재 아이템 기준)
  const totalTime = currentItem ? currentItem.durationMinutes * 60 : 0

  // 진행률 계산
  const progress = totalTime > 0 ? 1 - timeLeft / totalTime : 0

  // 타이머 정리
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // 큐 상태 동기화
  const syncQueueState = useCallback(() => {
    setCurrentItem(scheduleQueueService.getCurrentItem())
    setNextItem(scheduleQueueService.getNextItem())
    setPendingItems(scheduleQueueService.getPendingItems())
    setQueueStats(scheduleQueueService.getStats())
    onQueueUpdateRef.current?.()
  }, [])

  // 타이머 완료 처리
  const handleTimerComplete = useCallback(() => {
    clearTimer()

    const completedItem = scheduleQueueService.completeCurrent()
    if (completedItem) {
      onItemCompleteRef.current?.(completedItem)
    }

    syncQueueState()
    setStatus('idle')

    // 다음 일정이 있으면 시간 설정
    const next = scheduleQueueService.getNextItem()
    if (next) {
      setTimeLeft(next.durationMinutes * 60)
    } else {
      setTimeLeft(0)
    }
  }, [clearTimer, syncQueueState])

  // 타이머 tick
  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        setTimeout(handleTimerComplete, 0)
        return 0
      }
      return prev - 1
    })
  }, [handleTimerComplete])

  // 타이머 시작
  const start = useCallback(() => {
    if (status === 'running') return

    // active 아이템이 없으면 다음 pending을 시작
    let item = scheduleQueueService.getCurrentItem()
    if (!item) {
      item = scheduleQueueService.startCurrent()
      if (!item) return // 큐가 비어있음

      setCurrentItem(item)
      setTimeLeft(item.durationMinutes * 60)
    }

    setStatus('running')
    intervalRef.current = setInterval(tick, 1000)
    syncQueueState()
  }, [status, tick, syncQueueState])

  // 타이머 일시정지
  const pause = useCallback(() => {
    if (status !== 'running') return

    clearTimer()
    setStatus('paused')
  }, [status, clearTimer])

  // 타이머 리셋 (현재 아이템 시간 리셋)
  const reset = useCallback(() => {
    clearTimer()
    setStatus('idle')

    const current = scheduleQueueService.getCurrentItem()
    if (current) {
      setTimeLeft(current.durationMinutes * 60)
    } else {
      const next = scheduleQueueService.getNextItem()
      if (next) {
        setTimeLeft(next.durationMinutes * 60)
      }
    }
  }, [clearTimer])

  // 현재 세션 스킵
  const skip = useCallback(() => {
    clearTimer()
    scheduleQueueService.skipCurrent()
    syncQueueState()
    setStatus('idle')

    // 다음 일정 시간 설정
    const next = scheduleQueueService.getNextItem()
    if (next) {
      setTimeLeft(next.durationMinutes * 60)
    } else {
      setTimeLeft(0)
    }
  }, [clearTimer, syncQueueState])

  // 시간 연장
  const extendTime = useCallback((minutes: number) => {
    setTimeLeft(prev => prev + minutes * 60)
  }, [])

  // 동적 시간 설정 (현재 아이템이 idle 상태일 때만)
  const setDuration = useCallback((minutes: number) => {
    if (status !== 'idle') return
    setTimeLeft(minutes * 60)
  }, [status])

  // === 일정 관리 함수들 ===

  const addFocusSession = useCallback((
    title: string,
    durationMinutes: number,
    autoInsertBreak: boolean = true,
    emoji?: string
  ) => {
    scheduleQueueService.addFocusSession(title, durationMinutes, autoInsertBreak, emoji)
    syncQueueState()

    // 현재 타이머가 비어있으면 새 일정의 시간으로 설정
    if (!currentItem && status === 'idle') {
      const next = scheduleQueueService.getNextItem()
      if (next) {
        setTimeLeft(next.durationMinutes * 60)
      }
    }
  }, [syncQueueState, currentItem, status])

  const addPreset = useCallback((preset: SchedulePreset) => {
    addFocusSession(preset.name, preset.focusMinutes, true, preset.emoji)
  }, [addFocusSession])

  const removeItem = useCallback((itemId: string) => {
    scheduleQueueService.removeItem(itemId)
    syncQueueState()
  }, [syncQueueState])

  const clearCompleted = useCallback(() => {
    scheduleQueueService.clearCompleted()
    syncQueueState()
  }, [syncQueueState])

  const clearAll = useCallback(() => {
    clearTimer()
    scheduleQueueService.clearAll()
    syncQueueState()
    setStatus('idle')
    setTimeLeft(0)
  }, [clearTimer, syncQueueState])

  // 초기화 및 이벤트 구독
  useEffect(() => {
    syncQueueState()

    // 초기 타임 설정
    const current = scheduleQueueService.getCurrentItem()
    const next = scheduleQueueService.getNextItem()

    if (current) {
      // 활성 아이템이 있으면 남은 시간 계산 (단순히 전체 시간으로 설정)
      setTimeLeft(current.durationMinutes * 60)
    } else if (next) {
      setTimeLeft(next.durationMinutes * 60)
    }

    // 이벤트 구독
    const unsubscribeComplete = scheduleQueueService.on('item-completed', (event) => {
      if (event.item) {
        onItemCompleteRef.current?.(event.item)
      }
    })

    const unsubscribeUpdate = scheduleQueueService.on('queue-updated', () => {
      syncQueueState()
    })

    return () => {
      clearTimer()
      unsubscribeComplete()
      unsubscribeUpdate()
    }
  }, [clearTimer, syncQueueState])

  return {
    // 타이머 상태
    timeLeft,
    status,
    progress,

    // 현재 일정 정보
    currentItem,
    nextItem,
    pendingItems,
    queueStats,

    // 타이머 제어
    start,
    pause,
    reset,
    skip,
    extendTime,

    // 일정 관리
    addFocusSession,
    addPreset,
    removeItem,
    clearCompleted,
    clearAll,

    // 동적 시간 설정
    setDuration,
  }
}

// 시간 포맷팅 헬퍼 (기존 useTimer에서 재사용)
export { formatTime } from './useTimer'
