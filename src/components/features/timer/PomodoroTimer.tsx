import { Play, Pause, RotateCcw, SkipForward, Coins } from 'lucide-react'
import { useTimer, formatTime } from '@/hooks/useTimer'
import { useVillageContext } from '@/contexts/VillageContext'
import { useState } from 'react'

const FOCUS_REWARD = 50 // 집중 완료 시 보상 코인

export function PomodoroTimer() {
  const { addCoins, addFocusTime } = useVillageContext()
  const [showReward, setShowReward] = useState(false)

  const { timeLeft, status, mode, progress, start, pause, reset, skip } = useTimer({
    focusMinutes: 60,
    breakMinutes: 10,
    onComplete: (completedMode) => {
      if (completedMode === 'focus') {
        // 집중 세션 완료 시 코인 지급
        addCoins(FOCUS_REWARD)
        addFocusTime(25)

        // 보상 알림 표시
        setShowReward(true)
        setTimeout(() => setShowReward(false), 2000)
      }
      console.log(`${completedMode === 'focus' ? '집중' : '휴식'} 시간 완료!`)
    }
  })

  const isRunning = status === 'running'
  const isFocus = mode === 'focus'

  return (
    <section className="p-4 rounded-xl border border-surface-hover/50 bg-surface/50">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
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
            {status === 'idle' && '시작하려면 버튼을 누르세요'}
            {status === 'running' && (isFocus ? '집중하는 중...' : '쉬는 중...')}
            {status === 'paused' && '일시정지됨'}
          </span>
        </div>
      </div>

      {/* 보상 알림 */}
      {showReward && (
        <div className="flex gap-2 justify-center items-center p-2 mb-4 text-yellow-500 rounded-lg animate-pulse bg-yellow-500/20">
          <Coins size={16} />
          <span className="text-sm font-medium">+{FOCUS_REWARD} 코인 획득!</span>
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
          className="p-3 rounded-full transition-colors bg-background/50 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          title="스킵"
        >
          <SkipForward size={18} />
        </button>
      </div>
    </section>
  )
}
