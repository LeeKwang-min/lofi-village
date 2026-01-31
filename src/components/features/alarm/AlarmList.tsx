/**
 * 알람 리스트 컴포넌트
 */

import { useState } from 'react'
import { Bell, Plus, X, Check, Trash2, Volume2, VolumeX } from 'lucide-react'
import { useAlarmContext } from '@/contexts/AlarmContext'
import {
  AlarmItem,
  DayOfWeek,
  DAY_LABELS,
  formatAlarmTime,
  getRepeatText
} from '@/types/alarm'

const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export function AlarmList() {
  const { alarms, addAlarm, deleteAlarm, toggleAlarm } = useAlarmContext()
  const [isAdding, setIsAdding] = useState(false)

  return (
    <section className="flex flex-col flex-1 p-4 rounded-xl border border-surface-hover/50 bg-surface/50">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <div className="flex gap-2 items-center">
          <Bell size={16} className="text-warm" />
          <h3 className="text-sm font-medium text-text-primary">알람</h3>
          <span className="text-xs text-text-muted">{alarms.filter(a => a.enabled).length}개 활성</span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="p-1.5 rounded-lg text-text-muted hover:text-warm hover:bg-warm/10 transition-colors"
          title="알람 추가"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* 알람 리스트 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {alarms.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <Bell size={32} className="text-text-muted mb-2 opacity-50" />
            <p className="text-xs text-text-muted">알람이 없습니다</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-2 text-xs text-warm hover:underline"
            >
              알람 추가하기
            </button>
          </div>
        ) : (
          <>
            {alarms.map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onToggle={() => toggleAlarm(alarm.id)}
                onDelete={() => deleteAlarm(alarm.id)}
              />
            ))}
          </>
        )}

        {/* 추가 폼 */}
        {isAdding && (
          <AlarmForm
            onSubmit={(data) => {
              addAlarm(data)
              setIsAdding(false)
            }}
            onCancel={() => setIsAdding(false)}
          />
        )}
      </div>
    </section>
  )
}

interface AlarmCardProps {
  alarm: AlarmItem
  onToggle: () => void
  onDelete: () => void
}

function AlarmCard({ alarm, onToggle, onDelete }: AlarmCardProps) {
  const handleDelete = () => {
    if (confirm('이 알람을 삭제할까요?')) {
      onDelete()
    }
  }

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        alarm.enabled
          ? 'border-warm/30 bg-warm/5'
          : 'border-surface-hover/30 bg-surface-hover/10 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* 시간 & 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-medium ${alarm.enabled ? 'text-text-primary' : 'text-text-muted'}`}>
              {formatAlarmTime(alarm.time)}
            </span>
            {alarm.useTTS && (
              <Volume2 size={12} className="text-text-muted" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {alarm.label && (
              <span className="text-xs text-text-secondary truncate">{alarm.label}</span>
            )}
            <span className="text-[10px] text-text-muted">
              {getRepeatText(alarm.repeatDays)}
            </span>
          </div>
        </div>

        {/* 액션 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="p-1.5 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="삭제"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onToggle}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              alarm.enabled ? 'bg-warm' : 'bg-surface-hover'
            }`}
            title={alarm.enabled ? '끄기' : '켜기'}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                alarm.enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

interface AlarmFormProps {
  onSubmit: (data: Omit<AlarmItem, 'id' | 'lastTriggered'>) => void
  onCancel: () => void
}

function AlarmForm({ onSubmit, onCancel }: AlarmFormProps) {
  const now = new Date()
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(Math.ceil(now.getMinutes() / 5) * 5 % 60).padStart(2, '0')}`

  const [time, setTime] = useState(defaultTime)
  const [label, setLabel] = useState('')
  const [repeatDays, setRepeatDays] = useState<DayOfWeek[]>([])
  const [useTTS, setUseTTS] = useState(true)

  const toggleDay = (day: DayOfWeek) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      time,
      label: label.trim() || undefined,
      repeatDays,
      enabled: true,
      useTTS
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 rounded-lg border border-warm/30 bg-warm/5 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-text-primary">⏰ 새 알람</h4>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {/* 시간 */}
        <div>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            onClick={(e) => (e.target as HTMLInputElement).showPicker()}
            className="w-full px-3 py-2 text-lg font-medium text-center rounded-md border border-surface-hover bg-background text-text-primary focus:border-warm focus:outline-none cursor-pointer"
          />
        </div>

        {/* 레이블 */}
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="알람 이름 (선택)"
          className="w-full px-3 py-2 text-sm rounded-md border border-surface-hover bg-background text-text-primary placeholder:text-text-muted focus:border-warm focus:outline-none"
        />

        {/* 반복 요일 */}
        <div>
          <p className="text-xs text-text-muted mb-2">반복 요일 (선택 안 하면 매일)</p>
          <div className="flex gap-1">
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                  repeatDays.includes(day)
                    ? 'bg-warm text-white'
                    : 'bg-surface-hover/50 text-text-muted hover:bg-surface-hover'
                }`}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>

        {/* TTS 옵션 */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useTTS}
            onChange={(e) => setUseTTS(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-8 h-4 rounded-full transition-colors ${
              useTTS ? 'bg-warm' : 'bg-surface-hover'
            }`}
          >
            <div
              className={`w-3 h-3 mt-0.5 rounded-full bg-white shadow transition-transform ${
                useTTS ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </div>
          <span className="text-xs text-text-secondary flex items-center gap-1">
            {useTTS ? <Volume2 size={12} /> : <VolumeX size={12} />}
            음성 알림
          </span>
        </label>

        {/* 버튼 */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 text-xs text-text-muted hover:bg-surface-hover rounded-md transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 py-2 text-xs text-white bg-warm hover:bg-warm/90 rounded-md transition-colors flex items-center justify-center gap-1"
          >
            <Check size={12} />
            추가
          </button>
        </div>
      </div>
    </form>
  )
}
