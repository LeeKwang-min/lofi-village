import { useState, useEffect } from 'react'
import { Minus, X, Pin, PinOff, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

export function TitleBar() {
  const [isPinned, setIsPinned] = useState(false)

  // 컴포넌트 마운트 시 Electron 환경인지 확인
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.isAlwaysOnTop().then(setIsPinned).catch(console.error)
    }
  }, [])

  const handleTogglePin = async () => {
    if (!window.electronAPI) return
    const newState = await window.electronAPI.toggleAlwaysOnTop()
    setIsPinned(newState)
  }

  const handleAlign = (position: 'left' | 'right' | 'center') => {
    console.log('handleAlign', position)
    window.electronAPI?.align(position)
  }

  const handleMinimize = () => {
    window.electronAPI?.minimize()
  }

  const handleClose = () => {
    window.electronAPI?.close()
  }

  return (
    <div
      className="flex justify-between items-center px-3 h-10 rounded-t-2xl backdrop-blur-sm bg-surface/80"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* 앱 타이틀 */}
      <div className="flex gap-2 items-center">
        <span className="text-lg">🏘️</span>
        <span className="text-sm font-medium text-text-primary">Lofi Village</span>
      </div>

      {/* 컨트롤 버튼들 */}
      <div
        className="flex gap-1 items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* 정렬 버튼들 */}
        <div className="mr-2 flex items-center gap-0.5 rounded-lg bg-background/50 px-1.5 py-1">
          <button
            onClick={() => handleAlign('left')}
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-warm/20 hover:text-warm"
            title="왼쪽 정렬"
          >
            <AlignLeft size={14} />
          </button>
          <button
            onClick={() => handleAlign('center')}
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-warm/20 hover:text-warm"
            title="중앙 정렬"
          >
            <AlignCenter size={14} />
          </button>
          <button
            onClick={() => handleAlign('right')}
            className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-warm/20 hover:text-warm"
            title="오른쪽 정렬"
          >
            <AlignRight size={14} />
          </button>
        </div>

        {/* 핀 버튼 */}
        <button
          onClick={handleTogglePin}
          className={`rounded-md p-1.5 transition-colors ${
            isPinned
              ? 'bg-warm/20 text-warm'
              : 'text-text-secondary hover:bg-warm/20 hover:text-warm'
          }`}
          title={isPinned ? '항상 위에 표시 해제' : '항상 위에 표시'}
        >
          {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
        </button>

        {/* 최소화 */}
        <button
          onClick={handleMinimize}
          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-text-secondary/20 hover:text-text-primary"
          title="최소화"
        >
          <Minus size={14} />
        </button>

        {/* 닫기 */}
        <button
          onClick={handleClose}
          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-red-500/20 hover:text-red-400"
          title="닫기"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
