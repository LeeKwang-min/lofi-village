import { app, BrowserWindow, shell, ipcMain, screen } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null

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

// TODO(human): 화면 정렬 기능 구현
// alignTo 매개변수에 따라 창을 화면 왼쪽, 오른쪽, 또는 중앙에 배치하세요
// 힌트:
// - screen.getPrimaryDisplay().workAreaSize로 화면 크기를 얻을 수 있습니다
// - mainWindow.setPosition(x, y)로 창 위치를 설정합니다
// - mainWindow.getSize()로 현재 창 크기를 얻을 수 있습니다
ipcMain.on('window:align', (_event, alignTo: 'left' | 'right' | 'center') => {
  console.log('IPC received: window:align', alignTo) // 디버깅용
  if (!mainWindow) return

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize
  const [windowWidth, windowHeight] = mainWindow.getSize()
  console.log('Screen:', screenWidth, screenHeight, 'Window:', windowWidth, windowHeight) // 디버깅용

  const y = Math.floor((screenHeight - windowHeight) / 2);
  if (alignTo === 'left') {
    mainWindow.setPosition(0, y);
  } else if (alignTo === 'right') {
    mainWindow.setPosition(screenWidth - windowWidth, y);
  } else if (alignTo === 'center') {
    mainWindow.setPosition(Math.floor((screenWidth - windowWidth) / 2), y);
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

// 에러 핸들링
app.on('render-process-gone', (_event, _webContents, details) => {
  console.error('Renderer process gone:', details.reason)
})

app.on('child-process-gone', (_event, details) => {
  console.error('Child process gone:', details.type, details.reason)
})
