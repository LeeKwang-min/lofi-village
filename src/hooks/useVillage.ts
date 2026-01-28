import { useState, useEffect, useCallback } from 'react'

// 레이어 타입
export type LayerType = 'tile' | 'structure' | 'environment' | 'unit'

// 건물/아이템 타입 정의
export interface Building {
  id: string
  name: string
  layer: LayerType
  imagePath: string
  cost: number
  description: string
}

// 배치된 아이템 정보
export interface PlacedItem {
  buildingId: string
  position: number // 그리드 인덱스 (0-19)
  layer: LayerType
}

// 마을 상태
export interface VillageState {
  coins: number
  totalFocusMinutes: number
  placedItems: PlacedItem[] // 레이어별 배치 정보
  unlockedBuildings: string[] // 구매한 아이템 ID 목록
}

// 구매 가능한 아이템 목록
export const BUILDINGS: Building[] = [
  // === Tiles (바닥) ===
  { id: 'tile_grass', name: '잔디', layer: 'tile', imagePath: '/map/Tile/medievalTile_01.png', cost: 5, description: '기본 잔디 타일' },
  { id: 'tile_dirt', name: '흙길', layer: 'tile', imagePath: '/map/Tile/medievalTile_05.png', cost: 5, description: '흙 타일' },
  { id: 'tile_stone', name: '돌길', layer: 'tile', imagePath: '/map/Tile/medievalTile_13.png', cost: 10, description: '돌 타일' },
  { id: 'tile_water', name: '물', layer: 'tile', imagePath: '/map/Tile/medievalTile_17.png', cost: 15, description: '물 타일' },
  { id: 'tile_sand', name: '모래', layer: 'tile', imagePath: '/map/Tile/medievalTile_25.png', cost: 8, description: '모래 타일' },

  // === Environment (자연) ===
  { id: 'env_tree1', name: '나무', layer: 'environment', imagePath: '/map/Environment/medievalEnvironment_01.png', cost: 20, description: '작은 나무' },
  { id: 'env_tree2', name: '큰 나무', layer: 'environment', imagePath: '/map/Environment/medievalEnvironment_02.png', cost: 30, description: '큰 나무' },
  { id: 'env_rock1', name: '바위', layer: 'environment', imagePath: '/map/Environment/medievalEnvironment_05.png', cost: 15, description: '작은 바위' },
  { id: 'env_bush', name: '덤불', layer: 'environment', imagePath: '/map/Environment/medievalEnvironment_09.png', cost: 10, description: '덤불' },
  { id: 'env_flower', name: '꽃', layer: 'environment', imagePath: '/map/Environment/medievalEnvironment_13.png', cost: 12, description: '예쁜 꽃' },

  // === Structures (건물) ===
  { id: 'struct_house1', name: '작은 집', layer: 'structure', imagePath: '/map/Structure/medievalStructure_01.png', cost: 50, description: '아담한 집' },
  { id: 'struct_house2', name: '큰 집', layer: 'structure', imagePath: '/map/Structure/medievalStructure_02.png', cost: 80, description: '큰 집' },
  { id: 'struct_tower', name: '탑', layer: 'structure', imagePath: '/map/Structure/medievalStructure_05.png', cost: 100, description: '감시탑' },
  { id: 'struct_shop', name: '상점', layer: 'structure', imagePath: '/map/Structure/medievalStructure_08.png', cost: 120, description: '마을 상점' },
  { id: 'struct_castle', name: '성', layer: 'structure', imagePath: '/map/Structure/medievalStructure_12.png', cost: 200, description: '작은 성' },
  { id: 'struct_church', name: '교회', layer: 'structure', imagePath: '/map/Structure/medievalStructure_15.png', cost: 150, description: '교회' },

  // === Units (유닛) ===
  { id: 'unit_villager1', name: '주민', layer: 'unit', imagePath: '/map/Unit/medievalUnit_01.png', cost: 30, description: '마을 주민' },
  { id: 'unit_villager2', name: '농부', layer: 'unit', imagePath: '/map/Unit/medievalUnit_02.png', cost: 30, description: '농부' },
  { id: 'unit_knight', name: '기사', layer: 'unit', imagePath: '/map/Unit/medievalUnit_05.png', cost: 60, description: '용감한 기사' },
  { id: 'unit_archer', name: '궁수', layer: 'unit', imagePath: '/map/Unit/medievalUnit_08.png', cost: 50, description: '궁수' },
  { id: 'unit_king', name: '왕', layer: 'unit', imagePath: '/map/Unit/medievalUnit_12.png', cost: 150, description: '마을의 왕' },
]

// 레이어별 아이템 필터
export const getBuildingsByLayer = (layer: LayerType): Building[] =>
  BUILDINGS.filter((b) => b.layer === layer)

const STORAGE_KEY = 'lofi-village-data'

// 초기 상태
const initialState: VillageState = {
  coins: 50,
  totalFocusMinutes: 0,
  placedItems: [],
  unlockedBuildings: [],
}

// localStorage에서 상태 불러오기
function loadVillageState(): VillageState {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return { ...initialState, ...JSON.parse(stored) }
  }
  return initialState
}

// localStorage에 상태 저장
function saveVillageState(state: VillageState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function useVillage() {
  const [state, setState] = useState<VillageState>(loadVillageState)

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    saveVillageState(state)
  }, [state])

  // 코인 추가
  const addCoins = useCallback((amount: number) => {
    setState((prev) => ({
      ...prev,
      coins: prev.coins + amount,
    }))
  }, [])

  // 집중 시간 기록
  const addFocusTime = useCallback((minutes: number) => {
    setState((prev) => ({
      ...prev,
      totalFocusMinutes: prev.totalFocusMinutes + minutes,
    }))
  }, [])

  // 건물 구매
  const purchaseBuilding = useCallback((building: Building): boolean => {
    if (building.cost > state.coins) {
      return false
    }

    setState((prev) => ({
      ...prev,
      coins: prev.coins - building.cost,
      unlockedBuildings: [...prev.unlockedBuildings, building.id],
    }))

    return true
  }, [state.coins])

  // 아이템 배치 (레이어 시스템)
  const placeBuilding = useCallback((buildingId: string, position: number): boolean => {
    const building = BUILDINGS.find((b) => b.id === buildingId)
    if (!building) return false

    // 같은 레이어에 이미 아이템이 있는지 확인
    const isOccupied = state.placedItems.some(
      (item) => item.position === position && item.layer === building.layer
    )
    if (isOccupied) return false

    // 구매했는지 확인
    if (!state.unlockedBuildings.includes(buildingId)) return false

    setState((prev) => ({
      ...prev,
      placedItems: [...prev.placedItems, { buildingId, position, layer: building.layer }],
    }))

    return true
  }, [state.placedItems, state.unlockedBuildings])

  // 아이템 제거 (특정 레이어만)
  const removeItem = useCallback((position: number, layer: LayerType) => {
    setState((prev) => ({
      ...prev,
      placedItems: prev.placedItems.filter(
        (item) => !(item.position === position && item.layer === layer)
      ),
    }))
  }, [])

  // 특정 위치의 모든 레이어 아이템 가져오기
  const getItemsAt = useCallback(
    (position: number): { tile?: Building; environment?: Building; structure?: Building; unit?: Building } => {
      const items: { tile?: Building; environment?: Building; structure?: Building; unit?: Building } = {}

      state.placedItems
        .filter((item) => item.position === position)
        .forEach((item) => {
          const building = BUILDINGS.find((b) => b.id === item.buildingId)
          if (building) {
            items[building.layer] = building
          }
        })

      return items
    },
    [state.placedItems]
  )

  // 건물을 구매했는지 확인
  const hasPurchased = useCallback(
    (buildingId: string): boolean => {
      return state.unlockedBuildings.includes(buildingId)
    },
    [state.unlockedBuildings]
  )

  // 레벨 계산
  const level = Math.floor(state.totalFocusMinutes / 60) + 1

  return {
    coins: state.coins,
    totalFocusMinutes: state.totalFocusMinutes,
    placedItems: state.placedItems,
    unlockedBuildings: state.unlockedBuildings,
    level,
    addCoins,
    addFocusTime,
    purchaseBuilding,
    placeBuilding,
    removeItem,
    getItemsAt,
    hasPurchased,
  }
}
