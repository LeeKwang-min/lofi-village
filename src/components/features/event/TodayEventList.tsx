/**
 * 오늘의 일정 타임라인 컴포넌트
 * 시간 흐름을 시각적으로 보여주는 블록 형식 UI
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { Calendar, Clock, MapPin, Plus, X, Check, Trash2, Edit3 } from 'lucide-react'
import { useEventContext } from '@/contexts/EventContext'
import { EventItem, getEventStatus, formatEventTime } from '@/types/event'

// 타임라인 설정
const HOUR_HEIGHT = 50 // 1시간당 픽셀 높이
const START_HOUR = 0 // 시작 시간 (00:00)
const END_HOUR = 24 // 종료 시간 (24:00)
const TOTAL_HOURS = END_HOUR - START_HOUR

// 모드 타입
type Mode = 'view' | 'add' | 'edit'

export function TodayEventList() {
  const { todayEvents, addEvent, updateEvent, deleteEvent } = useEventContext()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [mode, setMode] = useState<Mode>('view')
  const [newEventTime, setNewEventTime] = useState<number | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // 현재 시간 업데이트 (1분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // 현재 시간 위치 계산
  const currentTimePosition = useMemo(() => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    const totalMinutes = (hours - START_HOUR) * 60 + minutes
    return (totalMinutes / 60) * HOUR_HEIGHT
  }, [currentTime])

  // 마운트 시 현재 시간 위치로 스크롤
  useEffect(() => {
    if (timelineRef.current) {
      const scrollPosition = currentTimePosition - 60 // 현재 시간이 상단에서 약간 아래에 오도록
      timelineRef.current.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      })
    }
  }, []) // 마운트 시 한 번만 실행

  // 시간 레이블 생성
  const timeLabels = useMemo(() => {
    const labels = []
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      labels.push({
        hour,
        label: `${String(hour).padStart(2, '0')}:00`
      })
    }
    return labels
  }, [])

  // 타임라인 클릭 시 해당 시간에 일정 추가
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'view') return

    const rect = e.currentTarget.getBoundingClientRect()
    const scrollTop = e.currentTarget.scrollTop
    const clickY = e.clientY - rect.top + scrollTop

    // 클릭 위치를 시간으로 변환
    const totalMinutes = (clickY / HOUR_HEIGHT) * 60
    const hours = Math.floor(totalMinutes / 60) + START_HOUR
    const minutes = Math.round((totalMinutes % 60) / 15) * 15 // 15분 단위로 반올림

    // 오늘 날짜에 해당 시간 설정
    const today = new Date()
    today.setHours(hours, minutes, 0, 0)

    setNewEventTime(today.getTime())
    setMode('add')
    setSelectedEvent(null)
  }

  // 일정 선택
  const handleSelectEvent = (event: EventItem) => {
    if (mode === 'add') return
    setSelectedEvent(selectedEvent?.id === event.id ? null : event)
    setMode('view')
    setNewEventTime(null)
  }

  // 수정 모드 진입
  const handleEditMode = () => {
    setMode('edit')
  }

  // 취소
  const handleCancel = () => {
    setMode('view')
    setNewEventTime(null)
    if (mode === 'add') {
      setSelectedEvent(null)
    }
  }

  // 일정 추가 완료
  const handleAddEvent = (data: {
    title: string
    location?: string
    description?: string
    startTime: number
    endTime: number
  }) => {
    addEvent({
      title: data.title,
      location: data.location,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime
    })
    setMode('view')
    setNewEventTime(null)
  }

  // 일정 수정 완료
  const handleUpdateEvent = (data: {
    title: string
    location?: string
    description?: string
    startTime: number
    endTime: number
  }) => {
    if (!selectedEvent) return
    updateEvent(selectedEvent.id, {
      title: data.title,
      location: data.location,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime
    })
    setSelectedEvent({ ...selectedEvent, ...data, startTime: data.startTime, endTime: data.endTime })
    setMode('view')
  }

  // 일정 삭제
  const handleDeleteEvent = () => {
    if (!selectedEvent) return
    if (confirm('이 일정을 삭제할까요?')) {
      deleteEvent(selectedEvent.id)
      setSelectedEvent(null)
      setMode('view')
    }
  }

  return (
    <section className="flex flex-col h-1/2 p-4 rounded-xl border border-surface-hover/50 bg-surface/50">
      {/* 헤더 */}
      <div className="flex flex-shrink-0 justify-between items-center mb-3">
        <div className="flex gap-2 items-center">
          <Calendar size={16} className="text-cool" />
          <h3 className="text-sm font-medium text-text-primary">오늘의 일정</h3>
          <span className="text-xs text-text-muted">{todayEvents.length}개</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-text-muted">
          <span className="rounded bg-surface-hover/50 px-1.5 py-0.5">클릭하여 추가</span>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="overflow-hidden relative flex-1 min-h-0 rounded-lg border border-surface-hover/30 bg-background/50">
        <div
          ref={timelineRef}
          className="overflow-y-auto py-3 h-full custom-scrollbar"
          onClick={handleTimelineClick}
        >
          <div className="relative pt-3" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
            {/* 시간 그리드 라인 */}
            {timeLabels.map(({ hour, label }) => (
              <div
                key={hour}
                className="absolute right-0 left-0 border-t border-surface-hover/30"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
              >
                <span className="absolute -top-2.5 left-2 rounded bg-background/90 px-1 text-[10px] text-text-muted">
                  {label}
                </span>
              </div>
            ))}

            {/* 현재 시간 인디케이터 */}
            <div
              className="absolute right-0 left-0 z-20 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="flex items-center">
                <div className="-ml-1 w-2 h-2 bg-red-500 rounded-full" />
                <div className="h-[2px] flex-1 bg-red-500/70" />
              </div>
            </div>

            {/* 새 일정 추가 위치 표시 */}
            {mode === 'add' && newEventTime && <NewEventIndicator time={newEventTime} />}

            {/* 일정 블록들 */}
            <div className="absolute inset-0 right-2 left-12 pointer-events-none">
              {todayEvents.map((event) => (
                <EventBlock
                  key={event.id}
                  event={event}
                  isSelected={selectedEvent?.id === event.id}
                  onSelect={() => handleSelectEvent(event)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 패널: 상세보기 / 추가폼 / 수정폼 */}
      {(selectedEvent || mode === 'add') && (
        <div className="flex-shrink-0 mt-3">
          {mode === 'add' && newEventTime && (
            <EventForm
              mode="add"
              initialTime={newEventTime}
              onSubmit={handleAddEvent}
              onCancel={handleCancel}
            />
          )}
          {mode === 'edit' && selectedEvent && (
            <EventForm
              mode="edit"
              initialTime={selectedEvent.startTime}
              initialData={{
                title: selectedEvent.title,
                location: selectedEvent.location,
                description: selectedEvent.description,
                endTime: selectedEvent.endTime
              }}
              onSubmit={handleUpdateEvent}
              onCancel={handleCancel}
            />
          )}
          {mode === 'view' && selectedEvent && (
            <EventDetail
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onEdit={handleEditMode}
              onDelete={handleDeleteEvent}
            />
          )}
        </div>
      )}
    </section>
  )
}

// 새 일정 추가 위치 표시
function NewEventIndicator({ time }: { time: number }) {
  const date = new Date(time)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const topPosition = (((hours - START_HOUR) * 60 + minutes) / 60) * HOUR_HEIGHT

  return (
    <div
      className="absolute right-2 left-12 z-30 pointer-events-none"
      style={{ top: `${topPosition}px` }}
    >
      <div className="flex justify-center items-center h-10 rounded-lg border-2 border-dashed border-cool/50 bg-cool/10">
        <span className="text-xs text-cool">{formatEventTime(time)}에 추가</span>
      </div>
    </div>
  )
}

interface EventBlockProps {
  event: EventItem
  isSelected: boolean
  onSelect: () => void
}

function EventBlock({ event, isSelected, onSelect }: EventBlockProps) {
  const status = getEventStatus(event)

  // 일정 위치 계산 (시작 시간 기준)
  const startDate = new Date(event.startTime)
  const startHours = startDate.getHours()
  const startMinutes = startDate.getMinutes()
  const topPosition = (((startHours - START_HOUR) * 60 + startMinutes) / 60) * HOUR_HEIGHT

  // 블록 높이 계산 (시작~종료 시간 차이)
  const durationMinutes = (event.endTime - event.startTime) / (1000 * 60)
  const blockHeight = Math.max(24, (durationMinutes / 60) * HOUR_HEIGHT)

  // 상태별 스타일
  const statusStyles = {
    ongoing: {
      bg: 'bg-green-500/20 hover:bg-green-500/30',
      border: 'border-green-500/50',
      dot: 'bg-green-500',
      text: 'text-green-400'
    },
    upcoming: {
      bg: 'bg-cool/20 hover:bg-cool/30',
      border: 'border-cool/50',
      dot: 'bg-cool',
      text: 'text-cool'
    },
    past: {
      bg: 'bg-text-muted/10 hover:bg-text-muted/20',
      border: 'border-text-muted/30',
      dot: 'bg-text-muted',
      text: 'text-text-muted'
    }
  }

  const style = statusStyles[status]

  // 짧은 일정(30분 이하)은 간략하게 표시
  const isCompact = durationMinutes <= 30

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className={`pointer-events-auto absolute left-0 right-0 cursor-pointer rounded-lg border transition-all ${style.bg} ${style.border} ${isSelected ? 'z-10 scale-[1.02] ring-2 ring-cool/50' : 'z-0'} `}
      style={{
        top: `${topPosition}px`,
        height: `${blockHeight}px`
      }}
    >
      <div className={`flex overflow-hidden gap-2 items-start h-full ${isCompact ? 'p-1 px-2' : 'p-2'}`}>
        <div className={`h-full w-1.5 rounded-full ${style.dot} flex-shrink-0`} />
        <div className="flex-1 min-w-0 text-left">
          <p className={`font-medium truncate text-text-primary ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
            {event.title}
          </p>
          {!isCompact && (
            <p className={`text-[10px] ${style.text}`}>
              {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

interface EventFormProps {
  mode: 'add' | 'edit'
  initialTime: number
  initialData?: {
    title: string
    location?: string
    description?: string
    endTime?: number
  }
  onSubmit: (data: { title: string; location?: string; description?: string; startTime: number; endTime: number }) => void
  onCancel: () => void
}

function EventForm({ mode, initialTime, initialData, onSubmit, onCancel }: EventFormProps) {
  const initialStartDate = new Date(initialTime)
  // 기본 종료 시간: 시작 시간 + 1시간
  const initialEndDate = initialData?.endTime
    ? new Date(initialData.endTime)
    : new Date(initialTime + 60 * 60 * 1000)

  const [title, setTitle] = useState(initialData?.title || '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [startTime, setStartTime] = useState(
    `${String(initialStartDate.getHours()).padStart(2, '0')}:${String(initialStartDate.getMinutes()).padStart(2, '0')}`
  )
  const [endTime, setEndTime] = useState(
    `${String(initialEndDate.getHours()).padStart(2, '0')}:${String(initialEndDate.getMinutes()).padStart(2, '0')}`
  )
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('제목을 입력해주세요')
      return
    }

    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)

    const today = new Date()
    const startDate = new Date(today)
    startDate.setHours(startHours, startMinutes, 0, 0)

    const endDate = new Date(today)
    endDate.setHours(endHours, endMinutes, 0, 0)

    // 종료 시간이 시작 시간보다 빠르면 에러
    if (endDate.getTime() <= startDate.getTime()) {
      setError('종료 시간은 시작 시간보다 늦어야 합니다')
      return
    }

    onSubmit({
      title: title.trim(),
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      startTime: startDate.getTime(),
      endTime: endDate.getTime()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 rounded-lg border duration-200 border-cool/30 bg-cool/5 animate-in fade-in slide-in-from-bottom-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-text-primary">
          {mode === 'add' ? '✨ 새 일정' : '✏️ 일정 수정'}
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded transition-colors text-text-muted hover:text-text-primary"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {/* 제목 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="일정 제목"
          className="px-3 py-2 w-full text-sm rounded-md border transition-colors border-surface-hover bg-background text-text-primary placeholder:text-text-muted focus:border-cool focus:outline-none"
          autoFocus
        />

        {/* 시작/종료 시간 */}
        <div className="flex gap-2 items-center">
          <Clock size={14} className="text-text-muted flex-shrink-0" />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            onClick={(e) => (e.target as HTMLInputElement).showPicker()}
            className="flex-1 px-3 py-2 text-sm rounded-md border transition-colors border-surface-hover bg-background text-text-primary focus:border-cool focus:outline-none cursor-pointer"
          />
          <span className="text-text-muted text-xs">~</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            onClick={(e) => (e.target as HTMLInputElement).showPicker()}
            className="flex-1 px-3 py-2 text-sm rounded-md border transition-colors border-surface-hover bg-background text-text-primary focus:border-cool focus:outline-none cursor-pointer"
          />
        </div>

        {/* 장소 */}
        <div className="flex gap-2 items-center">
          <MapPin size={14} className="text-text-muted" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="장소 (선택)"
            className="flex-1 px-3 py-2 text-sm rounded-md border transition-colors border-surface-hover bg-background text-text-primary placeholder:text-text-muted focus:border-cool focus:outline-none"
          />
        </div>

        {/* 설명 */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명 (선택)"
          rows={2}
          className="px-3 py-2 w-full text-sm rounded-md border transition-colors resize-none border-surface-hover bg-background text-text-primary placeholder:text-text-muted focus:border-cool focus:outline-none"
        />

        {/* 에러 */}
        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* 버튼 */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 text-xs rounded-md transition-colors text-text-muted hover:bg-surface-hover"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex flex-1 gap-1 justify-center items-center py-2 text-xs text-white rounded-md transition-colors bg-cool hover:bg-cool/90"
          >
            <Check size={12} />
            {mode === 'add' ? '추가' : '저장'}
          </button>
        </div>
      </div>
    </form>
  )
}

interface EventDetailProps {
  event: EventItem
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

function EventDetail({ event, onClose, onEdit, onDelete }: EventDetailProps) {
  const status = getEventStatus(event)

  const statusLabels = {
    ongoing: { label: '진행 중', color: 'text-green-400 bg-green-500/20' },
    upcoming: { label: '예정', color: 'text-cool bg-cool/20' },
    past: { label: '완료', color: 'text-text-muted bg-text-muted/20' }
  }

  return (
    <div
      className="p-3 rounded-lg border duration-200 border-surface-hover bg-surface/80 animate-in fade-in slide-in-from-bottom-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex gap-2 justify-between items-start mb-2">
        <div className="flex flex-wrap gap-2 items-center">
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusLabels[status].color}`}>
            {statusLabels[status].label}
          </span>
          <h4 className="text-sm font-medium text-text-primary">{event.title}</h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded transition-colors text-text-muted hover:text-text-primary"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-1.5 text-xs text-text-secondary">
        <div className="flex gap-2 items-center">
          <Clock size={12} className="text-text-muted" />
          <span>{formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}</span>
        </div>

        {event.location && (
          <div className="flex gap-2 items-center">
            <MapPin size={12} className="text-text-muted" />
            <span>{event.location}</span>
          </div>
        )}

        {event.description && (
          <p className="pt-2 mt-2 border-t border-surface-hover/50 text-text-muted">
            {event.description}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2 pt-2 mt-3 border-t border-surface-hover/50">
        <button
          onClick={onDelete}
          className="flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
        >
          <Trash2 size={12} />
          삭제
        </button>
        <button
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs text-cool transition-colors hover:bg-cool/10"
        >
          <Edit3 size={12} />
          수정
        </button>
      </div>
    </div>
  )
}
