// Electron API 타입 정의
interface ElectronAPI {
  minimize: () => void
  close: () => void
  toggleAlwaysOnTop: () => Promise<boolean>
  isAlwaysOnTop: () => Promise<boolean>
  align: (position: 'left' | 'right' | 'center') => void
  platform: NodeJS.Platform
  onRestored: (callback: () => void) => () => void
  onFocused: (callback: () => void) => () => void
  onGPURecovered: (callback: () => void) => () => void
  onMemoryPressure: (callback: () => void) => () => void
  onVisibilityChanged: (callback: (visible: boolean) => void) => () => void
}

// 알림 API 타입 정의
interface NotificationAction {
  id: string
  label: string
}

interface ShowNotificationOptions {
  title: string
  body: string
  actions?: NotificationAction[]
}

interface ShowNotificationResult {
  success: boolean
  platform?: string
  hasActions?: boolean
  reason?: string
}

interface NotificationAPI {
  isSupported: () => Promise<boolean>
  show: (options: ShowNotificationOptions) => Promise<ShowNotificationResult>
  onClicked: (callback: (data: { action: string }) => void) => () => void
  onClosed: (callback: () => void) => () => void
}

// 서브 윈도우 타입
type SubWindowType = 'tasks' | 'history' | 'memo' | 'schedule'

interface SubWindowAPI {
  open: (windowType: SubWindowType) => Promise<boolean>
  close: (windowType: SubWindowType) => Promise<boolean>
  closeSelf: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    notificationAPI: NotificationAPI
    subWindowAPI: SubWindowAPI
  }
}

export {}
