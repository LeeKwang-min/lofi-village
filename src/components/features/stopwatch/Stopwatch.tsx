import { Play, Pause, Square, RotateCcw, Coins } from 'lucide-react'
import { useStopwatch, formatStopwatchTime } from '@/hooks/useStopwatch'
import { useVillageContext } from '@/contexts/VillageContext'
import { scheduleQueueService } from '@/services/schedule'
import { useState, useCallback } from 'react'

const MIN_FOCUS_SECONDS = 5 * 60 // 최소 5분

const COINS_PER_30MIN = 25
const MIN_REWARD = 10

function calculateReward(elapsedSeconds: number): number {
  const minutes = elapsedSeconds / 60
  const reward = Math.floor(minutes / 30) * COINS_PER_30MIN
  return Math.max(reward, MIN_REWARD)
}

export function Stopwatch() {
  const { addCoins, addFocusTime } = useVillageContext()
  const [showReward, setShowReward] = useState(false)
  const [lastReward, setLastReward] = useState(0)

  const handleComplete = useCallback((elapsedSeconds: number) => {
    const elapsedMinutes = Math.round(elapsedSeconds / 60)

    if (elapsedSeconds >= MIN_FOCUS_SECONDS) {
      const reward = calculateReward(elapsedSeconds)

      addCoins(reward)
      addFocusTime(elapsedMinutes)

      // 기록 저장
      scheduleQueueService.addCompletedSession({
        title: '자유 집중',
        emoji: '⏱️',
        durationMinutes: elapsedMinutes,
      })

      // 보상 애니메이션
      setLastReward(reward)
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
