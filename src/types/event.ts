/**
 * 로컬 일정 관리 타입 정의
 */

// 일정 데이터
export interface EventItem {
  id: string
  title: string
  location?: string
  description?: string
  startTime: number // Unix timestamp (ms)
  endTime: number // Unix timestamp (ms)
  createdAt: number
  notified: boolean // 알림 전송 여부
}

// 일정 상태
export type EventStatus = 'upcoming' | 'ongoing' | 'past'

// 일정 생성 폼 데이터
export interface EventFormData {
  title: string
  location: string
  description: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
}

// 알림 설정
export interface EventReminderSettings {
  enabled: boolean
  minutesBefore: number
  useTTS: boolean
}

// 기본 알림 설정
export const DEFAULT_REMINDER_SETTINGS: EventReminderSettings = {
  enabled: true,
  minutesBefore: 10,
  useTTS: true,
}

/**
 * 유틸리티 함수들
 */

// ID 생성
export function generateEventId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// 일정 상태 계산
export function getEventStatus(event: EventItem): EventStatus {
  const now = Date.now()

  if (now < event.startTime) {
    return 'upcoming'
  } else if (now >= event.startTime && now < event.endTime) {
    return 'ongoing'
  } else {
    return 'past'
  }
}

// 시간 포맷팅
export function formatEventTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

// 날짜 포맷팅
export function formatEventDate(timestamp: number): string {
  const date = new Date(timestamp)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return '오늘'
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return '내일'
  } else {
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }
}

// localStorage 직렬화/역직렬화
export function serializeEvents(events: EventItem[]): string {
  return JSON.stringify(events)
}

export function deserializeEvents(json: string): EventItem[] {
  try {
    return JSON.parse(json) as EventItem[]
  } catch {
    return []
  }
}
