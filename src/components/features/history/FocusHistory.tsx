/**
 * 집중 기록 컴포넌트
 * 완료된 집중 세션들의 기록을 표시합니다
 */

import { useState, useEffect } from 'react'
import { Clock, Calendar, Trash2, TrendingUp } from 'lucide-react'
import { scheduleQueueService } from '@/services/schedule'
import { ScheduleItem } from '@/types/schedule'

interface GroupedHistory {
  date: string
  dateLabel: string
  items: ScheduleItem[]
  totalMinutes: number
}

// 날짜별로 그룹화
function groupByDate(items: ScheduleItem[]): GroupedHistory[] {
  const groups: Map<string, ScheduleItem[]> = new Map()

  items.forEach(item => {
    const date = item.completedAt || item.createdAt
    const dateKey = date.toISOString().split('T')[0]
    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(item)
  })

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  return Array.from(groups.entries())
    .map(([date, items]) => {
      let dateLabel = date
      if (date === today) {
        dateLabel = '오늘'
      } else if (date === yesterday) {
        dateLabel = '어제'
      } else {
        const d = new Date(date)
        dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일`
      }

      const totalMinutes = items
        .filter(i => i.type === 'focus')
        .reduce((sum, i) => sum + i.durationMinutes, 0)

      return { date, dateLabel, items, totalMinutes }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

// 시간 포맷팅
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`
}

// 완료 시간 포맷팅
function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface FocusHistoryProps {
  isStandalone?: boolean  // 별도 창에서 사용할 때 true
}

export function FocusHistory({ isStandalone = false }: FocusHistoryProps) {
  const [history, setHistory] = useState<GroupedHistory[]>([])
  const [totalStats, setTotalStats] = useState({ sessions: 0, minutes: 0 })

  // 데이터 로드
  const loadHistory = () => {
    const queue = scheduleQueueService.getQueue()
    const completed = queue.filter(
      item => item.status === 'completed' && item.type === 'focus'
    )

    const grouped = groupByDate(completed)
    setHistory(grouped)

    // 전체 통계
    const totalMinutes = completed.reduce((sum, i) => sum + i.durationMinutes, 0)
    setTotalStats({ sessions: completed.length, minutes: totalMinutes })
  }

  useEffect(() => {
    loadHistory()

    // 큐 업데이트 이벤트 구독
    const unsubscribe = scheduleQueueService.on('queue-updated', loadHistory)
    return () => unsubscribe()
  }, [])

  const handleClearHistory = () => {
    if (confirm('모든 완료된 기록을 삭제하시겠습니까?')) {
      scheduleQueueService.clearCompleted()
      loadHistory()
    }
  }

  return (
    <div className={`${isStandalone ? 'h-full flex flex-col' : ''}`}>
      {/* 전체 통계 */}
      <div className="p-4 mb-4 rounded-xl border border-warm/20 bg-warm/5">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <TrendingUp size={18} className="text-warm" />
            <span className="text-sm font-medium text-text-primary">총 집중 기록</span>
          </div>
          <div className="flex gap-4 ml-auto text-sm">
            <span className="text-text-secondary">
              <span className="font-bold text-warm">{totalStats.sessions}</span> 세션
            </span>
            <span className="text-text-secondary">
              <span className="font-bold text-warm">{formatDuration(totalStats.minutes)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 기록 목록 */}
      <div className={`space-y-4 ${isStandalone ? 'flex-1 overflow-y-auto custom-scrollbar' : 'max-h-80 overflow-y-auto custom-scrollbar'}`}>
        {history.length === 0 ? (
          <div className="py-8 text-center text-text-muted">
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">아직 완료된 집중 기록이 없습니다</p>
            <p className="mt-1 text-xs">집중 세션을 완료하면 여기에 기록됩니다</p>
          </div>
        ) : (
          history.map(group => (
            <div key={group.date} className="space-y-2">
              {/* 날짜 헤더 */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <Calendar size={14} className="text-text-muted" />
                  <span className="text-sm font-medium text-text-primary">{group.dateLabel}</span>
                </div>
                <span className="text-xs text-text-muted">
                  {formatDuration(group.totalMinutes)} 집중
                </span>
              </div>

              {/* 해당 날짜의 기록들 */}
              <div className="space-y-1">
                {group.items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                  >
                    <span className="text-lg">
                      {item.type === 'focus' ? '🎯' : '☕'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{item.title}</p>
                      <p className="text-xs text-text-muted">
                        {item.completedAt && formatTime(item.completedAt)} · {item.durationMinutes}분
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 기록 정리 버튼 */}
      {history.length > 0 && (
        <div className="pt-3 mt-4 border-t border-surface-hover/30">
          <button
            onClick={handleClearHistory}
            className="flex gap-1 items-center text-xs transition-colors text-text-muted hover:text-red-400"
          >
            <Trash2 size={12} />
            <span>모든 기록 삭제</span>
          </button>
        </div>
      )}
    </div>
  )
}
