/**
 * 일정 큐 UI 컴포넌트
 * - 일정 추가 폼 (프리셋 선택)
 * - 현재 진행 중 항목 표시
 * - 다음 일정 미리보기
 * - 대기 중인 일정 목록
 */

import { useState } from 'react'
import { Plus, X, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useScheduleContext } from '@/contexts/ScheduleContext'
import { DEFAULT_PRESETS, calculateBreakMinutes, ScheduleItem } from '@/types/schedule'

// 아이템의 이모지를 가져오는 헬퍼 함수
function getItemEmoji(item: ScheduleItem): string {
  if (item.emoji) return item.emoji
  if (item.type === 'break') return '☕'
  return '🎯' // 기본 집중 이모지
}

export function ScheduleQueue() {
  const {
    currentItem,
    nextItem,
    pendingItems,
    queueStats,
    addPreset,
    addFocusSession,
    removeItem,
    clearCompleted
  } = useScheduleContext()

  const [isExpanded, setIsExpanded] = useState(true)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customMinutes, setCustomMinutes] = useState(45)

  const handleAddPreset = (preset: (typeof DEFAULT_PRESETS)[number]) => {
    addPreset(preset)
  }

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (customTitle.trim() && customMinutes > 0) {
      addFocusSession(customTitle.trim(), customMinutes, true)
      setCustomTitle('')
      setCustomMinutes(45)
      setShowCustomForm(false)
    }
  }

  // 대기 중인 일정 (현재 활성화된 것 제외)
  const waitingItems = pendingItems.filter((item) => item.id !== currentItem?.id)

  return (
    <section className="rounded-xl border border-surface-hover/50 bg-surface/50 p-4">
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-4 flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <h2 className="text-sm font-semibold text-text-primary">일정 큐</h2>
          {queueStats.pendingItems > 0 && (
            <span className="rounded-full bg-warm/20 px-2 py-0.5 text-xs text-warm">
              {queueStats.pendingItems}개 대기
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <>
          {/* 프리셋 버튼 - 그리드 레이아웃 */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            {DEFAULT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleAddPreset(preset)}
                className="flex flex-col items-center gap-1 rounded-xl border border-surface-hover/50 bg-background/30 p-3 transition-all hover:scale-[1.02] hover:border-warm/30 hover:bg-warm/10 active:scale-[0.98]"
              >
                <span className="text-xl">{preset.emoji}</span>
                <span className="text-xs font-medium text-text-primary">{preset.name}</span>
                <span className="text-[10px] text-text-muted">{preset.focusMinutes}분</span>
              </button>
            ))}
            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                showCustomForm
                  ? 'border-cool/50 bg-cool/10'
                  : 'border-dashed border-surface-hover bg-background/30 hover:border-cool/30 hover:bg-cool/10'
              }`}
            >
              <Plus size={20} className={showCustomForm ? 'text-cool' : 'text-text-muted'} />
              <span
                className={`text-xs font-medium ${showCustomForm ? 'text-cool' : 'text-text-secondary'}`}
              >
                커스텀
              </span>
              <span className="text-[10px] text-text-muted">직접 설정</span>
            </button>
          </div>

          {/* 커스텀 폼 */}
          {showCustomForm && (
            <form onSubmit={handleAddCustom} className="mb-4 rounded-lg bg-background/50 p-3">
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="일정 제목"
                  className="rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm focus:border-warm focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(5, parseInt(e.target.value) || 5))}
                    min={5}
                    max={240}
                    className="w-20 rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm focus:border-warm focus:outline-none"
                  />
                  <span className="text-sm text-text-muted">분 집중</span>
                  <span className="text-xs text-text-muted">
                    (휴식 {calculateBreakMinutes(customMinutes)}분)
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-warm/20 px-3 py-2 text-sm text-warm transition-colors hover:bg-warm/30"
                  >
                    추가
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="rounded-lg bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
                  >
                    취소
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 현재 진행 중 */}
          {currentItem && (
            <div className="mb-3 rounded-lg border-2 border-warm/30 bg-warm/10 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getItemEmoji(currentItem)}</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{currentItem.title}</p>
                    <p className="text-xs text-text-muted">
                      {currentItem.durationMinutes}분{' '}
                      {currentItem.type === 'focus' ? '집중' : '휴식'} 진행 중
                    </p>
                  </div>
                </div>
                <span className="animate-pulse rounded-full bg-warm/20 px-2 py-1 text-xs text-warm">
                  진행 중
                </span>
              </div>
            </div>
          )}

          {/* 다음 일정 미리보기 */}
          {nextItem && nextItem.id !== currentItem?.id && (
            <div className="mb-3 rounded-lg border border-surface-hover/30 bg-background/30 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-text-muted" />
                  <span className="text-xs text-text-muted">다음:</span>
                  <span className="text-sm">{getItemEmoji(nextItem)}</span>
                  <span className="text-sm text-text-secondary">{nextItem.title}</span>
                  <span className="text-xs text-text-muted">({nextItem.durationMinutes}분)</span>
                </div>
                <button
                  onClick={() => removeItem(nextItem.id)}
                  className="rounded p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* 대기 중인 일정 목록 */}
          {waitingItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-muted">대기 중</p>
              {waitingItems.slice(0, 5).map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-background/20 p-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs text-text-muted">{index + 1}</span>
                    <span className="text-sm">{getItemEmoji(item)}</span>
                    <span className="text-sm text-text-secondary">{item.title}</span>
                    <span className="text-xs text-text-muted">({item.durationMinutes}분)</span>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="rounded p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {waitingItems.length > 5 && (
                <p className="text-center text-xs text-text-muted">
                  +{waitingItems.length - 5}개 더...
                </p>
              )}
            </div>
          )}

          {/* 통계 및 정리 */}
          {queueStats.completedItems > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-surface-hover/30 pt-3">
              <span className="text-xs text-text-muted">
                완료: {queueStats.completedItems}개 ({queueStats.completedFocusMinutes}분)
              </span>
              <button
                onClick={clearCompleted}
                className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-red-400"
              >
                <Trash2 size={12} />
                <span>완료 항목 정리</span>
              </button>
            </div>
          )}

          {/* 빈 상태 */}
          {queueStats.totalItems === 0 && (
            <div className="py-6 text-center text-text-muted">
              <p className="text-sm">일정이 없습니다</p>
              <p className="mt-1 text-xs">위의 프리셋을 선택하거나 커스텀 일정을 추가하세요</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
