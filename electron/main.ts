import { app, BrowserWindow, shell, ipcMain, screen, Notification, powerSaveBlocker } from 'electron'
import { join } from 'path'

// ============================================
// 백그라운드 리소스 유지를 위한 설정
// ============================================

// Chromium 플래그: 백그라운드에서도 렌더러가 정상 동작하도록 설정
app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-background-timer-throttling')

// 창 가려짐 감지(Occlusion Detection) 비활성화 - macOS & Windows 공통
// 창이 다른 창에 가려져도 throttling 하지 않음
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')

// [공통] GPU 프로세스 안정성 강화
app.commandLine.appendSwitch('disable-gpu-process-crash-limit')

// macOS 전용: 가려진 창의 렌더링 유지
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows')
}

// Windows 전용: Power Throttling 비활성화
if (process.platform === 'win32') {
  // 백그라운드에서 프레임 제한 해제
  app.commandLine.appendSwitch('disable-frame-rate-limit')
}

// powerSaveBlocker ID 저장
let powerSaveBlockerId: number | null = null

// 알림 옵션 타입 정의
interface NotificationActionOptions {
  title: string
  body: string
  actions?: Array<{ id: string; label: string }>
}

// 서브 윈도우 타입 정의
type SubWindowType = 'tasks' | 'history' | 'memo' | 'schedule'

interface SubWindowConfig {
  title: string
  width: number
  height: number
}

const SUB_WINDOW_CONFIGS: Record<SubWindowType, SubWindowConfig> = {
  tasks: { title: '오늘의 할 일', width: 400, height: 500 },
  history: { title: '집중 기록', width: 450, height: 600 },
  memo: { title: '메모장', width: 400, height: 500 },
  schedule: { title: '일정 추가', width: 400, height: 620 },
}

let mainWindow: BrowserWindow | null = null
const subWindows: Map<SubWindowType, BrowserWindow> = new Map()

// 앱의 기본 창 크기 (세로로 긴 레이아웃)
const WINDOW_WIDTH = 380

function createWindow(): void {
  const { height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: screenHeight,
    minWidth: 420,
    minHeight: 600,
    maxWidth: 500,
    maxHeight: screenHeight,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: '#f9f6f1',
    resizable: true,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: -100, y: -100 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  })

  mainWindow.webContents.setBackgroundThrottling(false)

  mainWindow.on('ready-to-show', () => {
    const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize
    const [windowWidth] = mainWindow!.getSize()
    mainWindow?.setPosition(screenWidth - windowWidth, 0)
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // ============================================
  // 진짜 가시성 상태 관리 (backgroundThrottling: false에서 신뢰 가능)
  // ============================================
  let isWindowVisible = true

  const sendVisibilityState = (visible: boolean) => {
    isWindowVisible = visible
    mainWindow?.webContents.send('window:visibility-changed', visible)
  }

  mainWindow.on('hide', () => {
    sendVisibilityState(false)
  })

  mainWindow.on('minimize', () => {
    sendVisibilityState(false)
  })

  mainWindow.on('show', () => {
    sendVisibilityState(true)
    mainWindow?.webContents.invalidate()
  })

  mainWindow.on('restore', () => {
    sendVisibilityState(true)
    mainWindow?.webContents.invalidate()
    mainWindow?.webContents.send('window:restored')
  })

  mainWindow.on('focus', () => {
    if (!isWindowVisible) {
      sendVisibilityState(true)
    }
    setTimeout(() => {
      mainWindow?.webContents.invalidate()
    }, 50)
    mainWindow?.webContents.send('window:focused')
  })

  mainWindow.on('blur', () => {
    // blur만으로는 hidden 처리 안 함 (창은 여전히 보일 수 있음)
  })

  if (process.platform === 'darwin') {
    mainWindow.on('hide', () => {
      sendVisibilityState(false)
    })
  }

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 서브 윈도우 생성/토글 함수
function createOrToggleSubWindow(windowType: SubWindowType): boolean {
  const existingWindow = subWindows.get(windowType)
  if (existingWindow && !existingWindow.isDestroyed()) {
    existingWindow.focus()
    return true
  }

  const config = SUB_WINDOW_CONFIGS[windowType]
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const subWindow = new BrowserWindow({
    width: config.width,
    height: config.height,
    minWidth: 300,
    minHeight: 400,
    show: false,
    frame: false,
    backgroundColor: '#f9f6f1',
    resizable: true,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: -100, y: -100 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  })

  subWindow.webContents.setBackgroundThrottling(false)

  subWindow.on('ready-to-show', () => {
    const mainBounds = mainWindow?.getBounds()
    if (mainBounds) {
      let x = mainBounds.x - config.width - 10
      if (x < 0) {
        x = mainBounds.x + mainBounds.width + 10
      }
      if (x + config.width > screenWidth) {
        x = Math.floor((screenWidth - config.width) / 2)
      }
      const y = Math.min(mainBounds.y, screenHeight - config.height)
      subWindow.setPosition(x, Math.max(0, y))
    }
    subWindow.show()
  })

  subWindow.on('closed', () => {
    subWindows.delete(windowType)
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    subWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?window=${windowType}`)
  } else {
    subWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { window: windowType }
    })
  }

  subWindows.set(windowType, subWindow)
  return true
}

// 서브 윈도우 닫기 함수
function closeSubWindow(windowType: SubWindowType): boolean {
  const window = subWindows.get(windowType)
  if (window && !window.isDestroyed()) {
    window.close()
    return true
  }
  return false
}

// ============================================
// IPC 핸들러: Renderer에서 호출할 수 있는 창 제어 함수들
// ============================================

ipcMain.on('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:toggle-always-on-top', () => {
  if (!mainWindow) return false
  const current = mainWindow.isAlwaysOnTop()
  mainWindow.setAlwaysOnTop(!current)
  return !current
})

ipcMain.handle('window:is-always-on-top', () => {
  return mainWindow?.isAlwaysOnTop() ?? false
})

ipcMain.on('window:align', (_event, alignTo: 'left' | 'right' | 'center') => {
  if (!mainWindow) return

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize
  const [windowWidth, windowHeight] = mainWindow.getSize()

  const y = Math.floor((screenHeight - windowHeight) / 2);
  if (alignTo === 'left') {
    mainWindow.setPosition(0, y);
  } else if (alignTo === 'right') {
    mainWindow.setPosition(screenWidth - windowWidth, y);
  } else if (alignTo === 'center') {
    mainWindow.setPosition(Math.floor((screenWidth - windowWidth) / 2), y);
  }
})

// ============================================
// IPC 핸들러: 알림 관련
// ============================================

ipcMain.handle('notification:is-supported', () => {
  return Notification.isSupported()
})

ipcMain.handle('notification:show', (_event, options: NotificationActionOptions) => {
  if (!Notification.isSupported()) {
    return { success: false, reason: 'not-supported' }
  }

  const isMac = process.platform === 'darwin'

  const notificationOptions: Electron.NotificationConstructorOptions = {
    title: options.title,
    body: options.body,
    silent: true,
  }

  if (isMac && options.actions && options.actions.length > 0) {
    notificationOptions.actions = options.actions.map(action => ({
      type: 'button' as const,
      text: action.label
    }))
    notificationOptions.hasReply = false
  }

  const notification = new Notification(notificationOptions)

  notification.on('click', () => {
    mainWindow?.show()
    mainWindow?.focus()
    mainWindow?.webContents.send('notification:clicked', { action: 'click' })
  })

  if (isMac) {
    notification.on('action', (_event, index) => {
      const actionId = options.actions?.[index]?.id || `action-${index}`
      mainWindow?.show()
      mainWindow?.focus()
      mainWindow?.webContents.send('notification:clicked', { action: actionId })
    })
  }

  notification.on('close', () => {
    mainWindow?.webContents.send('notification:closed')
  })

  notification.show()

  return {
    success: true,
    platform: process.platform,
    hasActions: isMac && (options.actions?.length || 0) > 0
  }
})

// ============================================
// IPC 핸들러: 서브 윈도우 관련
// ============================================

ipcMain.handle('subwindow:open', (_event, windowType: SubWindowType) => {
  return createOrToggleSubWindow(windowType)
})

ipcMain.handle('subwindow:close', (_event, windowType: SubWindowType) => {
  return closeSubWindow(windowType)
})

ipcMain.on('subwindow:close-self', (event) => {
  const webContents = event.sender
  const window = BrowserWindow.fromWebContents(webContents)
  if (window && window !== mainWindow) {
    window.close()
  }
})

app.whenReady().then(() => {
  powerSaveBlockerId = powerSaveBlocker.start('prevent-app-suspension')

  createWindow()
  startMemoryMonitoring()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopMemoryMonitoring()

  if (powerSaveBlockerId !== null && powerSaveBlocker.isStarted(powerSaveBlockerId)) {
    powerSaveBlocker.stop(powerSaveBlockerId)
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ============================================
// 에러 핸들링 및 자동 복구
// ============================================

app.on('render-process-gone', (event, webContents, details) => {
  const recoverableReasons = ['crashed', 'oom', 'launch-failed', 'integrity-failure']

  if (recoverableReasons.includes(details.reason)) {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents === webContents) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.reload()
        }
      }, 1000)
    }
  } else if (details.reason === 'killed') {
    setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        createWindow()
      }
    }, 1000)
  }
})

app.on('child-process-gone', (_event, details) => {
  if (details.type === 'GPU') {
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.invalidate()
        mainWindow.webContents.send('gpu:recovered')
      }

      subWindows.forEach((window) => {
        if (!window.isDestroyed()) {
          window.webContents.invalidate()
        }
      })
    }, 500)
  }
})

// ============================================
// 메모리 모니터링 (OOM 방지)
// ============================================
let memoryCheckInterval: NodeJS.Timeout | null = null

function startMemoryMonitoring() {
  memoryCheckInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return

    mainWindow.webContents.executeJavaScript(`
      performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null
    `).then((memoryInfo) => {
      if (memoryInfo) {
        const usagePercent = Math.round((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100)

        if (usagePercent >= 90) {
          mainWindow?.webContents.send('memory:pressure')
        }
      }
    }).catch(() => {
      // performance.memory는 Chrome 계열에서만 지원
    })
  }, 30000)
}

function stopMemoryMonitoring() {
  if (memoryCheckInterval) {
    clearInterval(memoryCheckInterval)
    memoryCheckInterval = null
  }
}
