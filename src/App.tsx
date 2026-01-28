import { AppShell } from './components/layout/AppShell'
import { SoundMixer } from './components/features/sound-mixer'
import { PomodoroTimer } from './components/features/timer'
import { FortuneCookie } from './components/features/fortune'
import { TaskList } from './components/features/tasks'
import { Village } from './components/features/village'
import { VillageProvider } from './contexts/VillageContext'

function App() {
  return (
    <VillageProvider>
      <AppShell>
        <div className="p-4 space-y-4 fade-in">
          {/* 사운드 믹서 */}
          <SoundMixer />

          {/* 포모도로 타이머 */}
          <PomodoroTimer />

          {/* 마을 시스템 */}
          <Village />

          {/* 포츈 쿠키 */}
          <FortuneCookie />

          {/* 할 일 목록 */}
          <TaskList />
        </div>
      </AppShell>
    </VillageProvider>
  )
}

export default App
