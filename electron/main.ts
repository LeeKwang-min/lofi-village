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
      nodeIntegration: false,
      backgroundThrottling: false // 백그라운드에서도 타이머/오디오 유지
    }
  })

  // 백그라운드에서도 throttling 방지 (webPreferences 외 추가 보장)
  mainWindow.webContents.setBackgroundThrottling(false)

  mainWindow.on('ready-to-show', () => {
    // 화면 오른쪽에 초기 배치 (y=0으로 상단 정렬)
    const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize
    const [windowWidth] = mainWindow!.getSize()
    mainWindow?.setPosition(screenWidth - windowWidth, 0)
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 창이 숨겨져도 렌더러 유지 (macOS에서 중요)
  mainWindow.on('hide', () => {
    console.log('[Electron] Window hidden, but renderer should keep running')
  })

  // 창이 다시 보일 때 GPU 컨텍스트 복구
  mainWindow.on('show', () => {
    console.log('[Electron] Window shown, forcing repaint')
    mainWindow?.webContents.invalidate()
  })

  // 창 복원 시 렌더러 상태 확인 + GPU 복구
  mainWindow.on('restore', () => {
    console.log('[Electron] Window restored')
    mainWindow?.webContents.invalidate()
    mainWindow?.webContents.send('window:restored')
  })

  // 포커스 획득 시 GPU 컨텍스트 복구 (가려졌다가 돌아올 때 중요)
  mainWindow.on('focus', () => {
    console.log('[Electron] Window focused, forcing repaint')
    // 약간의 지연 후 invalidate (GPU 컨텍스트 복구 시간 확보)
    setTimeout(() => {
      mainWindow?.webContents.invalidate()
    }, 50)
    mainWindow?.webContents.send('window:focused')
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
      nodeIntegration: false,
      backgroundThrottling: false
    }
  })

  // 서브 윈도우도 백그라운드 throttling 방지
  subWindow.webContents.setBackgroundThrottling(false)

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
  // powerSaveBlocker 시작: OS가 앱을 suspend하지 않도록 방지
  // 'prevent-app-suspension': 앱이 suspend되는 것을 방지 (오디오/타이머 유지에 적합)
  // 'prevent-display-sleep': 디스플레이가 꺼지는 것도 방지 (필요시 사용)
  powerSaveBlockerId = powerSaveBlocker.start('prevent-app-suspension')
  console.log('[Electron] Power save blocker started with ID:', powerSaveBlockerId)

  createWindow()

  // 메모리 모니터링 시작
  startMemoryMonitoring()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // 메모리 모니터링 중지
  stopMemoryMonitoring()

  // powerSaveBlocker 정리
  if (powerSaveBlockerId !== null && powerSaveBlocker.isStarted(powerSaveBlockerId)) {
    powerSaveBlocker.stop(powerSaveBlockerId)
    console.log('[Electron] Power save blocker stopped')
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ============================================
// 에러 핸들링 및 자동 복구
// ============================================

// 렌더러 프로세스 종료 시 자동 복구
app.on('render-process-gone', (event, webContents, details) => {
  console.error('[Electron] Renderer process gone:', details.reason)

  // 복구 가능한 상황인지 확인
  const recoverableReasons = ['crashed', 'oom', 'launch-failed', 'integrity-failure']

  if (recoverableReasons.includes(details.reason)) {
    console.log('[Electron] Attempting to recover renderer...')

    // 해당 webContents가 메인 윈도우인지 확인
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents === webContents) {
      // 약간의 지연 후 페이지 리로드
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log('[Electron] Reloading main window...')
          mainWindow.webContents.reload()
        }
      }, 1000)
    }
  } else if (details.reason === 'killed') {
    // OS에 의해 kill된 경우 - 창 재생성
    console.log('[Electron] Renderer was killed, recreating window...')
    setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        createWindow()
      }
    }, 1000)
  }
})

// GPU 등 자식 프로세스 종료 시 처리
app.on('child-process-gone', (_event, details) => {
  console.error('[Electron] Child process gone:', details.type, details.reason)

  // GPU 프로세스 크래시 시 렌더러 강제 repaint
  if (details.type === 'GPU') {
    console.log('[Electron] GPU process crashed, forcing repaint on all windows...')

    // 모든 윈도우에 repaint 신호
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.invalidate()
        // 렌더러에 GPU 복구 알림
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
  // 30초마다 메모리 체크
  memoryCheckInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return

    // 렌더러 프로세스 메모리 정보 요청
    mainWindow.webContents.executeJavaScript(`
      performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null
    `).then((memoryInfo) => {
      if (memoryInfo) {
        const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)
        const limitMB = Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024)
        const usagePercent = Math.round((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100)

        // 메모리 사용량이 80% 이상이면 경고
        if (usagePercent >= 80) {
          console.warn(`[Electron] High memory usage: ${usedMB}MB / ${limitMB}MB (${usagePercent}%)`)

          // 90% 이상이면 가비지 컬렉션 유도
          if (usagePercent >= 90) {
            console.warn('[Electron] Critical memory usage, triggering GC...')
            // 렌더러에 메모리 정리 요청
            mainWindow?.webContents.send('memory:pressure')
          }
        }
      }
    }).catch(() => {
      // performance.memory는 Chrome 계열에서만 지원, 에러 무시
    })
  }, 30000)
}

function stopMemoryMonitoring() {
  if (memoryCheckInterval) {
    clearInterval(memoryCheckInterval)
    memoryCheckInterval = null
  }
}
