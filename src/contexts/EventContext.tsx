/**
 * Event Context Provider
 * 로컬 일정 관리 상태를 전역에서 관리
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  EventItem,
  EventReminderSettings,
  DEFAULT_REMINDER_SETTINGS,
  generateEventId,
  serializeEvents,
  deserializeEvents,
  getEventStatus,
} from '@/types/event'

// localStorage 키
const STORAGE_KEY = 'lofi-village-events'
const SETTINGS_KEY = 'lofi-village-event-settings'

// Context 타입 정의
interface EventContextType {
  // 상태
  events: EventItem[]
  todayEvents: EventItem[]
  reminderSettings: EventReminderSettings

  // 액션
  addEvent: (event: Omit<EventItem, 'id' | 'createdAt' | 'notified'>) => void
  updateEvent: (id: string, updates: Partial<EventItem>) => void
  deleteEvent: (id: string) => void
  markAsNotified: (id: string) => void
  setReminderSettings: (settings: Partial<EventReminderSettings>) => void
  clearPastEvents: () => void
}

const EventContext = createContext<EventContextType | null>(null)

interface EventProviderProps {
  children: ReactNode
}

export function EventProvider({ children }: EventProviderProps) {
  // 일정 목록
  const [events, setEvents] = useState<EventItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? deserializeEvents(saved) : []
  })

  // 알림 설정
  const [reminderSettings, setReminderSettingsState] = useState<EventReminderSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      try {
        return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(saved) }
      } catch {
        return DEFAULT_REMINDER_SETTINGS
      }
    }
    return DEFAULT_REMINDER_SETTINGS
  })

  // localStorage 동기화 (다른 탭/창에서 자동으로 storage 이벤트 수신)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, serializeEvents(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(reminderSettings))
  }, [reminderSettings])

  // 다른 창에서의 localStorage 변경 감지
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newEvents = deserializeEvents(e.newValue)
        setEvents(newEvents)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 창이 포커스를 받을 때 localStorage에서 다시 로드 (Electron 멀티윈도우 동기화)
  useEffect(() => {
    const handleFocus = () => {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const loadedEvents = deserializeEvents(saved)
        setEvents(loadedEvents)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // 오늘의 일정 필터링
  const todayEvents = events.filter((event) => {
    const eventDate = new Date(event.startTime)
    const today = new Date()
    return (
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate()
    )
  }).sort((a, b) => a.startTime - b.startTime)

  // 일정 추가 (즉시 localStorage에 저장하여 서브윈도우 닫힘 전에 동기화)
  const addEvent = useCallback((eventData: Omit<EventItem, 'id' | 'createdAt' | 'notified'>) => {
    const newEvent: EventItem = {
      ...eventData,
      id: generateEventId(),
      createdAt: Date.now(),
      notified: false,
    }
    setEvents((prev) => {
      const updated = [...prev, newEvent].sort((a, b) => a.startTime - b.startTime)
      // 즉시 localStorage에 저장 (창이 닫히기 전에 동기화 보장)
      localStorage.setItem(STORAGE_KEY, serializeEvents(updated))
      return updated
    })
  }, [])

  // 일정 수정
  const updateEvent = useCallback((id: string, updates: Partial<EventItem>) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === id ? { ...event, ...updates } : event))
    )
  }, [])

  // 일정 삭제
  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id))
  }, [])

  // 알림 전송 표시
  const markAsNotified = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === id ? { ...event, notified: true } : event))
    )
  }, [])

  // 알림 설정 업데이트
  const setReminderSettings = useCallback((settings: Partial<EventReminderSettings>) => {
    setReminderSettingsState((prev) => ({ ...prev, ...settings }))
  }, [])

  // 지난 일정 정리 (어제 이전)
  const clearPastEvents = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setEvents((prev) => prev.filter((event) => event.startTime >= today.getTime()))
  }, [])

  // 자정에 지난 일정 자동 정리
  useEffect(() => {
    const checkAndClear = () => {
      const now = new Date()
      // 자정 직후에 정리
      if (now.getHours() === 0 && now.getMinutes() < 5) {
        clearPastEvents()
      }
    }

    // 1분마다 체크
    const interval = setInterval(checkAndClear, 60 * 1000)
    return () => clearInterval(interval)
  }, [clearPastEvents])

  // 일정 상태 주기적 업데이트 (UI 새로고침용)
  useEffect(() => {
    const interval = setInterval(() => {
      // 강제 리렌더링을 위해 상태 업데이트
      setEvents((prev) => [...prev])
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const value: EventContextType = {
    events,
    todayEvents,
    reminderSettings,
    addEvent,
    updateEvent,
    deleteEvent,
    markAsNotified,
    setReminderSettings,
    clearPastEvents,
  }

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>
}

/**
 * Event Context 사용 훅
 */
export function useEventContext() {
  const context = useContext(EventContext)
  if (!context) {
    throw new Error('useEventContext must be used within an EventProvider')
  }
  return context
}
