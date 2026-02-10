import { useState, useRef } from 'react'
import { Coins, Store, Pencil, Trash2, X, Package, FlipHorizontal2, FlipVertical2, Check } from 'lucide-react'
import { useVillageContext } from '@/contexts/VillageContext'
import { Building, LayerType, getBuildingsByLayer, PlacedItem } from '@/hooks/useVillage'
import { getDefaultQuantity } from '@/config/villageAssets'

const GRID_COLS = 5
const GRID_ROWS = 5

type EditMode = 'none' | 'add' | 'remove'
type PanelMode = 'none' | 'shop' | 'inventory'

interface PreviewState {
  x: number
  y: number
  flipX: boolean
  flipY: boolean
  scale: number
}

const LAYER_TABS: { id: LayerType; name: string; icon: string }[] = [
  { id: 'tile', name: '바닥', icon: '🟩' },
  { id: 'environment', name: '자연', icon: '🌳' },
  { id: 'structure', name: '건물', icon: '🏠' },
  { id: 'unit', name: '유닛', icon: '👤' }
]

// CSS transform 생성 (반전 + 크기)
function itemTransform(flipX: boolean, flipY: boolean, scale: number, extra?: string): string {
  const parts: string[] = []
  if (extra) parts.push(extra)
  const sx = (flipX ? -1 : 1) * scale
  const sy = (flipY ? -1 : 1) * scale
  parts.push(`scale(${sx}, ${sy})`)
  return parts.join(' ')
}

export function Village() {
  const {
    coins,
    level,
    purchaseBuilding,
    placeBuilding,
    removeItem,
    removeTileAt,
    clearAllItems,
    getItemsAt,
    getOwnedQuantity,
    getRemainingQuantity,
    getFreePlacedItems,
  } = useVillageContext()

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [panelMode, setPanelMode] = useState<PanelMode>('none')
  const [activeLayer, setActiveLayer] = useState<LayerType>('tile')
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [isDragging, setIsDragging] = useState(false)
  const [currentFlipX, setCurrentFlipX] = useState(false)
  const [currentFlipY, setCurrentFlipY] = useState(false)
  const [currentScale, setCurrentScale] = useState(1)
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [purchaseTarget, setPurchaseTarget] = useState<Building | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  const freePlacedItems = getFreePlacedItems()

  // 그리드 셀에 타일 설치 또는 삭제
  const handleCellAction = (position: number) => {
    if (editMode === 'add' && selectedBuilding && selectedBuilding.layer === 'tile') {
      placeBuilding(selectedBuilding.id, { position, flipX: currentFlipX, flipY: currentFlipY, scale: currentScale })
    } else if (editMode === 'remove') {
      removeTileAt(position)
    }
  }

  // 마우스 다운 - 드래그 시작
  const handleCellMouseDown = (e: React.MouseEvent, position: number) => {
    e.preventDefault()
    if (editMode === 'add' || editMode === 'remove') {
      setIsDragging(true)
      handleCellAction(position)
    }
  }

  // 마우스 엔터 - 드래그 중 셀 위를 지나갈 때
  const handleCellMouseEnter = (position: number) => {
    if (isDragging && (editMode === 'add' || editMode === 'remove')) {
      handleCellAction(position)
    }
  }

  // 마우스 업 - 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 자유 배치 영역 클릭 → 미리보기 생성 또는 위치 이동
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editMode !== 'add' || !selectedBuilding || selectedBuilding.layer === 'tile') return
    if (!mapRef.current) return

    const rect = mapRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    if (preview) {
      setPreview({ ...preview, x, y })
    } else {
      setPreview({ x, y, flipX: currentFlipX, flipY: currentFlipY, scale: currentScale })
    }
  }

  // 미리보기 확정
  const confirmPreview = () => {
    if (!preview || !selectedBuilding) return
    placeBuilding(selectedBuilding.id, { x: preview.x, y: preview.y, flipX: preview.flipX, flipY: preview.flipY, scale: preview.scale })
    setPreview(null)
  }

  // 미리보기 취소
  const cancelPreview = () => {
    setPreview(null)
  }

  // 좌우 반전 토글
  const toggleFlipX = () => {
    const next = !currentFlipX
    setCurrentFlipX(next)
    if (preview) {
      setPreview({ ...preview, flipX: next })
    }
  }

  // 상하 반전 토글
  const toggleFlipY = () => {
    const next = !currentFlipY
    setCurrentFlipY(next)
    if (preview) {
      setPreview({ ...preview, flipY: next })
    }
  }

  // 크기 조절
  const adjustScale = (delta: number) => {
    const next = Math.round(Math.max(0.5, Math.min(2.0, currentScale + delta)) * 10) / 10
    setCurrentScale(next)
    if (preview) {
      setPreview({ ...preview, scale: next })
    }
  }

  // 구매 확인 팝업 열기
  const handleShopItemClick = (building: Building) => {
    if (coins < building.cost) return
    setPurchaseTarget(building)
  }

  // 구매 확정
  const confirmPurchase = () => {
    if (!purchaseTarget) return
    purchaseBuilding(purchaseTarget)
    setPurchaseTarget(null)
  }

  // 인벤토리에서 아이템 선택 (설치 모드 진입)
  const handleSelectFromInventory = (building: Building) => {
    setSelectedBuilding(building)
    setEditMode('add')
    setCurrentFlipX(false)
    setCurrentFlipY(false)
    setCurrentScale(1)
    setPreview(null)
  }

  // 모드 취소
  const cancelMode = () => {
    setEditMode('none')
    setSelectedBuilding(null)
    setPreview(null)
    setCurrentFlipX(false)
    setCurrentFlipY(false)
    setCurrentScale(1)
  }

  // 인벤토리 토글
  const toggleInventory = () => {
    if (panelMode === 'inventory') {
      setPanelMode('none')
      if (editMode === 'add') {
        cancelMode()
      }
    } else {
      setPanelMode('inventory')
    }
  }

  // 삭제 모드 시작
  const startRemoveMode = () => {
    setEditMode('remove')
    setSelectedBuilding(null)
    setPreview(null)
    setPanelMode('none')
  }

  // 자유 배치 아이템 삭제
  const handleFreeItemClick = (item: PlacedItem & { building: Building }) => {
    if (editMode === 'remove') {
      removeItem(item.id)
    }
  }

  // 자유 배치 아이템의 크기 (레이어별)
  const getFreeItemSize = (layer: LayerType): string => {
    switch (layer) {
      case 'structure': return '18%'
      case 'environment': return '14%'
      case 'unit': return '10%'
      default: return '12%'
    }
  }

  // 미리보기 드래그
  const handlePreviewDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!preview || !mapRef.current) return
    e.preventDefault()
    e.stopPropagation()

    const rect = mapRef.current.getBoundingClientRect()

    const onMouseMove = (moveEvent: MouseEvent) => {
      const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100))
      setPreview(prev => prev ? { ...prev, x, y } : null)
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  return (
    <section className="p-4 rounded-xl border border-surface-hover/50 bg-surface/50">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2 items-center">
          <span className="text-xl">🏘️</span>
          <h2 className="text-sm font-semibold text-text-primary">나의 마을</h2>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-xs text-warm">Lv. {level}</span>
          <div className="flex gap-1 items-center px-2 py-1 rounded-full bg-yellow-500/20">
            <Coins size={12} className="text-yellow-500" />
            <span className="text-xs font-medium text-yellow-500">{coins}</span>
          </div>
        </div>
      </div>

      {/* 마을 맵 컨테이너 */}
      <div
        ref={mapRef}
        className="relative mb-3 rounded-lg border border-surface-hover bg-background/50 select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 타일 그리드 */}
        <div
          className="grid relative p-2"
          style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: 0 }}
          onClick={(e) => handleMapClick(e)}
        >
          {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, index) => {
            const items = getItemsAt(index)
            const row = Math.floor(index / GRID_COLS)

            return (
              <button
                key={index}
                onMouseDown={(e) => handleCellMouseDown(e, index)}
                onMouseEnter={() => handleCellMouseEnter(index)}
                onDragStart={(e) => e.preventDefault()}
                className={`relative aspect-square transition-all duration-150 ${editMode === 'add' && selectedBuilding?.layer === 'tile' ? 'cursor-copy hover:brightness-125' : ''} ${editMode === 'remove' ? 'cursor-pointer hover:brightness-75' : ''} ${editMode === 'none' ? 'cursor-default' : ''} `}
                style={{
                  backgroundColor: '#c8d5b9',
                  zIndex: row
                }}
              >
                {/* 타일 렌더링 */}
                {items.tile && (
                  <img
                    src={items.tile.imagePath}
                    alt={items.tile.name}
                    draggable={false}
                    className="object-cover absolute inset-0 w-full h-full"
                    style={{ zIndex: 0 }}
                  />
                )}

                {/* 삭제 모드 시 타일이 있으면 표시 */}
                {editMode === 'remove' && items.tile && (
                  <div className="flex absolute inset-0 z-10 justify-center items-center bg-red-500/30">
                    <Trash2 size={12} className="text-red-400" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* 자유 배치 오버레이 */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          {freePlacedItems.map((item) => (
            <div
              key={item.id}
              className={`absolute pointer-events-auto ${editMode === 'remove' ? 'cursor-pointer hover:ring-2 hover:ring-red-400 rounded' : ''}`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: itemTransform(item.flipX, item.flipY, item.scale, 'translate(-50%, -100%)'),
                width: getFreeItemSize(item.layer),
                zIndex: Math.floor((item.y ?? 0) / 10) + 10,
              }}
              onClick={() => handleFreeItemClick(item)}
            >
              <img
                src={item.building.imagePath}
                alt={item.building.name}
                draggable={false}
                className="object-contain w-full h-full"
              />
              {editMode === 'remove' && (
                <div className="flex absolute inset-0 justify-center items-center bg-red-500/30 rounded">
                  <Trash2 size={12} className="text-red-400" />
                </div>
              )}
            </div>
          ))}

          {/* 미리보기 (드래그 가능) */}
          {preview && selectedBuilding && (
            <div
              className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
              style={{
                left: `${preview.x}%`,
                top: `${preview.y}%`,
                transform: itemTransform(preview.flipX, preview.flipY, preview.scale, 'translate(-50%, -100%)'),
                width: getFreeItemSize(selectedBuilding.layer),
                zIndex: 100,
                opacity: 0.7,
              }}
              onMouseDown={handlePreviewDrag}
            >
              <img
                src={selectedBuilding.imagePath}
                alt={selectedBuilding.name}
                draggable={false}
                className="object-contain w-full h-full"
              />
              <div className="absolute inset-0 border-2 border-green-400 border-dashed rounded animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* 미리보기 확인/취소/반전/크기 바 */}
      {preview && selectedBuilding && (
        <div className="flex flex-wrap gap-2 justify-center items-center p-2 mb-3 rounded-lg border border-green-500/20 bg-green-500/10">
          <button
            onClick={toggleFlipX}
            className={`flex gap-1 items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              preview.flipX
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'
            }`}
          >
            <FlipHorizontal2 size={12} />
            좌우
          </button>
          <button
            onClick={toggleFlipY}
            className={`flex gap-1 items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              preview.flipY
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'
            }`}
          >
            <FlipVertical2 size={12} />
            상하
          </button>
          <div className="flex gap-1 items-center px-2 py-1 rounded-md bg-surface-hover">
            <button
              onClick={() => adjustScale(-0.1)}
              disabled={currentScale <= 0.5}
              className="px-1.5 text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-30"
            >
              −
            </button>
            <span className="text-xs font-medium text-text-secondary w-8 text-center">{currentScale.toFixed(1)}x</span>
            <button
              onClick={() => adjustScale(0.1)}
              disabled={currentScale >= 2.0}
              className="px-1.5 text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-30"
            >
              +
            </button>
          </div>
          <button
            onClick={confirmPreview}
            className="flex gap-1 items-center px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-md transition-colors hover:bg-green-600"
          >
            <Check size={12} />
            확인
          </button>
          <button
            onClick={cancelPreview}
            className="flex gap-1 items-center px-3 py-1.5 text-xs font-medium text-red-400 rounded-md transition-colors bg-red-500/10 hover:bg-red-500/20"
          >
            <X size={12} />
            취소
          </button>
        </div>
      )}

      {/* 모드 표시 바 */}
      {editMode !== 'none' && !preview && (
        <div
          className={`mb-3 rounded-lg p-2 ${
            editMode === 'add'
              ? 'border border-green-500/20 bg-green-500/10'
              : 'border border-red-500/20 bg-red-500/10'
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              {editMode === 'add' ? (
                <>
                  <Pencil size={14} className="text-green-400" />
                  <img
                    src={selectedBuilding?.imagePath}
                    alt=""
                    className="object-contain w-6 h-6"
                  />
                  <span className="text-sm text-green-400">{selectedBuilding?.name} 설치 모드</span>
                  {selectedBuilding && (
                    <span className="text-xs text-green-300">
                      (남은 수량: {getRemainingQuantity(selectedBuilding.id)})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Trash2 size={14} className="text-red-400" />
                  <span className="text-sm text-red-400">삭제 모드</span>
                  <span className="text-xs text-red-300 ml-1">타일/아이템을 클릭하여 삭제</span>
                </>
              )}
            </div>
            <div className="flex gap-1 items-center">
              {/* 설치 모드일 때 반전/크기 버튼 */}
              {editMode === 'add' && (
                <>
                  <button
                    onClick={toggleFlipX}
                    className={`flex gap-1 items-center px-2 py-1 text-xs rounded transition-colors ${
                      currentFlipX
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'
                    }`}
                    title="좌우 반전"
                  >
                    <FlipHorizontal2 size={12} />
                  </button>
                  <button
                    onClick={toggleFlipY}
                    className={`flex gap-1 items-center px-2 py-1 text-xs rounded transition-colors ${
                      currentFlipY
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'
                    }`}
                    title="상하 반전"
                  >
                    <FlipVertical2 size={12} />
                  </button>
                  <div className="flex gap-0.5 items-center px-1 py-0.5 rounded bg-surface-hover">
                    <button
                      onClick={() => adjustScale(-0.1)}
                      disabled={currentScale <= 0.5}
                      className="px-1 text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-30"
                    >−</button>
                    <span className="text-[10px] text-text-secondary w-6 text-center">{currentScale.toFixed(1)}</span>
                    <button
                      onClick={() => adjustScale(0.1)}
                      disabled={currentScale >= 2.0}
                      className="px-1 text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-30"
                    >+</button>
                  </div>
                </>
              )}
              <button
                onClick={cancelMode}
                className="p-1 rounded transition-colors text-text-muted hover:bg-surface-hover hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          {/* 삭제 모드: 초기화 버튼만 */}
          {editMode === 'remove' && (
            <div className="flex gap-2 pt-2 mt-2 border-t border-red-300">
              <button
                onClick={() => clearAllItems()}
                className="flex flex-1 items-center justify-center gap-1 rounded-md bg-red-500 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
              >
                <Trash2 size={12} />
                마을 초기화
              </button>
            </div>
          )}
        </div>
      )}

      {/* 모드 버튼들 */}
      {editMode === 'none' && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setPanelMode(panelMode === 'shop' ? 'none' : 'shop')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg p-2 transition-colors ${
              panelMode === 'shop'
                ? 'border border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                : 'bg-cool/10 text-cool hover:bg-cool/20'
            }`}
          >
            <Store size={16} />
            <span className="text-sm font-medium">상점</span>
          </button>
          <button
            onClick={toggleInventory}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg p-2 transition-colors ${
              panelMode === 'inventory'
                ? 'border border-cool/30 bg-cool/20 text-cool'
                : 'bg-surface-hover/50 text-text-secondary hover:bg-surface-hover'
            }`}
          >
            <Package size={16} />
            <span className="text-sm font-medium">인벤토리</span>
          </button>
          <button
            onClick={startRemoveMode}
            className="flex gap-2 justify-center items-center p-2 px-4 text-red-400 rounded-lg transition-colors bg-red-500/10 hover:bg-red-500/20"
          >
            <Trash2 size={16} />
            <span className="text-sm font-medium">삭제</span>
          </button>
        </div>
      )}

      {/* 설치 모드일 때도 인벤토리 버튼 표시 */}
      {editMode === 'add' && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={toggleInventory}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg p-2 transition-colors ${
              panelMode === 'inventory'
                ? 'border border-cool/30 bg-cool/20 text-cool'
                : 'bg-surface-hover/50 text-text-secondary hover:bg-surface-hover'
            }`}
          >
            <Package size={16} />
            <span className="text-sm font-medium">
              인벤토리 {panelMode === 'inventory' ? '닫기' : '열기'}
            </span>
          </button>
        </div>
      )}

      {/* 상점 패널 */}
      {panelMode === 'shop' && editMode === 'none' && (
        <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex gap-2 items-center mb-3">
            <Store size={14} className="text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">상점</span>
            <span className="ml-auto text-xs text-text-muted">아이템을 구매하세요</span>
          </div>

          {/* 레이어 탭 */}
          <div className="flex gap-1 mb-3">
            {LAYER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLayer(tab.id)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  activeLayer === tab.id
                    ? 'border border-amber-400 bg-amber-100 text-amber-800'
                    : 'bg-surface/80 text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>

          {/* 구매 가능한 아이템 목록 */}
          <div className="overflow-y-auto pr-1 max-h-48">
            <div className="grid grid-cols-4 gap-2">
              {getBuildingsByLayer(activeLayer).map((building) => {
                const owned = getOwnedQuantity(building.id)
                const canAfford = coins >= building.cost
                const qty = getDefaultQuantity(building.layer)

                return (
                  <button
                    key={building.id}
                    onClick={() => handleShopItemClick(building)}
                    disabled={!canAfford}
                    className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                      canAfford
                        ? 'border border-transparent bg-surface-hover hover:border-yellow-500/30 hover:bg-yellow-500/20'
                        : 'opacity-50 cursor-not-allowed bg-surface/30'
                    } `}
                    title={building.description}
                  >
                    <img
                      src={building.imagePath}
                      alt={building.name}
                      className="object-contain w-8 h-8"
                    />
                    <span className="w-full truncate text-center text-[10px] text-text-secondary">
                      {building.name}
                    </span>
                    <span className="text-[10px] text-gray-800">
                      {building.cost}💰 ×{qty}
                    </span>
                    {owned > 0 && (
                      <span className="text-[10px] text-green-600">보유 {owned}개</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <p className="mt-2 text-center text-[10px] text-text-muted">
            💰 구매한 아이템은 인벤토리에서 설치할 수 있어요
          </p>
        </div>
      )}

      {/* 인벤토리 패널 */}
      {panelMode === 'inventory' && (
        <div className="p-3 rounded-lg border border-cool/20 bg-cool/5">
          <div className="flex gap-2 items-center mb-3">
            <Package size={14} className="text-cool" />
            <span className="text-sm font-medium text-cool">인벤토리</span>
            <span className="ml-auto text-xs text-text-muted">클릭하여 설치</span>
          </div>

          {/* 레이어 탭 */}
          <div className="flex gap-1 mb-3">
            {LAYER_TABS.map((tab) => {
              const totalRemaining = getBuildingsByLayer(tab.id)
                .reduce((sum, b) => sum + Math.max(0, getRemainingQuantity(b.id)), 0)
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveLayer(tab.id)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    activeLayer === tab.id
                      ? 'border border-sky-400 bg-sky-100 text-sky-800'
                      : 'bg-surface/80 text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.name}
                  {totalRemaining > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">({totalRemaining})</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 보유 아이템 목록 */}
          <div className="overflow-y-auto pr-1 max-h-48">
            <div className="grid grid-cols-4 gap-2">
              {getBuildingsByLayer(activeLayer)
                .filter((building) => getOwnedQuantity(building.id) > 0)
                .map((building) => {
                  const isSelected = selectedBuilding?.id === building.id && editMode === 'add'
                  const remaining = getRemainingQuantity(building.id)
                  const owned = getOwnedQuantity(building.id)

                  return (
                    <button
                      key={building.id}
                      onClick={() => remaining > 0 && handleSelectFromInventory(building)}
                      disabled={remaining <= 0}
                      className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                        isSelected
                          ? 'border-2 ring-2 border-green-500/50 bg-green-500/20 ring-green-500/30'
                          : remaining > 0
                            ? 'border border-transparent bg-surface-hover hover:border-cool/30 hover:bg-cool/20'
                            : 'opacity-40 cursor-not-allowed bg-surface/30'
                      } `}
                      title={building.description}
                    >
                      <img
                        src={building.imagePath}
                        alt={building.name}
                        className="object-contain w-8 h-8"
                      />
                      <span className="w-full truncate text-center text-[10px] text-text-secondary">
                        {building.name}
                      </span>
                      <span className={`text-[10px] ${remaining > 0 ? 'text-cool' : 'text-text-muted'}`}>
                        {remaining}/{owned}
                      </span>
                      {isSelected && <span className="text-[10px] text-green-400">선택됨</span>}
                    </button>
                  )
                })}
            </div>

            {getBuildingsByLayer(activeLayer).filter((b) => getOwnedQuantity(b.id) > 0).length === 0 && (
              <p className="py-4 text-xs text-center text-text-muted">
                이 카테고리에 보유한 아이템이 없어요
              </p>
            )}
          </div>

          <p className="mt-2 text-center text-[10px] text-text-muted">
            {activeLayer === 'tile'
              ? '🏗️ 아이템을 선택하고 그리드를 클릭/드래그해서 설치하세요'
              : '🏗️ 아이템을 선택하고 맵을 클릭해서 설치하세요'}
          </p>
        </div>
      )}

      {/* 구매 확인 팝업 */}
      {purchaseTarget && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black/50">
          <div className="p-4 mx-4 w-full max-w-xs bg-white rounded-xl shadow-xl">
            <div className="flex flex-col gap-3 items-center">
              <img
                src={purchaseTarget.imagePath}
                alt={purchaseTarget.name}
                className="object-contain w-16 h-16"
              />
              <h3 className="text-sm font-semibold text-gray-800">{purchaseTarget.name}</h3>
              <p className="text-xs text-gray-500">{purchaseTarget.description}</p>

              <div className="w-full p-2 rounded-lg bg-gray-50">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">가격</span>
                  <span className="font-medium text-yellow-600">{purchaseTarget.cost} 💰</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">지급 수량</span>
                  <span className="font-medium text-gray-700">×{getDefaultQuantity(purchaseTarget.layer)}</span>
                </div>
                {getOwnedQuantity(purchaseTarget.id) > 0 && (
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-500">현재 보유</span>
                    <span className="font-medium text-green-600">{getOwnedQuantity(purchaseTarget.id)}개</span>
                  </div>
                )}
              </div>

              {/* 확인/취소 버튼 */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setPurchaseTarget(null)}
                  className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={confirmPurchase}
                  className="flex-1 py-2 text-xs font-medium text-white bg-yellow-500 rounded-lg transition-colors hover:bg-yellow-600"
                >
                  구매하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
