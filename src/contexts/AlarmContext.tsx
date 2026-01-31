/**
 * Alarm Context Provider
 * 알람 관리 상태를 전역에서 관리
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  AlarmItem,
  AlarmSettings,
  DEFAULT_ALARM_SETTINGS,
  generateAlarmId,
  serializeAlarms,
  deserializeAlarms
} from '@/types/alarm'

// localStorage 키
const STORAGE_KEY = 'lofi-village-alarms'
const SETTINGS_KEY = 'lofi-village-alarm-settings'

// Context 타입 정의
interface AlarmContextType {
  // 상태
  alarms: AlarmItem[]
  settings: AlarmSettings

  // 액션
  addAlarm: (alarm: Omit<AlarmItem, 'id' | 'lastTriggered'>) => void
  updateAlarm: (id: string, updates: Partial<AlarmItem>) => void
  deleteAlarm: (id: string) => void
  toggleAlarm: (id: string) => void
  markAsTriggered: (id: string) => void
  updateSettings: (settings: Partial<AlarmSettings>) => void
}

const AlarmContext = createContext<AlarmContextType | null>(null)

interface AlarmProviderProps {
  children: ReactNode
}

export function AlarmProvider({ children }: AlarmProviderProps) {
  // 알람 목록
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? deserializeAlarms(saved) : []
  })

  // 알람 설정
  const [settings, setSettings] = useState<AlarmSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      try {
        return { ...DEFAULT_ALARM_SETTINGS, ...JSON.parse(saved) }
      } catch {
        return DEFAULT_ALARM_SETTINGS
      }
    }
    return DEFAULT_ALARM_SETTINGS
  })

  // localStorage 동기화
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, serializeAlarms(alarms))
  }, [alarms])

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  // 창 포커스 시 동기화
  useEffect(() => {
    const handleFocus = () => {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setAlarms(deserializeAlarms(saved))
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // 알람 추가
  const addAlarm = useCallback((alarmData: Omit<AlarmItem, 'id' | 'lastTriggered'>) => {
    const newAlarm: AlarmItem = {
      ...alarmData,
      id: generateAlarmId()
    }
    setAlarms((prev) => [...prev, newAlarm].sort((a, b) => a.time.localeCompare(b.time)))
  }, [])

  // 알람 수정
  const updateAlarm = useCallback((id: string, updates: Partial<AlarmItem>) => {
    setAlarms((prev) =>
      prev
        .map((alarm) => (alarm.id === id ? { ...alarm, ...updates } : alarm))
        .sort((a, b) => a.time.localeCompare(b.time))
    )
  }, [])

  // 알람 삭제
  const deleteAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((alarm) => alarm.id !== id))
  }, [])

  // 알람 토글
  const toggleAlarm = useCallback((id: string) => {
    setAlarms((prev) =>
      prev.map((alarm) => (alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm))
    )
  }, [])

  // 알람 트리거 표시
  const markAsTriggered = useCallback((id: string) => {
    setAlarms((prev) =>
      prev.map((alarm) =>
        alarm.id === id ? { ...alarm, lastTriggered: Date.now() } : alarm
      )
    )
  }, [])

  // 설정 업데이트
  const updateSettings = useCallback((newSettings: Partial<AlarmSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }, [])

  const value: AlarmContextType = {
    alarms,
    settings,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    markAsTriggered,
    updateSettings
  }

  return <AlarmContext.Provider value={value}>{children}</AlarmContext.Provider>
}

/**
 * Alarm Context 사용 훅
 */
export function useAlarmContext() {
  const context = useContext(AlarmContext)
  if (!context) {
    throw new Error('useAlarmContext must be used within an AlarmProvider')
  }
  return context
}
