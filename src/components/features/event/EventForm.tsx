/**
 * 일정 추가 폼 컴포넌트 (서브윈도우용)
 */

import { useState } from 'react'
import { Calendar, Clock, MapPin, FileText, Plus } from 'lucide-react'
import { useEventContext } from '@/contexts/EventContext'

interface EventFormProps {
  onSuccess?: () => void
}

export function EventForm({ onSuccess }: EventFormProps) {
  const { addEvent } = useEventContext()

  // 오늘 날짜를 기본값으로
  const today = new Date()
  const defaultDate = today.toISOString().split('T')[0]
  const currentHour = today.getHours()
  const currentMinute = Math.ceil(today.getMinutes() / 15) * 15
  const defaultStartTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute % 60).padStart(2, '0')}`
  const defaultEndTime = `${String(currentHour + 1).padStart(2, '0')}:${String(currentMinute % 60).padStart(2, '0')}`

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [startTime, setStartTime] = useState(defaultStartTime)
  const [endTime, setEndTime] = useState(defaultEndTime)
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 유효성 검사
    if (!title.trim()) {
      setError('제목을 입력해주세요')
      return
    }

    if (!date || !startTime || !endTime) {
      setError('날짜와 시간을 선택해주세요')
      return
    }

    // 시작/종료 시간 계산
    const startTimestamp = new Date(`${date}T${startTime}`).getTime()
    const endTimestamp = new Date(`${date}T${endTime}`).getTime()

    if (isNaN(startTimestamp) || isNaN(endTimestamp)) {
      setError('올바른 날짜/시간을 입력해주세요')
      return
    }

    if (endTimestamp <= startTimestamp) {
      setError('종료 시간은 시작 시간보다 늦어야 합니다')
      return
    }

    // 일정 추가
    addEvent({
      title: title.trim(),
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      startTime: startTimestamp,
      endTime: endTimestamp,
    })

    // 폼 초기화
    setTitle('')
    setLocation('')
    setDescription('')
    setDate(defaultDate)
    setStartTime(defaultStartTime)
    setEndTime(defaultEndTime)

    // 성공 콜백
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 제목 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
          <FileText size={14} />
          제목 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="일정 제목을 입력하세요"
          className="w-full px-3 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cool focus:ring-1 focus:ring-cool/30 transition-colors"
          autoFocus
        />
      </div>

      {/* 날짜 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
          <Calendar size={14} />
          날짜
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          onClick={(e) => (e.target as HTMLInputElement).showPicker()}
          className="w-full px-3 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary focus:outline-none focus:border-cool focus:ring-1 focus:ring-cool/30 transition-colors cursor-pointer"
        />
      </div>

      {/* 시작/종료 시간 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
          <Clock size={14} />
          시간
        </label>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            onClick={(e) => (e.target as HTMLInputElement).showPicker()}
            className="flex-1 px-3 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary focus:outline-none focus:border-cool focus:ring-1 focus:ring-cool/30 transition-colors cursor-pointer"
          />
          <span className="text-text-muted">~</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            onClick={(e) => (e.target as HTMLInputElement).showPicker()}
            className="flex-1 px-3 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary focus:outline-none focus:border-cool focus:ring-1 focus:ring-cool/30 transition-colors cursor-pointer"
          />
        </div>
      </div>

      {/* 장소 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
          <MapPin size={14} />
          장소 <span className="text-text-muted text-xs">(선택)</span>
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="장소를 입력하세요"
          className="w-full px-3 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cool focus:ring-1 focus:ring-cool/30 transition-colors"
        />
      </div>

      {/* 설명 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
          <FileText size={14} />
          설명 <span className="text-text-muted text-xs">(선택)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="추가 설명을 입력하세요"
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-surface-hover bg-background text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cool focus:ring-1 focus:ring-cool/30 transition-colors resize-none"
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-cool text-white font-medium transition-all hover:bg-cool/90 active:scale-[0.98]"
      >
        <Plus size={18} />
        일정 추가
      </button>

      {/* 알림 안내 */}
      <p className="text-xs text-text-muted text-center">
        📢 일정 시작 10분 전에 알림을 받을 수 있습니다
      </p>
    </form>
  )
}
