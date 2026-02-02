import { app, BrowserWindow, shell, ipcMain, screen, Notification } from 'electron'
import { join } from 'path'

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
    height: screenHeight, // 화면 높이에 맞춤
    minWidth: 420,
    minHeight: 600,
    maxWidth: 500,
    maxHeight: screenHeight, // 최대 높이도 화면 높이로 제한
    show: false,
    frame: false, // 커스텀 타이틀바 사용
    transparent: false, // macOS 호환성을 위해 비활성화
    backgroundColor: '#f9f6f1', // Cozy Morning Cafe 테마 배경색
    resizable: true,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset', // macOS에서 깔끔한 타이틀바
    trafficLightPosition: { x: -100, y: -100 }, // 기본 버튼 숨김
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    // 화면 오른쪽에 초기 배치 (y=0으로 상단 정렬)
    const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize
    const [windowWidth] = mainWindow!.getSize()
    mainWindow?.setPosition(screenWidth - windowWidth, 0)
    mainWindow?.show()
  })

  // ============================================
  // 렌더러 프로세스 상태 관리 (흰 화면 방지)
  // ============================================

  // 렌더러 크래시 시 자동 복구
  mainWindow.webContents.on('crashed', (_event, killed) => {
    console.error('Renderer crashed, killed:', killed)
    // 크래시 후 자동으로 페이지 다시 로드
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.reload()
      }
    }, 500)
  })

  // 렌더러가 응답하지 않을 때 처리
  mainWindow.webContents.on('unresponsive', () => {
    console.warn('Renderer became unresponsive')
  })

  // 렌더러가 다시 응답할 때
  mainWindow.webContents.on('responsive', () => {
    console.log('Renderer became responsive again')
  })

  // 창이 복원될 때 (최소화에서 돌아올 때) 렌더러 상태 확인
  mainWindow.on('restore', () => {
    // 렌더러가 정상인지 확인하고 필요시 리로드
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript('document.body !== null')
        .catch(() => {
          console.warn('Renderer may be in bad state, reloading...')
          mainWindow?.webContents.reload()
        })
    }
  })

  // 창이 포커스될 때 렌더러 상태 확인
  mainWindow.on('focus', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // 렌더러가 살아있는지 간단히 체크
      mainWindow.webContents.executeJavaScript('1')
        .catch(() => {
          console.warn('Renderer not responding on focus, reloading...')
          mainWindow?.webContents.reload()
        })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // electron-vite에서 제공하는 환경 변수로 개발/프로덕션 구분
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 서브 윈도우 생성/토글 함수
function createOrToggleSubWindow(windowType: SubWindowType): boolean {
  // 이미 열려있으면 포커스
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
      nodeIntegration: false
    }
  })

  subWindow.on('ready-to-show', () => {
    // 메인 창 옆에 배치
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

  // URL에 쿼리 파라미터 추가하여 어떤 창인지 구분
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

// 창 최소화
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize()
})

// 창 닫기
ipcMain.on('window:close', () => {
  mainWindow?.close()
})

// 항상 위에 표시 토글
ipcMain.handle('window:toggle-always-on-top', () => {
  if (!mainWindow) return false
  const current = mainWindow.isAlwaysOnTop()
  mainWindow.setAlwaysOnTop(!current)
  return !current
})

// 항상 위에 표시 상태 확인
ipcMain.handle('window:is-always-on-top', () => {
  return mainWindow?.isAlwaysOnTop() ?? false
})

// 화면 정렬 기능
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

// 알림 지원 여부 확인
ipcMain.handle('notification:is-supported', () => {
  return Notification.isSupported()
})

// 알림 표시 (플랫폼별 처리)
ipcMain.handle('notification:show', (_event, options: NotificationActionOptions) => {
  if (!Notification.isSupported()) {
    return { success: false, reason: 'not-supported' }
  }

  const isMac = process.platform === 'darwin'

  // macOS: 액션 버튼 지원
  // Windows/Linux: 알림 클릭으로 대체
  const notificationOptions: Electron.NotificationConstructorOptions = {
    title: options.title,
    body: options.body,
    silent: true, // TTS와 함께 사용하므로 시스템 알림음 끔
  }

  // macOS에서만 액션 버튼 추가
  if (isMac && options.actions && options.actions.length > 0) {
    notificationOptions.actions = options.actions.map(action => ({
      type: 'button' as const,
      text: action.label
    }))
    // macOS에서 액션 버튼을 표시하려면 hasReply나 actions가 있어야 함
    notificationOptions.hasReply = false
  }

  const notification = new Notification(notificationOptions)

  // 알림 클릭 시 앱 창 포커스 + renderer에 이벤트 전달
  notification.on('click', () => {
    mainWindow?.show()
    mainWindow?.focus()
    mainWindow?.webContents.send('notification:clicked', { action: 'click' })
  })

  // macOS 액션 버튼 클릭 처리
  if (isMac) {
    notification.on('action', (_event, index) => {
      const actionId = options.actions?.[index]?.id || `action-${index}`
      mainWindow?.show()
      mainWindow?.focus()
      mainWindow?.webContents.send('notification:clicked', { action: actionId })
    })
  }

  // 알림 닫힘 처리
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

// 서브 윈도우 열기/토글
ipcMain.handle('subwindow:open', (_event, windowType: SubWindowType) => {
  return createOrToggleSubWindow(windowType)
})

// 서브 윈도우 닫기
ipcMain.handle('subwindow:close', (_event, windowType: SubWindowType) => {
  return closeSubWindow(windowType)
})

// 현재 창이 서브 윈도우인지 확인 (서브 윈도우에서 자신을 닫을 때 사용)
ipcMain.on('subwindow:close-self', (event) => {
  const webContents = event.sender
  const window = BrowserWindow.fromWebContents(webContents)
  if (window && window !== mainWindow) {
    window.close()
  }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 에러 핸들링 - 렌더러 프로세스 종료 시 복구
app.on('render-process-gone', (event, webContents, details) => {
  console.error('Renderer process gone:', details.reason)

  // 메인 윈도우의 렌더러가 종료된 경우 복구 시도
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents === webContents) {
    // clean-exit이 아닌 경우에만 복구 (사용자가 의도적으로 닫은 게 아닐 때)
    if (details.reason !== 'clean-exit') {
      console.log('Attempting to reload main window...')
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (process.env['ELECTRON_RENDERER_URL']) {
            mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
          } else {
            mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
          }
        }
      }, 1000)
    }
  }

  // 서브 윈도우의 렌더러가 종료된 경우 해당 창 닫기
  for (const [windowType, subWindow] of subWindows.entries()) {
    if (!subWindow.isDestroyed() && subWindow.webContents === webContents) {
      console.log(`Closing crashed sub-window: ${windowType}`)
      subWindow.close()
      break
    }
  }
})

app.on('child-process-gone', (_event, details) => {
  console.error('Child process gone:', details.type, details.reason)
})
