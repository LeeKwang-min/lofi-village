# Stopwatch Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 집중 탭에 자유 집중 측정용 스톱워치를 추가하고, 코인 보상과 집중 기록에 연동한다.

**Architecture:** 독립 훅(`useStopwatch`) + 독립 컴포넌트(`Stopwatch`)로 기존 코드 수정 최소화. `scheduleQueueService`에 완료된 세션 직접 추가 메서드를 추가하여 FocusHistory와 연동.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, lucide-react, Electron IPC

---

### Task 1: scheduleQueueService에 addCompletedSession 메서드 추가

**Files:**
- Modify: `src/services/schedule/scheduleQueue.ts` (clearAll 메서드 위에 추가)

**Step 1: addCompletedSession 메서드 추가**

`scheduleQueueService`에 이미 완료된 세션을 직접 큐에 추가하는 메서드를 구현한다. 스톱워치 완료 시 이 메서드를 호출하여 FocusHistory에 기록을 남긴다.

```typescript
/**
 * 이미 완료된 세션을 기록용으로 큐에 추가 (스톱워치 등)
 */
addCompletedSession(options: {
  title: string
  emoji?: string
  durationMinutes: number
  source?: ScheduleSource
}): ScheduleItem {
  const now = new Date()
  const item: ScheduleItem = {
    id: generateId(),
    type: 'focus',
    title: options.title,
    emoji: options.emoji,
    status: 'completed',
    source: options.source || 'manual',
    durationMinutes: options.durationMinutes,
    autoInsertBreak: false,
    createdAt: now,
    startedAt: new Date(now.getTime() - options.durationMinutes * 60 * 1000),
    completedAt: now,
  }

  this.queue.push(item)
  this.saveToStorage()
  this.emit('item-completed', item)
  this.emit('queue-updated')

  return item
}
```

**Step 2: 커밋**

```bash
git add src/services/schedule/scheduleQueue.ts
git commit -m "feat(schedule): add addCompletedSession method for stopwatch integration"
```

---

### Task 2: useStopwatch 훅 작성

**Files:**
- Create: `src/hooks/useStopwatch.ts`

**Step 1: useStopwatch 훅 구현**

`useTimer`의 endAt 패턴을 역방향으로 적용. `startAt` + `accumulatedMs`로 경과 시간을 정확히 계산한다.

```typescript
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
```

**Step 2: 커밋**

```bash
git add src/hooks/useStopwatch.ts
git commit -m "feat(stopwatch): add useStopwatch hook with startAt-based time tracking"
```

---

### Task 3: Stopwatch 컴포넌트 작성

**Files:**
- Create: `src/components/features/stopwatch/Stopwatch.tsx`
- Create: `src/components/features/stopwatch/index.ts`

**Step 1: barrel export 생성**

```typescript
// src/components/features/stopwatch/index.ts
export { Stopwatch } from './Stopwatch'
```

**Step 2: Stopwatch 컴포넌트 구현**

기존 `PomodoroTimer.tsx`의 카드 스타일과 통일. 보상 계산 로직 포함.

```typescript
// src/components/features/stopwatch/Stopwatch.tsx
import { Play, Pause, Square, RotateCcw, Coins } from 'lucide-react'
import { useStopwatch, formatStopwatchTime } from '@/hooks/useStopwatch'
import { useVillageContext } from '@/contexts/VillageContext'
import { scheduleQueueService } from '@/services/schedule'
import { useState, useCallback } from 'react'

const MIN_FOCUS_SECONDS = 5 * 60 // 최소 5분
const COINS_PER_30MIN = 25

export function Stopwatch() {
  const { addCoins, addFocusTime } = useVillageContext()
  const [showReward, setShowReward] = useState(false)
  const [lastReward, setLastReward] = useState(0)

  const handleComplete = useCallback((elapsedSeconds: number) => {
    const elapsedMinutes = Math.round(elapsedSeconds / 60)

    if (elapsedSeconds >= MIN_FOCUS_SECONDS) {
      // 코인 보상
      const reward = Math.floor(elapsedMinutes / 30) * COINS_PER_30MIN
      // 최소 보상: 5분 이상이면 최소 10코인
      const finalReward = Math.max(reward, 10)

      addCoins(finalReward)
      addFocusTime(elapsedMinutes)

      // 기록 저장
      scheduleQueueService.addCompletedSession({
        title: '자유 집중',
        emoji: '⏱️',
        durationMinutes: elapsedMinutes,
      })

      // 보상 애니메이션
      setLastReward(finalReward)
      setShowReward(true)
      setTimeout(() => setShowReward(false), 2000)
    }
  }, [addCoins, addFocusTime])

  const { elapsed, status, start, pause, stop, reset } = useStopwatch({
    onComplete: handleComplete,
  })

  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isIdle = status === 'idle'

  return (
    <section className="rounded-xl border border-surface-hover/50 bg-surface/50 p-4">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⏱️</span>
          <h2 className="text-sm font-semibold text-text-primary">스톱워치</h2>
        </div>
        {!isIdle && (
          <span className={`rounded-full px-2 py-1 text-xs ${
            isRunning ? 'bg-warm/20 text-warm' : 'bg-yellow-500/20 text-yellow-500'
          }`}>
            {isRunning ? 'RUNNING' : 'PAUSED'}
          </span>
        )}
      </div>

      {/* 경과 시간 */}
      <div className="mb-4 flex flex-col items-center">
        <span className={`font-mono text-4xl font-bold ${
          isRunning ? 'text-glow-warm text-warm' : 'text-text-primary'
        }`}>
          {formatStopwatchTime(elapsed)}
        </span>
        <span className="mt-1 text-xs text-text-muted">
          {isIdle && '시작하려면 버튼을 누르세요'}
          {isRunning && '집중하는 중...'}
          {isPaused && '일시정지됨'}
        </span>
        {/* 최소 시간 안내 */}
        {!isIdle && elapsed < MIN_FOCUS_SECONDS && (
          <span className="mt-1 text-xs text-text-muted">
            5분 이상 집중하면 보상을 받을 수 있어요
          </span>
        )}
      </div>

      {/* 보상 알림 */}
      {showReward && (
        <div className="mb-4 flex animate-pulse items-center justify-center gap-2 rounded-lg bg-yellow-500/20 p-2 text-yellow-500">
          <Coins size={16} />
          <span className="text-sm font-medium">+{lastReward} 코인 획득!</span>
        </div>
      )}

      {/* 컨트롤 버튼 */}
      <div className="flex justify-center gap-2">
        {/* 리셋 버튼 */}
        <button
          onClick={reset}
          disabled={isIdle}
          className="rounded-full bg-background/50 p-3 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          title="리셋"
        >
          <RotateCcw size={18} />
        </button>

        {/* 시작/일시정지 버튼 */}
        <button
          onClick={isRunning ? pause : start}
          className={`rounded-full p-4 font-medium transition-all bg-warm/20 text-warm hover:bg-warm/30 ${
            isRunning ? 'pulse-warm' : ''
          }`}
          title={isRunning ? '일시정지' : '시작'}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>

        {/* 완료 버튼 */}
        <button
          onClick={stop}
          disabled={isIdle}
          className="rounded-full bg-background/50 p-3 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          title="완료"
        >
          <Square size={18} />
        </button>
      </div>
    </section>
  )
}
```

**Step 3: 커밋**

```bash
git add src/components/features/stopwatch/
git commit -m "feat(stopwatch): add Stopwatch component with reward and history integration"
```

---

### Task 4: FocusTab에 스톱워치 통합

**Files:**
- Modify: `src/App.tsx`

**Step 1: import 추가 및 FocusTab에 Stopwatch 배치**

`src/App.tsx` 상단에 import 추가:

```typescript
import { Stopwatch } from './components/features/stopwatch'
```

`FocusTab` 컴포넌트의 `<ScheduleQueue />` 아래에 추가:

```typescript
function FocusTab() {
  return (
    <>
      <Village />
      <ScheduleTimer />
      <ScheduleQueue />
      <Stopwatch />
    </>
  )
}
```

**Step 2: 앱 실행 및 수동 확인**

```bash
npm run dev
```

확인 항목:
1. 집중 탭 하단에 스톱워치 카드가 표시되는지
2. 시작/일시정지/완료/리셋 버튼이 동작하는지
3. 5분 이상 집중 후 완료 시 코인 보상이 표시되는지
4. 집중 기록 서브윈도우에 '자유 집중' 항목이 추가되는지
5. 기존 레이아웃(Village, ScheduleTimer, ScheduleQueue)이 깨지지 않는지

**Step 3: 커밋**

```bash
git add src/App.tsx
git commit -m "feat(stopwatch): integrate Stopwatch into FocusTab"
```

---

### Task 5: 최종 검증 및 엣지 케이스 확인

**Step 1: 엣지 케이스 수동 확인**

1. 스톱워치 동작 중 탭 전환(휴식/일정) 후 복귀 → 시간 정확히 유지되는지
2. 앱 백그라운드 전환 후 복귀 → 경과 시간 즉시 동기화되는지
3. 5분 미만 집중 후 완료 → 보상 없이 리셋되는지
4. 뽀모도로 타이머와 스톱워치 동시 실행 → 서로 간섭 없는지
5. 스톱워치 완료 → FocusHistory에 '자유 집중' 기록 표시되는지

**Step 2: 최종 커밋 (필요 시)**

수정 사항이 있다면 커밋.
