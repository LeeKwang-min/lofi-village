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
import { VillageProvider } from './contexts/VillageContext'
import { ScheduleProvider } from './contexts/ScheduleContext'
import { SoundProvider } from './contexts/SoundContext'
import { YouTubeProvider } from './contexts/YouTubeContext'

// URL 쿼리 파라미터에서 창 타입 가져오기
function getWindowType(): 'main' | 'tasks' | 'history' | 'memo' {
  const params = new URLSearchParams(window.location.search)
  const windowType = params.get('window')
  if (windowType === 'tasks' || windowType === 'history' || windowType === 'memo') {
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

// 메인 앱 컴포넌트
function MainApp() {
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
    }
  ]

  return (
    <SoundProvider>
      <YouTubeProvider>
        <VillageProvider>
          <ScheduleProvider>
            <AppShell>
              <TabLayout tabs={tabs} />
            </AppShell>
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

function App() {
  const windowType = getWindowType()

  switch (windowType) {
    case 'tasks':
      return <TasksWindow />
    case 'history':
      return <HistoryWindow />
    case 'memo':
      return <MemoWindow />
    default:
      return <MainApp />
  }
}

export default App
