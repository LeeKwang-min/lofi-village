# Stopwatch Feature Design

## Summary

집중 탭에 자유 집중 측정용 스톱워치를 추가한다. 뽀모도로의 고정 시간 제한 없이 시작~종료까지 경과 시간을 측정하고, 코인 보상과 집중 기록에 반영한다.

## Requirements

- 자유 집중 측정 (카운트업, 시간 제한 없음)
- 코인 보상: 30분당 25코인 (비례), 최소 5분 이상
- 집중 기록(FocusHistory)에 반영
- 마을 시스템 집중 시간(addFocusTime) 반영
- ActiveSessionController 연동 없음

## Architecture

### Approach: 독립 컴포넌트 + 독립 훅

카운트다운(useTimer)과 카운트업(useStopwatch)은 상태 머신이 근본적으로 다르므로 분리한다.

### New Files

```
src/hooks/useStopwatch.ts                    # 카운트업 로직
src/components/features/stopwatch/Stopwatch.tsx  # UI 컴포넌트
src/components/features/stopwatch/index.ts       # barrel export
```

### Modified Files

```
src/App.tsx  # FocusTab에 <Stopwatch /> 추가
```

## Hook Design: useStopwatch

### State

- `elapsed: number` — 경과 시간(초)
- `status: 'idle' | 'running' | 'paused'`

### Time Calculation

- `startAt` ref 기반: `Date.now() - startAt + accumulatedTime`
- pause 시 `accumulatedTime`에 경과 시간 누적
- 200ms interval로 체크 (useTimer와 동일)

### Background Handling

- `window.electronAPI.onVisibilityChanged()` 리스너
- visible 복귀 시 `elapsed` 즉시 동기화

### API

```typescript
interface UseStopwatchReturn {
  elapsed: number
  status: StopwatchStatus
  start: () => void
  pause: () => void
  stop: () => void   // 완료 → onComplete(elapsedSeconds) 호출
  reset: () => void
}
```

## Component Design: Stopwatch

### Layout (집중 탭 하단)

```
┌─────────────────────────────────┐
│ ⏱️ 스톱워치                      │
├─────────────────────────────────┤
│         00:12:34                │
│      집중하는 중...              │
│     [리셋] [▶/⏸] [⏹ 완료]      │
│   +25 코인 획득! (완료 시)       │
└─────────────────────────────────┘
```

- 기존 카드 스타일 통일: `rounded-xl border border-surface-hover/50 bg-surface/50 p-4`
- 프로그레스 링 없음 (진행률 개념 부재)
- HH:MM:SS 포맷 (1시간 미만 시 MM:SS)

### Controls

| Button | Condition | Action |
|--------|-----------|--------|
| 시작 ▶ | idle/paused | start() |
| 일시정지 ⏸ | running | pause() |
| 완료 ⏹ | running/paused | stop() → 보상 + 기록 |
| 리셋 ⟳ | any (not idle) | reset() |

## Reward & History Integration

### Reward Calculation

```
coins = Math.floor(elapsedMinutes / 30) * 25
focusMinutes = Math.round(elapsed / 60)
```

- 최소 5분 이상 집중 시에만 보상 지급
- VillageContext의 `addCoins()`, `addFocusTime()` 사용

### History

`scheduleQueueService.addCompletedItem()` 또는 직접 큐에 추가:

```typescript
{
  type: 'focus',
  title: '자유 집중',
  emoji: '⏱️',
  source: 'manual',
  status: 'completed',
  durationMinutes: Math.round(elapsed / 60),
  completedAt: new Date()
}
```

기존 FocusHistory 서브윈도우에서 자동으로 표시된다.

## Concurrent Execution

스톱워치와 뽀모도로/스케줄 타이머는 독립적으로 동작. 동시 실행을 제한하지 않음.
