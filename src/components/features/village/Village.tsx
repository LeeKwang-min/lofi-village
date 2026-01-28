import { useState } from 'react'
import { Coins, Store, Plus, Pencil, Trash2, X, Package } from 'lucide-react'
import { useVillageContext } from '@/contexts/VillageContext'
import { BUILDINGS, Building, LayerType, getBuildingsByLayer } from '@/hooks/useVillage'

const GRID_COLS = 5
const GRID_ROWS = 4

type EditMode = 'none' | 'add' | 'remove'
type PanelMode = 'none' | 'shop' | 'inventory'

const LAYER_TABS: { id: LayerType; name: string; icon: string }[] = [
  { id: 'tile', name: '바닥', icon: '🟩' },
  { id: 'environment', name: '자연', icon: '🌳' },
  { id: 'structure', name: '건물', icon: '🏠' },
  { id: 'unit', name: '유닛', icon: '👤' },
]

export function Village() {
  const {
    coins,
    level,
    purchaseBuilding,
    placeBuilding,
    removeItem,
    getItemsAt,
    hasPurchased,
    addCoins,
  } = useVillageContext()

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [panelMode, setPanelMode] = useState<PanelMode>('none')
  const [activeLayer, setActiveLayer] = useState<LayerType>('tile')
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [removeLayer, setRemoveLayer] = useState<LayerType>('tile')

  // 그리드 셀 클릭 핸들러
  const handleCellClick = (position: number) => {
    if (editMode === 'add' && selectedBuilding) {
      // 설치 모드: 계속 배치 가능
      placeBuilding(selectedBuilding.id, position)
    } else if (editMode === 'remove') {
      // 삭제 모드: 선택한 레이어의 아이템 삭제
      removeItem(position, removeLayer)
    }
  }

  // 건물 구매 핸들러 (상점에서 구매만)
  const handlePurchase = (building: Building) => {
    purchaseBuilding(building)
    // 구매 후에도 상점 유지
  }

  // 인벤토리에서 아이템 선택 (설치 모드 진입)
  const handleSelectFromInventory = (building: Building) => {
    setSelectedBuilding(building)
    setEditMode('add')
    // 인벤토리는 열린 상태 유지!
  }

  // 모드 취소
  const cancelMode = () => {
    setEditMode('none')
    setSelectedBuilding(null)
  }

  // 삭제 모드 시작
  const startRemoveMode = () => {
    setEditMode('remove')
    setSelectedBuilding(null)
    setPanelMode('none')
  }

  return (
    <section className="p-4 rounded-xl bg-surface/50 border border-surface-hover/50">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏘️</span>
          <h2 className="text-sm font-semibold text-text-primary">나의 마을</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-warm">Lv. {level}</span>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20">
            <Coins size={12} className="text-yellow-500" />
            <span className="text-xs font-medium text-yellow-500">{coins}</span>
            <button
              onClick={() => addCoins(50)}
              className="ml-1 p-0.5 rounded-full hover:bg-yellow-500/30 transition-colors"
              title="테스트: +50 코인"
            >
              <Plus size={10} className="text-yellow-500" />
            </button>
          </div>
        </div>
      </div>

      {/* 마을 그리드 - 레이어 시스템 (여백 제거, overflow 허용) */}
      <div
        className="grid p-2 rounded-lg bg-background/50 border border-surface-hover mb-3 relative"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gap: 0,
        }}
      >
        {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, index) => {
          const items = getItemsAt(index)
          const row = Math.floor(index / GRID_COLS)
          const col = index % GRID_COLS

          return (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              className={`
                aspect-square relative
                transition-all duration-150
                ${editMode === 'add' ? 'hover:brightness-125 cursor-copy' : ''}
                ${editMode === 'remove' ? 'hover:brightness-75 cursor-pointer' : ''}
                ${editMode === 'none' ? 'cursor-default' : ''}
              `}
              style={{
                backgroundColor: '#c8d5b9', // 밝은 초록빛 잔디색
                zIndex: row, // 아래 행이 위에 오도록
              }}
            >
              {/* 레이어 순서대로 렌더링 (overflow 허용) */}
              {items.tile && (
                <img
                  src={items.tile.imagePath}
                  alt={items.tile.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ zIndex: 0 }}
                />
              )}
              {items.environment && (
                <img
                  src={items.environment.imagePath}
                  alt={items.environment.name}
                  className="absolute w-full object-contain pointer-events-none"
                  style={{
                    zIndex: 1,
                    bottom: 0,
                    left: 0,
                    height: 'auto',
                    maxHeight: '200%',
                    transform: 'translateY(-25%)',
                  }}
                />
              )}
              {items.structure && (
                <img
                  src={items.structure.imagePath}
                  alt={items.structure.name}
                  className="absolute w-full object-contain pointer-events-none"
                  style={{
                    zIndex: 2,
                    bottom: 0,
                    left: 0,
                    height: 'auto',
                    maxHeight: '250%',
                    transform: 'translateY(-35%)',
                  }}
                />
              )}
              {items.unit && (
                <img
                  src={items.unit.imagePath}
                  alt={items.unit.name}
                  className="absolute w-full object-contain pointer-events-none"
                  style={{
                    zIndex: 3,
                    bottom: 0,
                    left: 0,
                    height: 'auto',
                    maxHeight: '150%',
                    transform: 'translateY(-15%)',
                  }}
                />
              )}

              {/* 삭제 모드 시 해당 레이어 아이템 표시 */}
              {editMode === 'remove' && items[removeLayer] && (
                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center z-10">
                  <Trash2 size={12} className="text-red-400" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 모드 표시 바 */}
      {editMode !== 'none' && (
        <div className={`p-2 rounded-lg mb-3 ${
          editMode === 'add' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {editMode === 'add' ? (
                <>
                  <Pencil size={14} className="text-green-400" />
                  <img src={selectedBuilding?.imagePath} alt="" className="w-6 h-6 object-contain" />
                  <span className="text-sm text-green-400">{selectedBuilding?.name} 설치 모드</span>
                </>
              ) : (
                <>
                  <Trash2 size={14} className="text-red-400" />
                  <span className="text-sm text-red-400">삭제 모드</span>
                </>
              )}
            </div>
            <button
              onClick={cancelMode}
              className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          {/* 삭제 모드: 레이어 토글 버튼 */}
          {editMode === 'remove' && (
            <div className="flex gap-1 mt-2">
              {LAYER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRemoveLayer(tab.id)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                    removeLayer === tab.id
                      ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                      : 'bg-surface/50 text-text-muted hover:text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 모드 버튼들 */}
      {editMode === 'none' && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setPanelMode(panelMode === 'shop' ? 'none' : 'shop')}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-colors ${
              panelMode === 'shop'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-cool/10 text-cool hover:bg-cool/20'
            }`}
          >
            <Store size={16} />
            <span className="text-sm font-medium">상점</span>
          </button>
          <button
            onClick={() => setPanelMode(panelMode === 'inventory' ? 'none' : 'inventory')}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-colors ${
              panelMode === 'inventory'
                ? 'bg-cool/20 text-cool border border-cool/30'
                : 'bg-surface-hover/50 text-text-secondary hover:bg-surface-hover'
            }`}
          >
            <Package size={16} />
            <span className="text-sm font-medium">인벤토리</span>
          </button>
          <button
            onClick={startRemoveMode}
            className="flex items-center justify-center gap-2 p-2 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
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
            onClick={() => setPanelMode(panelMode === 'inventory' ? 'none' : 'inventory')}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-colors ${
              panelMode === 'inventory'
                ? 'bg-cool/20 text-cool border border-cool/30'
                : 'bg-surface-hover/50 text-text-secondary hover:bg-surface-hover'
            }`}
          >
            <Package size={16} />
            <span className="text-sm font-medium">인벤토리 {panelMode === 'inventory' ? '닫기' : '열기'}</span>
          </button>
        </div>
      )}

      {/* 상점 패널 - 구매 전용 */}
      {panelMode === 'shop' && editMode === 'none' && (
        <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Store size={14} className="text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">상점</span>
            <span className="text-xs text-text-muted ml-auto">아이템을 구매하세요</span>
          </div>

          {/* 레이어 탭 */}
          <div className="flex gap-1 mb-3">
            {LAYER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLayer(tab.id)}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                  activeLayer === tab.id
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-surface/50 text-text-muted hover:text-text-secondary'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>

          {/* 구매 가능한 아이템 목록 */}
          <div className="grid grid-cols-4 gap-2">
            {getBuildingsByLayer(activeLayer).map((building) => {
              const owned = hasPurchased(building.id)
              const canAfford = coins >= building.cost

              return (
                <button
                  key={building.id}
                  onClick={() => !owned && handlePurchase(building)}
                  disabled={owned || !canAfford}
                  className={`
                    p-2 rounded-lg flex flex-col items-center gap-1 transition-colors
                    ${owned
                      ? 'bg-surface/30 opacity-50 cursor-not-allowed'
                      : canAfford
                        ? 'bg-surface-hover hover:bg-yellow-500/20 hover:border-yellow-500/30 border border-transparent'
                        : 'bg-surface/30 opacity-50 cursor-not-allowed'
                    }
                  `}
                  title={building.description}
                >
                  <img
                    src={building.imagePath}
                    alt={building.name}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-[10px] text-text-secondary truncate w-full text-center">
                    {building.name}
                  </span>
                  <span className={`text-[10px] ${owned ? 'text-green-400' : 'text-yellow-400'}`}>
                    {owned ? '✓ 보유중' : `${building.cost}💰`}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-2 text-[10px] text-text-muted text-center">
            💰 구매한 아이템은 인벤토리에서 설치할 수 있어요
          </p>
        </div>
      )}

      {/* 인벤토리 패널 - 설치 전용 */}
      {panelMode === 'inventory' && (
        <div className="p-3 rounded-lg bg-cool/5 border border-cool/20">
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} className="text-cool" />
            <span className="text-sm font-medium text-cool">인벤토리</span>
            <span className="text-xs text-text-muted ml-auto">클릭하여 설치</span>
          </div>

          {/* 레이어 탭 */}
          <div className="flex gap-1 mb-3">
            {LAYER_TABS.map((tab) => {
              const ownedCount = getBuildingsByLayer(tab.id).filter(b => hasPurchased(b.id)).length
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveLayer(tab.id)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                    activeLayer === tab.id
                      ? 'bg-cool/20 text-cool'
                      : 'bg-surface/50 text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.name}
                  {ownedCount > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">({ownedCount})</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 보유 아이템 목록 */}
          <div className="grid grid-cols-4 gap-2">
            {getBuildingsByLayer(activeLayer)
              .filter(building => hasPurchased(building.id))
              .map((building) => {
                const isSelected = selectedBuilding?.id === building.id && editMode === 'add'

                return (
                  <button
                    key={building.id}
                    onClick={() => handleSelectFromInventory(building)}
                    className={`
                      p-2 rounded-lg flex flex-col items-center gap-1 transition-colors
                      ${isSelected
                        ? 'bg-green-500/20 border-2 border-green-500/50 ring-2 ring-green-500/30'
                        : 'bg-surface-hover hover:bg-cool/20 border border-transparent hover:border-cool/30'
                      }
                    `}
                    title={building.description}
                  >
                    <img
                      src={building.imagePath}
                      alt={building.name}
                      className="w-8 h-8 object-contain"
                    />
                    <span className="text-[10px] text-text-secondary truncate w-full text-center">
                      {building.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] text-green-400">선택됨</span>
                    )}
                  </button>
                )
              })}
          </div>

          {getBuildingsByLayer(activeLayer).filter(b => hasPurchased(b.id)).length === 0 && (
            <p className="py-4 text-xs text-text-muted text-center">
              이 카테고리에 보유한 아이템이 없어요
            </p>
          )}

          <p className="mt-2 text-[10px] text-text-muted text-center">
            🏗️ 아이템을 선택하고 그리드를 클릭해서 설치하세요
          </p>
        </div>
      )}
    </section>
  )
}
