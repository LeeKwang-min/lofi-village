/**
 * 알람 타입 정의
 */

// 요일 타입
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

// 요일 레이블
export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일'
}

// 요일 순서 (일요일 = 0)
export const DAY_TO_INDEX: Record<DayOfWeek, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
}

// 알람 데이터
export interface AlarmItem {
  id: string
  time: string // HH:mm 형식
  repeatDays: DayOfWeek[] // 빈 배열이면 매일
  enabled: boolean
  label?: string
  useTTS: boolean
  lastTriggered?: number // 마지막 알림 시간 (중복 방지)
}

// 알람 설정
export interface AlarmSettings {
  volume: number // 0-100
  defaultUseTTS: boolean
}

// 기본 알람 설정
export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
  volume: 80,
  defaultUseTTS: true
}

/**
 * 유틸리티 함수들
 */

// ID 생성
export function generateAlarmId(): string {
  return `alarm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// 현재 요일 가져오기
export function getCurrentDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return days[new Date().getDay()]
}

// 알람이 오늘 울리는지 확인
export function isAlarmActiveToday(alarm: AlarmItem): boolean {
  if (!alarm.enabled) return false
  if (alarm.repeatDays.length === 0) return true // 매일
  return alarm.repeatDays.includes(getCurrentDayOfWeek())
}

// 반복 요일 텍스트
export function getRepeatText(repeatDays: DayOfWeek[]): string {
  if (repeatDays.length === 0) return '매일'
  if (repeatDays.length === 7) return '매일'

  const weekdays: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri']
  const weekend: DayOfWeek[] = ['sat', 'sun']

  if (weekdays.every(d => repeatDays.includes(d)) && repeatDays.length === 5) {
    return '주중'
  }
  if (weekend.every(d => repeatDays.includes(d)) && repeatDays.length === 2) {
    return '주말'
  }

  return repeatDays.map(d => DAY_LABELS[d]).join(', ')
}

// 시간 포맷팅 (12시간제)
export function formatAlarmTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours < 12 ? '오전' : '오후'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${period} ${displayHours}:${String(minutes).padStart(2, '0')}`
}

// localStorage 직렬화/역직렬화
export function serializeAlarms(alarms: AlarmItem[]): string {
  return JSON.stringify(alarms)
}

export function deserializeAlarms(json: string): AlarmItem[] {
  try {
    return JSON.parse(json) as AlarmItem[]
  } catch {
    return []
  }
}
