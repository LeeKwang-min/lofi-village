/**
 * 일정 시스템 타입 정의
 * Google 캘린더 연동을 대비한 동적 시간 설정 및 일정 큐 관리
 */

// 일정 항목 타입
export type ScheduleItemType = 'focus' | 'break' | 'custom'

// 일정 항목 상태
export type ScheduleItemStatus = 'pending' | 'active' | 'completed' | 'skipped'

// 일정 소스 (출처)
export type ScheduleSource = 'manual' | 'auto-break' | 'google-calendar'

// 일정 항목 인터페이스
export interface ScheduleItem {
  id: string
  type: ScheduleItemType
  title: string
  status: ScheduleItemStatus
  source: ScheduleSource
  durationMinutes: number
  breakMinutes?: number      // 이 일정 후 삽입될 휴식 시간
  autoInsertBreak?: boolean  // 완료 시 자동 휴식 삽입 여부
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  externalId?: string        // Google Calendar 연동용
}

// 일정 프리셋 타입
export interface SchedulePreset {
  id: string
  name: string
  emoji: string
  focusMinutes: number
}

// 큐 통계 정보
export interface QueueStats {
  totalItems: number
  pendingItems: number
  completedItems: number
  totalFocusMinutes: number
  completedFocusMinutes: number
}

// 이벤트 타입
export type ScheduleEventType =
  | 'item-added'
  | 'item-started'
  | 'item-completed'
  | 'item-skipped'
  | 'item-removed'
  | 'queue-updated'
  | 'queue-cleared'

export interface ScheduleEvent {
  type: ScheduleEventType
  item?: ScheduleItem
  timestamp: Date
}

/**
 * 휴식 시간 계산 (1/6 비율, 최소 5분)
 * @param focusMinutes 집중 시간 (분)
 * @returns 휴식 시간 (분)
 */
export function calculateBreakMinutes(focusMinutes: number): number {
  return Math.max(5, Math.ceil(focusMinutes / 6))
}

/**
 * 기본 프리셋 목록
 */
export const DEFAULT_PRESETS: SchedulePreset[] = [
  { id: 'short', name: '짧은 집중', emoji: '⚡', focusMinutes: 30 },
  { id: 'standard', name: '표준', emoji: '🎯', focusMinutes: 60 },
  { id: 'deep', name: '딥 워크', emoji: '🔥', focusMinutes: 120 },
]

/**
 * 고유 ID 생성
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * ScheduleItem을 JSON 직렬화 가능한 형태로 변환
 */
export function serializeScheduleItem(item: ScheduleItem): object {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    startedAt: item.startedAt?.toISOString(),
    completedAt: item.completedAt?.toISOString(),
  }
}

/**
 * JSON에서 ScheduleItem으로 역직렬화
 */
export function deserializeScheduleItem(data: Record<string, unknown>): ScheduleItem {
  return {
    ...data,
    createdAt: new Date(data.createdAt as string),
    startedAt: data.startedAt ? new Date(data.startedAt as string) : undefined,
    completedAt: data.completedAt ? new Date(data.completedAt as string) : undefined,
  } as ScheduleItem
}
