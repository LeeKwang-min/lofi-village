/**
 * 일정 큐 서비스 (싱글톤)
 * localStorage 영속화 및 이벤트 시스템을 통한 상태 관리
 */

import {
  ScheduleItem,
  ScheduleItemStatus,
  ScheduleEvent,
  ScheduleEventType,
  QueueStats,
  calculateBreakMinutes,
  generateId,
  serializeScheduleItem,
  deserializeScheduleItem,
} from '@/types/schedule'

const STORAGE_KEY = 'lofi-room-schedule-queue'

type EventHandler = (event: ScheduleEvent) => void

class ScheduleQueueService {
  private queue: ScheduleItem[] = []
  private eventHandlers: Map<ScheduleEventType, Set<EventHandler>> = new Map()

  constructor() {
    this.loadFromStorage()
  }

  // ========== 영속화 ==========

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.queue = data.map(deserializeScheduleItem)
      }
    } catch (error) {
      console.error('Failed to load schedule queue from storage:', error)
      this.queue = []
    }
  }

  private saveToStorage(): void {
    try {
      const data = this.queue.map(serializeScheduleItem)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save schedule queue to storage:', error)
    }
  }

  // ========== 이벤트 시스템 ==========

  /**
   * 이벤트 핸들러 등록
   */
  on(eventType: ScheduleEventType, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }
    this.eventHandlers.get(eventType)!.add(handler)

    // cleanup 함수 반환
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler)
    }
  }

  private emit(eventType: ScheduleEventType, item?: ScheduleItem): void {
    const event: ScheduleEvent = {
      type: eventType,
      item,
      timestamp: new Date(),
    }
    this.eventHandlers.get(eventType)?.forEach(handler => handler(event))
  }

  // ========== 조회 API ==========

  /**
   * 현재 활성화된 일정 조회
   */
  getCurrentItem(): ScheduleItem | null {
    return this.queue.find(item => item.status === 'active') || null
  }

  /**
   * 다음 대기 중인 일정 조회
   */
  getNextItem(): ScheduleItem | null {
    return this.queue.find(item => item.status === 'pending') || null
  }

  /**
   * 모든 대기 중인 일정 조회
   */
  getPendingItems(): ScheduleItem[] {
    return this.queue.filter(item => item.status === 'pending')
  }

  /**
   * 전체 큐 조회
   */
  getQueue(): ScheduleItem[] {
    return [...this.queue]
  }

  /**
   * 큐 통계 조회
   */
  getStats(): QueueStats {
    const focusItems = this.queue.filter(item => item.type === 'focus')
    const completedFocus = focusItems.filter(item => item.status === 'completed')

    return {
      totalItems: this.queue.length,
      pendingItems: this.queue.filter(item => item.status === 'pending').length,
      completedItems: this.queue.filter(item => item.status === 'completed').length,
      totalFocusMinutes: focusItems.reduce((sum, item) => sum + item.durationMinutes, 0),
      completedFocusMinutes: completedFocus.reduce((sum, item) => sum + item.durationMinutes, 0),
    }
  }

  // ========== 수정 API ==========

  /**
   * 집중 세션 추가
   */
  addFocusSession(
    title: string,
    durationMinutes: number,
    autoInsertBreak: boolean = true
  ): ScheduleItem {
    const breakMinutes = calculateBreakMinutes(durationMinutes)

    const item: ScheduleItem = {
      id: generateId(),
      type: 'focus',
      title,
      status: 'pending',
      source: 'manual',
      durationMinutes,
      breakMinutes,
      autoInsertBreak,
      createdAt: new Date(),
    }

    this.queue.push(item)
    this.saveToStorage()
    this.emit('item-added', item)
    this.emit('queue-updated')

    return item
  }

  /**
   * 휴식 세션 추가 (자동 삽입용)
   */
  addBreakSession(durationMinutes: number, afterItemId?: string): ScheduleItem {
    const item: ScheduleItem = {
      id: generateId(),
      type: 'break',
      title: '휴식 시간',
      status: 'pending',
      source: 'auto-break',
      durationMinutes,
      autoInsertBreak: false,
      createdAt: new Date(),
    }

    // afterItemId가 있으면 해당 아이템 다음에 삽입
    if (afterItemId) {
      const index = this.queue.findIndex(i => i.id === afterItemId)
      if (index !== -1) {
        this.queue.splice(index + 1, 0, item)
      } else {
        this.queue.push(item)
      }
    } else {
      this.queue.push(item)
    }

    this.saveToStorage()
    this.emit('item-added', item)
    this.emit('queue-updated')

    return item
  }

  /**
   * 현재 일정 시작
   */
  startCurrent(): ScheduleItem | null {
    // 이미 active인 항목이 있으면 무시
    if (this.getCurrentItem()) {
      return this.getCurrentItem()
    }

    const nextItem = this.getNextItem()
    if (!nextItem) return null

    nextItem.status = 'active'
    nextItem.startedAt = new Date()

    this.saveToStorage()
    this.emit('item-started', nextItem)
    this.emit('queue-updated')

    return nextItem
  }

  /**
   * 현재 일정 완료
   */
  completeCurrent(): ScheduleItem | null {
    const currentItem = this.getCurrentItem()
    if (!currentItem) return null

    currentItem.status = 'completed'
    currentItem.completedAt = new Date()

    // 자동 휴식 삽입
    if (currentItem.autoInsertBreak && currentItem.breakMinutes && currentItem.type === 'focus') {
      this.addBreakSession(currentItem.breakMinutes, currentItem.id)
    }

    this.saveToStorage()
    this.emit('item-completed', currentItem)
    this.emit('queue-updated')

    return currentItem
  }

  /**
   * 현재 일정 스킵
   */
  skipCurrent(): ScheduleItem | null {
    const currentItem = this.getCurrentItem()
    if (!currentItem) {
      // active가 없으면 다음 pending을 스킵
      const nextItem = this.getNextItem()
      if (!nextItem) return null

      nextItem.status = 'skipped'
      this.saveToStorage()
      this.emit('item-skipped', nextItem)
      this.emit('queue-updated')

      return nextItem
    }

    currentItem.status = 'skipped'
    currentItem.completedAt = new Date()

    this.saveToStorage()
    this.emit('item-skipped', currentItem)
    this.emit('queue-updated')

    return currentItem
  }

  /**
   * 특정 일정 제거
   */
  removeItem(itemId: string): boolean {
    const index = this.queue.findIndex(item => item.id === itemId)
    if (index === -1) return false

    const [removedItem] = this.queue.splice(index, 1)

    this.saveToStorage()
    this.emit('item-removed', removedItem)
    this.emit('queue-updated')

    return true
  }

  /**
   * 항목 상태 업데이트
   */
  updateItemStatus(itemId: string, status: ScheduleItemStatus): boolean {
    const item = this.queue.find(i => i.id === itemId)
    if (!item) return false

    item.status = status
    if (status === 'active') {
      item.startedAt = new Date()
    } else if (status === 'completed' || status === 'skipped') {
      item.completedAt = new Date()
    }

    this.saveToStorage()
    this.emit('queue-updated')

    return true
  }

  /**
   * 완료/스킵된 항목 정리
   */
  clearCompleted(): void {
    this.queue = this.queue.filter(
      item => item.status !== 'completed' && item.status !== 'skipped'
    )
    this.saveToStorage()
    this.emit('queue-cleared')
    this.emit('queue-updated')
  }

  /**
   * 전체 큐 초기화
   */
  clearAll(): void {
    this.queue = []
    this.saveToStorage()
    this.emit('queue-cleared')
    this.emit('queue-updated')
  }
}

// 싱글톤 인스턴스
export const scheduleQueueService = new ScheduleQueueService()
