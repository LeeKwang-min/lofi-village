/**
 * 탭 레이아웃 컴포넌트
 * 메인 앱의 콘텐츠를 탭으로 구분하여 표시
 */

import { useState, useEffect, ReactNode } from 'react'
import { Music, Timer, Calendar } from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon: ReactNode
  content: ReactNode
}

interface TabLayoutProps {
  tabs: Tab[]
}

const STORAGE_KEY = 'lofi-village-active-tab'

export function TabLayout({ tabs }: TabLayoutProps) {
  const [activeTab, setActiveTab] = useState(() => {
    // localStorage에서 마지막 선택 탭 복원
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && tabs.some(t => t.id === saved)) {
      return saved
    }
    return tabs[0]?.id || ''
  })

  // 탭 변경 시 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeTab)
  }, [activeTab])

  const currentTab = tabs.find(t => t.id === activeTab)

  return (
    <div className="flex flex-col h-full">
      {/* 탭 헤더 */}
      <div className="flex gap-1 p-2 mx-2 rounded-xl bg-background/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 fade-in custom-scrollbar">
        {currentTab?.content}
      </div>
    </div>
  )
}

// 탭 아이콘 export
export const TabIcons = {
  Music: <Music size={16} />,
  Timer: <Timer size={16} />,
  Calendar: <Calendar size={16} />,
}
