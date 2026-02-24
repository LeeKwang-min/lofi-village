import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Coins,
  Store,
  Pencil,
  Trash2,
  X,
  Package,
  FlipHorizontal2,
  FlipVertical2,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Undo2
} from 'lucide-react'
import { useVillageContext } from '@/contexts/VillageContext'
import { Building, LayerType, getBuildingsByLayer, PlacedItem } from '@/hooks/useVillage'
import { getDefaultQuantity } from '@/config/villageAssets'

const GRID_COLS = 5
const GRID_ROWS = 5

// 자유 배치 좌표 제한 (에셋이 맵 밖으로 완전히 밀려나지 않도록 최소한의 마진)
// transform: translate(-50%, -100%) 기준으로 에셋의 중심-하단이 앵커
const PLACE_MIN_X = 1
const PLACE_MAX_X = 99
const PLACE_MIN_Y = 3
const PLACE_MAX_Y = 99

function clampPosition(x: number, y: number) {
  return {
    x: Math.max(PLACE_MIN_X, Math.min(PLACE_MAX_X, x)),
    y: Math.max(PLACE_MIN_Y, Math.min(PLACE_MAX_Y, y))
  }
}

type EditMode = 'none' | 'add'
type PanelMode = 'none' | 'shop' | 'inventory'

// 스프라이트 이미지 지원 컴포넌트: spriteFrames가 있으면 CSS background 기반 렌더링
function BuildingImage({
  building,
  animated = false,
  className = '',
  style
}: {
  building: Building
  animated?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const frames = building.spriteFrames

  if (frames && frames > 1) {
    return (
      <div
        className={className}
        style={{
          ...style,
          backgroundImage: `url(${building.imagePath})`,
          backgroundSize: `${frames * 100}% 100%`,
          backgroundPosition: '0 0',
          backgroundRepeat: 'no-repeat',
          // 서브픽셀 렌더링 갭 방지: 셀보다 살짝 크게 렌더링
          transform: 'scale(1.01)',
          ...(animated
            ? ({
                '--sprite-offset': `${(frames * 100) / (frames - 1)}%`,
                animation: `spriteAnimate ${frames * 800}ms steps(${frames}) infinite`
              } as React.CSSProperties)
            : {})
        }}
      />
    )
  }

  return (
    <img
      src={building.imagePath}
      alt={building.name}
      draggable={false}
      className={className}
      style={style}
    />
  )
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
    updateItem,
    bringForward,
    sendBackward,
    clearAllItems,
    getItemsAt,
    getOwnedQuantity,
    getRemainingQuantity,
    getFreePlacedItems,
    pushUndoSnapshot,
    undo,
    clearUndoHistory,
    canUndo
  } = useVillageContext()

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [panelMode, setPanelMode] = useState<PanelMode>('none')
  const [activeLayer, setActiveLayer] = useState<LayerType>('tile')
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [isTileDragging, setIsTileDragging] = useState(false)
  const [selectedPlacedItemId, setSelectedPlacedItemId] = useState<string | null>(null)
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [purchaseTarget, setPurchaseTarget] = useState<Building | null>(null)
  const wasDraggingRef = useRef(false)
  const mapRef = useRef<HTMLDivElement>(null)

  const freePlacedItems = getFreePlacedItems()
  const isTileEditMode = editMode === 'add' && selectedBuilding?.layer === 'tile'

  // 마운트 시 undo 히스토리 초기화
  useEffect(() => {
    clearUndoHistory()
  }, [clearUndoHistory])

  // Cmd+Z / Ctrl+Z 키보드 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo])

  // 선택된 배치 아이템 정보
  const selectedPlacedItem = selectedPlacedItemId
    ? (freePlacedItems.find((item) => item.id === selectedPlacedItemId) ?? null)
    : null

  // 그리드 셀에 타일 설치
  const handleCellAction = (position: number) => {
    if (editMode === 'add' && selectedBuilding && selectedBuilding.layer === 'tile') {
      placeBuilding(selectedBuilding.id, { position })
    }
  }

  // 마우스 다운 - 타일 드래그 시작
  const handleCellMouseDown = (e: React.MouseEvent, position: number) => {
    e.preventDefault()
    if (editMode === 'add') {
      pushUndoSnapshot()
      setIsTileDragging(true)
      handleCellAction(position)
    }
  }

  // 마우스 엔터 - 타일 드래그 중 셀 위를 지나갈 때
  const handleCellMouseEnter = (position: number) => {
    if (isTileDragging && editMode === 'add') {
      handleCellAction(position)
    }
  }

  // 마우스 업 - 타일 드래그 종료
  const handleMouseUp = () => {
    setIsTileDragging(false)
  }

  // 맵 빈 영역 클릭 → 선택 해제
  const handleMapClick = () => {
    if (selectedPlacedItemId) {
      setSelectedPlacedItemId(null)
    }
  }

  // 자유 배치 아이템 클릭 → 선택/해제 토글 + 타일 설치 모드 해제
  const handleFreeItemClick = (item: PlacedItem & { building: Building }) => {
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false
      return
    }
    if (editMode === 'add') {
      setEditMode('none')
      setSelectedBuilding(null)
    }
    setSelectedPlacedItemId((prev) => (prev === item.id ? null : item.id))
  }

  // 선택된 아이템 드래그 이동
  const handleSelectedItemDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, itemId: string) => {
      if (!mapRef.current) return
      e.preventDefault()
      e.stopPropagation()

      pushUndoSnapshot()
      const rect = mapRef.current.getBoundingClientRect()
      let moved = false
      setDraggingItemId(itemId)

      const onMouseMove = (moveEvent: MouseEvent) => {
        moved = true
        const rawX = ((moveEvent.clientX - rect.left) / rect.width) * 100
        const rawY = ((moveEvent.clientY - rect.top) / rect.height) * 100
        const { x, y } = clampPosition(rawX, rawY)
        updateItem(itemId, { x, y })
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        setDraggingItemId(null)
        if (moved) {
          wasDraggingRef.current = true
        }
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [updateItem, pushUndoSnapshot]
  )

  // 선택된 아이템 반전 토글
  const toggleSelectedFlipX = () => {
    if (!selectedPlacedItem) return
    pushUndoSnapshot()
    updateItem(selectedPlacedItem.id, { flipX: !selectedPlacedItem.flipX })
  }

  const toggleSelectedFlipY = () => {
    if (!selectedPlacedItem) return
    pushUndoSnapshot()
    updateItem(selectedPlacedItem.id, { flipY: !selectedPlacedItem.flipY })
  }

  // 선택된 아이템 크기 조절
  const adjustSelectedScale = (delta: number) => {
    if (!selectedPlacedItem) return
    pushUndoSnapshot()
    const next =
      Math.round(Math.max(0.5, Math.min(2.0, selectedPlacedItem.scale + delta)) * 10) / 10
    updateItem(selectedPlacedItem.id, { scale: next })
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

  // 인벤토리에서 아이템 선택
  const handleSelectFromInventory = (building: Building) => {
    if (building.layer === 'tile') {
      // 타일: 기존 설치 모드
      setSelectedBuilding(building)
      setEditMode('add')
    } else {
      // 비타일: 타일 설치 모드 해제 + 즉시 배치 + 자동 선택
      pushUndoSnapshot()
      setEditMode('none')
      setSelectedBuilding(null)
      const defaultScale = 1.5
      const newId = placeBuilding(building.id, {
        x: 50,
        y: 50,
        flipX: false,
        flipY: false,
        scale: defaultScale
      })
      if (newId) {
        setSelectedPlacedItemId(newId)
      }
    }
  }

  // 타일 설치 모드 취소
  const cancelMode = () => {
    setEditMode('none')
    setSelectedBuilding(null)
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

  // 선택된 아이템 삭제
  const deleteSelectedItem = () => {
    if (!selectedPlacedItemId) return
    pushUndoSnapshot()
    removeItem(selectedPlacedItemId)
    setSelectedPlacedItemId(null)
  }

  // 초기화 (confirm 포함)
  const handleReset = () => {
    if (window.confirm('마을의 모든 배치된 아이템을 삭제하시겠습니까?')) {
      pushUndoSnapshot()
      clearAllItems()
      setSelectedPlacedItemId(null)
    }
  }

  // 자유 배치 아이템의 크기 (레이어별)
  const getFreeItemSize = (layer: LayerType): string => {
    switch (layer) {
      case 'structure':
        return '18%'
      case 'environment':
        return '14%'
      case 'unit':
        return '10%'
      default:
        return '12%'
    }
  }

  return (
    <section className="p-4 rounded-xl border border-surface-hover/50 bg-surface/50">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2 items-center">
          <span className="text-xl">🏘️</span>
          <h2 className="text-sm font-semibold text-text-primary">나의 마을</h2>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            className="p-1 rounded transition-colors text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            title="되돌리기 (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
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
        className="overflow-hidden relative mb-3 rounded-lg border select-none border-surface-hover bg-background/50"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 타일 그리드 */}
        <div
          className="grid relative p-2"
          style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: 0 }}
          onClick={handleMapClick}
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
                className={`relative aspect-square transition-all duration-150 ${editMode === 'add' && selectedBuilding?.layer === 'tile' ? 'cursor-copy hover:brightness-125' : 'cursor-default'} `}
                style={{
                  backgroundColor: '#c8d5b9',
                  zIndex: row
                }}
              >
                {/* 타일 렌더링 */}
                {items.tile && (
                  <BuildingImage
                    building={items.tile}
                    animated={!!items.tile.spriteFrames}
                    className="absolute inset-0 w-full h-full"
                    style={{ zIndex: 0 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* 자유 배치 오버레이 */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          {freePlacedItems.map((item) => {
            const isSelected = selectedPlacedItemId === item.id
            const clamped = clampPosition(item.x ?? 50, item.y ?? 50)
            return (
              <div
                key={item.id}
                className={`absolute ${isTileEditMode ? 'pointer-events-none opacity-60' : 'cursor-pointer pointer-events-auto'}`}
                style={{
                  left: `${clamped.x}%`,
                  top: `${clamped.y}%`,
                  transform: itemTransform(
                    item.flipX,
                    item.flipY,
                    item.scale,
                    'translate(-50%, -100%)'
                  ),
                  width: getFreeItemSize(item.layer),
                  zIndex: draggingItemId === item.id ? 100 : item.zOrder + 10
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleFreeItemClick(item)
                }}
                onMouseDown={(e) => {
                  if (isSelected) {
                    handleSelectedItemDrag(e, item.id)
                  }
                }}
              >
                <img
                  src={item.building.imagePath}
                  alt={item.building.name}
                  draggable={false}
                  className="object-contain w-full h-full"
                />
                {/* 선택 인디케이터 */}
                {isSelected && (
                  <div
                    className="absolute -inset-1 rounded border-2 border-sky-400 border-dashed pointer-events-none"
                    style={{ boxShadow: '0 0 8px rgba(56, 189, 248, 0.4)' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 선택된 아이템 모드바 */}
      {selectedPlacedItem && (
        <div className="p-2 mb-3 rounded-lg border border-sky-500/20 bg-sky-500/10">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <BuildingImage building={selectedPlacedItem.building} className="w-6 h-6" />
              <span className="text-sm text-sky-400">{selectedPlacedItem.building.name}</span>
            </div>
            <div className="flex gap-1 items-center">
              <button
                onClick={toggleSelectedFlipX}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                  selectedPlacedItem.flipX
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'
                }`}
                title="좌우 반전"
              >
                <FlipHorizontal2 size={12} />
              </button>
              <button
                onClick={toggleSelectedFlipY}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                  selectedPlacedItem.flipY
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'
                }`}
                title="상하 반전"
              >
                <FlipVertical2 size={12} />
              </button>
              <div className="flex items-center gap-0.5 rounded bg-surface-hover px-1 py-0.5">
                <button
                  onClick={() => adjustSelectedScale(-0.1)}
                  disabled={selectedPlacedItem.scale <= 0.5}
                  className="px-1 text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-6 text-center text-[10px] text-text-secondary">
                  {selectedPlacedItem.scale.toFixed(1)}
                </span>
                <button
                  onClick={() => adjustSelectedScale(0.1)}
                  disabled={selectedPlacedItem.scale >= 2.0}
                  className="px-1 text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-30"
                >
                  +
                </button>
              </div>
              <div className="flex items-center gap-0.5 rounded bg-surface-hover px-1 py-0.5">
                <button
                  onClick={() => { pushUndoSnapshot(); sendBackward(selectedPlacedItem.id) }}
                  disabled={
                    freePlacedItems.length < 2 ||
                    selectedPlacedItem.zOrder <=
                      Math.min(...freePlacedItems.map((i) => i.zOrder))
                  }
                  className="p-0.5 text-text-secondary hover:text-text-primary disabled:opacity-30"
                  title="뒤로 밀기"
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  onClick={() => { pushUndoSnapshot(); bringForward(selectedPlacedItem.id) }}
                  disabled={
                    freePlacedItems.length < 2 ||
                    selectedPlacedItem.zOrder >=
                      Math.max(...freePlacedItems.map((i) => i.zOrder))
                  }
                  className="p-0.5 text-text-secondary hover:text-text-primary disabled:opacity-30"
                  title="앞으로 당기기"
                >
                  <ChevronUp size={12} />
                </button>
              </div>
              <button
                onClick={deleteSelectedItem}
                className="p-1 text-red-400 rounded transition-colors hover:bg-red-500/20"
                title="삭제"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setSelectedPlacedItemId(null)}
                className="p-1 rounded transition-colors text-text-muted hover:bg-surface-hover hover:text-text-primary"
                title="선택 해제"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 타일 설치 모드 표시 바 */}
      {editMode === 'add' && !selectedPlacedItem && (
        <div className="p-2 mb-3 rounded-lg border border-green-500/20 bg-green-500/10">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Pencil size={14} className="text-green-400" />
              {selectedBuilding && (
                <BuildingImage building={selectedBuilding} className="w-6 h-6" />
              )}
              <span className="text-sm text-green-400">{selectedBuilding?.name} 설치 모드</span>
              {selectedBuilding && (
                <span className="text-xs text-green-300">
                  (남은 수량: {getRemainingQuantity(selectedBuilding.id)})
                </span>
              )}
            </div>
            <button
              onClick={cancelMode}
              className="p-1 rounded transition-colors text-text-muted hover:bg-surface-hover hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 모드 버튼들 */}
      {editMode === 'none' && !selectedPlacedItem && (
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
            onClick={handleReset}
            className="flex gap-2 justify-center items-center p-2 px-4 text-red-400 rounded-lg transition-colors bg-red-500/10 hover:bg-red-500/20"
          >
            <RotateCcw size={16} />
            <span className="text-sm font-medium">초기화</span>
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
                    <BuildingImage building={building} className="w-8 h-8" />
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
              const totalRemaining = getBuildingsByLayer(tab.id).reduce(
                (sum, b) => sum + Math.max(0, getRemainingQuantity(b.id)),
                0
              )
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
                          ? 'border-2 border-green-500/50 bg-green-500/20 ring-2 ring-green-500/30'
                          : remaining > 0
                            ? 'border border-transparent bg-surface-hover hover:border-cool/30 hover:bg-cool/20'
                            : 'cursor-not-allowed bg-surface/30 opacity-40'
                      } `}
                      title={building.description}
                    >
                      <BuildingImage building={building} className="w-8 h-8" />
                      <span className="w-full truncate text-center text-[10px] text-text-secondary">
                        {building.name}
                      </span>
                      <span
                        className={`text-[10px] ${remaining > 0 ? 'text-cool' : 'text-text-muted'}`}
                      >
                        {remaining}/{owned}
                      </span>
                      {isSelected && <span className="text-[10px] text-green-400">선택됨</span>}
                    </button>
                  )
                })}
            </div>

            {getBuildingsByLayer(activeLayer).filter((b) => getOwnedQuantity(b.id) > 0).length ===
              0 && (
              <p className="py-4 text-xs text-center text-text-muted">
                이 카테고리에 보유한 아이템이 없어요
              </p>
            )}
          </div>

          <p className="mt-2 text-center text-[10px] text-text-muted">
            {activeLayer === 'tile'
              ? '🏗️ 아이템을 선택하고 그리드를 클릭/드래그해서 설치하세요'
              : '🏗️ 아이템을 선택하면 맵 중앙에 즉시 배치됩니다'}
          </p>
        </div>
      )}

      {/* 구매 확인 팝업 */}
      {purchaseTarget && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black/50">
          <div className="p-4 mx-4 w-full max-w-xs bg-white rounded-xl shadow-xl">
            <div className="flex flex-col gap-3 items-center">
              <BuildingImage
                building={purchaseTarget}
                animated={!!purchaseTarget.spriteFrames}
                className="w-16 h-16"
              />
              <h3 className="text-sm font-semibold text-gray-800">{purchaseTarget.name}</h3>
              <p className="text-xs text-gray-500">{purchaseTarget.description}</p>

              <div className="p-2 w-full bg-gray-50 rounded-lg">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">가격</span>
                  <span className="font-medium text-yellow-600">{purchaseTarget.cost} 💰</span>
                </div>
                <div className="flex justify-between mt-1 text-xs">
                  <span className="text-gray-500">지급 수량</span>
                  <span className="font-medium text-gray-700">
                    ×{getDefaultQuantity(purchaseTarget.layer)}
                  </span>
                </div>
                {getOwnedQuantity(purchaseTarget.id) > 0 && (
                  <div className="flex justify-between mt-1 text-xs">
                    <span className="text-gray-500">현재 보유</span>
                    <span className="font-medium text-green-600">
                      {getOwnedQuantity(purchaseTarget.id)}개
                    </span>
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
