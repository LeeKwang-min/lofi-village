/**
 * Schedule Context Provider
 * useScheduleTimer 훅을 전역에서 사용할 수 있도록 Context로 래핑
 */

import { createContext, useContext, ReactNode } from 'react'
import { useScheduleTimer } from '@/hooks/useScheduleTimer'
import { useVillageContext } from '@/contexts/VillageContext'
import { ScheduleItem } from '@/types/schedule'

// useScheduleTimer의 반환 타입
type ScheduleContextType = ReturnType<typeof useScheduleTimer>

const ScheduleContext = createContext<ScheduleContextType | null>(null)

interface ScheduleProviderProps {
  children: ReactNode
}

// 집중 완료 시 보상 코인 (기존 PomodoroTimer와 동일)
const FOCUS_REWARD_PER_30MIN = 25

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const { addCoins, addFocusTime } = useVillageContext()

  const schedule = useScheduleTimer({
    onItemComplete: (item: ScheduleItem) => {
      // 집중 세션 완료 시 보상 지급
      if (item.type === 'focus') {
        // 30분당 25코인 비율로 보상
        const reward = Math.floor((item.durationMinutes / 30) * FOCUS_REWARD_PER_30MIN)
        addCoins(reward)
        addFocusTime(item.durationMinutes)
      }
    },
  })

  return (
    <ScheduleContext.Provider value={schedule}>
      {children}
    </ScheduleContext.Provider>
  )
}

/**
 * Schedule Context 사용 훅
 */
export function useScheduleContext() {
  const context = useContext(ScheduleContext)
  if (!context) {
    throw new Error('useScheduleContext must be used within a ScheduleProvider')
  }
  return context
}
