import { contextBridge, ipcRenderer } from 'electron'

console.log('Preload script loaded!') // 디버깅용

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
  platform: process.platform
}

// 렌더러에서 window.electronAPI로 접근 가능
contextBridge.exposeInMainWorld('electronAPI', windowAPI)

// TypeScript 타입 정의를 위한 인터페이스
export type ElectronAPI = typeof windowAPI
