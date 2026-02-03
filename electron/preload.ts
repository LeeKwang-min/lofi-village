import { contextBridge, ipcRenderer } from 'electron'

// 렌더러 프로세스에 안전하게 노출할 창 제어 API
const windowAPI = {
  // 창 최소화
  minimize: (): void => {
    ipcRenderer.send('window:minimize')
  },

  // 창 닫기
  close: (): void => {
    ipcRenderer.send('window:close')
  },

  // 항상 위에 표시 토글 (결과값 반환)
  toggleAlwaysOnTop: (): Promise<boolean> => {
    return ipcRenderer.invoke('window:toggle-always-on-top')
  },

  // 현재 항상 위에 표시 상태 확인
  isAlwaysOnTop: (): Promise<boolean> => {
    return ipcRenderer.invoke('window:is-always-on-top')
  },

  // 창 정렬
  align: (position: 'left' | 'right' | 'center'): void => {
    ipcRenderer.send('window:align', position)
  },

  // 플랫폼 정보
  platform: process.platform,

  // 창 복원 이벤트 리스너 (백그라운드에서 돌아올 때)
  onRestored: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('window:restored', handler)
    return () => ipcRenderer.removeListener('window:restored', handler)
  },

  // 창 포커스 이벤트 리스너
  onFocused: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('window:focused', handler)
    return () => ipcRenderer.removeListener('window:focused', handler)
  },

  // GPU 복구 이벤트 리스너
  onGPURecovered: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('gpu:recovered', handler)
    return () => ipcRenderer.removeListener('gpu:recovered', handler)
  },

  // 메모리 압박 이벤트 리스너 (OOM 방지)
  onMemoryPressure: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('memory:pressure', handler)
    return () => ipcRenderer.removeListener('memory:pressure', handler)
  }
}

// 알림 관련 API
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

const notificationAPI = {
  // 알림 지원 여부 확인
  isSupported: (): Promise<boolean> => {
    return ipcRenderer.invoke('notification:is-supported')
  },

  // 알림 표시
  show: (options: ShowNotificationOptions): Promise<ShowNotificationResult> => {
    return ipcRenderer.invoke('notification:show', options)
  },

  // 알림 클릭 이벤트 리스너
  onClicked: (callback: (data: { action: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { action: string }) => callback(data)
    ipcRenderer.on('notification:clicked', handler)
    // cleanup 함수 반환
    return () => ipcRenderer.removeListener('notification:clicked', handler)
  },

  // 알림 닫힘 이벤트 리스너
  onClosed: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('notification:closed', handler)
    return () => ipcRenderer.removeListener('notification:closed', handler)
  }
}

// 서브 윈도우 API
type SubWindowType = 'tasks' | 'history' | 'memo' | 'schedule'

const subWindowAPI = {
  // 서브 윈도우 열기/토글
  open: (windowType: SubWindowType): Promise<boolean> => {
    return ipcRenderer.invoke('subwindow:open', windowType)
  },

  // 서브 윈도우 닫기
  close: (windowType: SubWindowType): Promise<boolean> => {
    return ipcRenderer.invoke('subwindow:close', windowType)
  },

  // 현재 창 닫기 (서브 윈도우 전용)
  closeSelf: (): void => {
    ipcRenderer.send('subwindow:close-self')
  }
}

// 렌더러에서 window.electronAPI로 접근 가능
contextBridge.exposeInMainWorld('electronAPI', windowAPI)
contextBridge.exposeInMainWorld('notificationAPI', notificationAPI)
contextBridge.exposeInMainWorld('subWindowAPI', subWindowAPI)

// TypeScript 타입 정의를 위한 인터페이스
export type ElectronAPI = typeof windowAPI
export type NotificationAPI = typeof notificationAPI
