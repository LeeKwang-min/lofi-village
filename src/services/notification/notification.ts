/**
 * 시스템 알림 서비스
 * Electron Notification API를 사용한 네이티브 데스크톱 알림
 * - macOS: 액션 버튼 지원
 * - Windows/Linux: 알림 클릭으로 대체
 */

export interface NotificationAction {
  id: string
  label: string
}

export interface NotificationOptions {
  title: string
  body: string
  actions?: NotificationAction[]
}

type NotificationClickHandler = (data: { action: string }) => void
type NotificationCloseHandler = () => void

class NotificationService {
  private enabled: boolean = true
  private supported: boolean = false
  private clickHandlers: Set<NotificationClickHandler> = new Set()
  private closeHandlers: Set<NotificationCloseHandler> = new Set()
  private cleanupFns: Array<() => void> = []

  constructor() {
    this.init()
  }

  private async init(): Promise<void> {
    // Electron 환경 확인
    if (typeof window !== 'undefined' && window.notificationAPI) {
      this.supported = await window.notificationAPI.isSupported()

      // 알림 클릭 이벤트 리스너 등록
      const cleanupClick = window.notificationAPI.onClicked((data) => {
        this.clickHandlers.forEach(handler => handler(data))
      })
      this.cleanupFns.push(cleanupClick)

      // 알림 닫힘 이벤트 리스너 등록
      const cleanupClose = window.notificationAPI.onClosed(() => {
        this.closeHandlers.forEach(handler => handler())
      })
      this.cleanupFns.push(cleanupClose)
    }
  }

  /**
   * 알림 사용 가능 여부 확인
   */
  isAvailable(): boolean {
    return this.supported
  }

  /**
   * 알림 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * 알림 표시
   */
  async show(options: NotificationOptions): Promise<boolean> {
    if (!this.enabled || !window.notificationAPI) {
      return false
    }

    const result = await window.notificationAPI.show({
      title: options.title,
      body: options.body,
      actions: options.actions
    })

    return result.success
  }

  /**
   * 알림 클릭 이벤트 핸들러 등록
   */
  onClicked(handler: NotificationClickHandler): () => void {
    this.clickHandlers.add(handler)
    return () => this.clickHandlers.delete(handler)
  }

  /**
   * 알림 닫힘 이벤트 핸들러 등록
   */
  onClosed(handler: NotificationCloseHandler): () => void {
    this.closeHandlers.add(handler)
    return () => this.closeHandlers.delete(handler)
  }

  /**
   * 서비스 정리
   */
  destroy(): void {
    this.cleanupFns.forEach(fn => fn())
    this.clickHandlers.clear()
    this.closeHandlers.clear()
  }
}

// 싱글톤 인스턴스
export const notificationService = new NotificationService()
