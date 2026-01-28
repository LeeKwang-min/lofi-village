// Electron API 타입 정의
interface ElectronAPI {
  minimize: () => void
  close: () => void
  toggleAlwaysOnTop: () => Promise<boolean>
  isAlwaysOnTop: () => Promise<boolean>
  align: (position: 'left' | 'right' | 'center') => void
  platform: NodeJS.Platform
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
