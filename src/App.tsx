import { useEffect, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { SubWindowShell } from './components/layout/SubWindowShell'
import { TabLayout, TabIcons } from './components/layout/TabLayout'
import { SoundMixer } from './components/features/sound-mixer'
import { ScheduleTimer, ScheduleQueue } from './components/features/schedule'
import { FortuneCookie } from './components/features/fortune'
import { TaskList } from './components/features/tasks'
import { Village } from './components/features/village'
import { FocusHistory } from './components/features/history'
import { QuickActions } from './components/features/quick-actions'
import { Memo } from './components/features/memo'
import { EventForm, TodayEventList } from './components/features/event'
import { AlarmList } from './components/features/alarm'
import { VillageProvider } from './contexts/VillageContext'
import { ScheduleProvider } from './contexts/ScheduleContext'
import { SoundProvider } from './contexts/SoundContext'
import { YouTubeProvider } from './contexts/YouTubeContext'
import { EventProvider } from './contexts/EventContext'
import { AlarmProvider } from './contexts/AlarmContext'
import { useEventReminder } from './hooks/useEventReminder'
import { useAlarmReminder } from './hooks/useAlarmReminder'

// GPU 컨텍스트 복구 및 메모리 관리를 위한 커스텀 훅
function useGPUContextRecovery() {
  const [, setForceUpdate] = useState(0)

  useEffect(() => {
    const forceRepaint = () => {
      setForceUpdate(prev => prev + 1)
      window.dispatchEvent(new Event('resize'))
    }

    const unsubscribeVisibility = window.electronAPI?.onVisibilityChanged?.((visible) => {
      if (visible) {
        forceRepaint()
      }
    })

    const unsubscribeFocus = window.electronAPI?.onFocused?.(() => {
      forceRepaint()
    })

    const unsubscribeRestore = window.electronAPI?.onRestored?.(() => {
      forceRepaint()
    })

    const unsubscribeGPU = window.electronAPI?.onGPURecovered?.(() => {
      forceRepaint()
    })

    const unsubscribeMemory = window.electronAPI?.onMemoryPressure?.(() => {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
      setForceUpdate(0)
    })

    return () => {
      unsubscribeVisibility?.()
      unsubscribeFocus?.()
      unsubscribeRestore?.()
      unsubscribeGPU?.()
      unsubscribeMemory?.()
    }
  }, [])
}

// URL 쿼리 파라미터에서 창 타입 가져오기
function getWindowType(): 'main' | 'tasks' | 'history' | 'memo' | 'schedule' {
  const params = new URLSearchParams(window.location.search)
  const windowType = params.get('window')
  if (windowType === 'tasks' || windowType === 'history' || windowType === 'memo' || windowType === 'schedule') {
    return windowType
  }
  return 'main'
}

// 첫 번째 탭: 휴식 & 영감
function RelaxTab() {
  return (
    <>
      {/* 사운드 믹서 */}
      <SoundMixer />

      {/* 오늘의 한마디 */}
      <FortuneCookie />

      {/* 빠른 실행 버튼 */}
      <QuickActions />
    </>
  )
}

// 두 번째 탭: 집중 & 생산성
function FocusTab() {
  return (
    <>
      {/* 마을 시스템 */}
      <Village />

      {/* 스케줄 타이머 */}
      <ScheduleTimer />

      {/* 일정 큐 */}
      <ScheduleQueue />
    </>
  )
}

// 세 번째 탭: 일정 관리
function CalendarTab() {
  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      {/* 오늘의 일정 타임라인 */}
      <TodayEventList />
      {/* 알람 */}
      <AlarmList />
    </div>
  )
}

// 알림 활성화 래퍼 (일정 + 알람)
function ReminderWrapper({ children }: { children: React.ReactNode }) {
  useEventReminder()
  useAlarmReminder()
  return <>{children}</>
}

// 메인 앱 컴포넌트
function MainApp() {
  // GPU 컨텍스트 복구 훅 활성화
  useGPUContextRecovery()

  const tabs = [
    {
      id: 'relax',
      label: '휴식',
      icon: TabIcons.Music,
      content: <RelaxTab />
    },
    {
      id: 'focus',
      label: '집중',
      icon: TabIcons.Timer,
      content: <FocusTab />
    },
    {
      id: 'calendar',
      label: '일정',
      icon: TabIcons.Calendar,
      content: <CalendarTab />
    }
  ]

  return (
    <SoundProvider>
      <YouTubeProvider>
        <VillageProvider>
          <ScheduleProvider>
            <EventProvider>
              <AlarmProvider>
                <ReminderWrapper>
                  <AppShell>
                    <TabLayout tabs={tabs} />
                  </AppShell>
                </ReminderWrapper>
              </AlarmProvider>
            </EventProvider>
          </ScheduleProvider>
        </VillageProvider>
      </YouTubeProvider>
    </SoundProvider>
  )
}

// 할 일 목록 서브 윈도우
function TasksWindow() {
  return (
    <SubWindowShell title="오늘의 할 일" emoji="📝">
      <TaskList isStandalone />
    </SubWindowShell>
  )
}

// 집중 기록 서브 윈도우
function HistoryWindow() {
  return (
    <SubWindowShell title="집중 기록" emoji="📊">
      <FocusHistory isStandalone />
    </SubWindowShell>
  )
}

// 메모장 서브 윈도우
function MemoWindow() {
  return (
    <SubWindowShell title="메모장" emoji="📝">
      <Memo isStandalone />
    </SubWindowShell>
  )
}

// 일정 추가 서브 윈도우
function ScheduleWindow() {
  const handleSuccess = () => {
    // 일정 추가 성공 시 창 닫기
    window.subWindowAPI?.closeSelf()
  }

  return (
    <EventProvider>
      <SubWindowShell title="일정 추가" emoji="📅">
        <EventForm onSuccess={handleSuccess} />
      </SubWindowShell>
    </EventProvider>
  )
}

function App() {
  const windowType = getWindowType()

  switch (windowType) {
    case 'tasks':
      return <TasksWindow />
    case 'history':
      return <HistoryWindow />
    case 'memo':
      return <MemoWindow />
    case 'schedule':
      return <ScheduleWindow />
    default:
      return <MainApp />
  }
}

export default App
