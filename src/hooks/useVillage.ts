import { useState, useEffect, useCallback } from 'react'
import { ALL_BUILDINGS, getAssetsByLayer, BuildingConfig } from '@/config/villageAssets'

// 레이어 타입
export type LayerType = 'tile' | 'structure' | 'environment' | 'unit'

// Building 타입을 config에서 재export
export type Building = BuildingConfig

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

// config 파일의 전체 빌딩 목록 사용
export const BUILDINGS = ALL_BUILDINGS

// 레이어별 아이템 필터 (config 파일의 함수 사용)
export const getBuildingsByLayer = (layer: LayerType): Building[] =>
  getAssetsByLayer(layer)

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

  // 아이템 배치 (레이어 시스템) - 같은 카테고리는 대체 가능
  const placeBuilding = useCallback((buildingId: string, position: number): boolean => {
    const building = BUILDINGS.find((b) => b.id === buildingId)
    if (!building) return false

    // 구매했는지 확인
    if (!state.unlockedBuildings.includes(buildingId)) return false

    // 같은 레이어에 이미 동일한 아이템이 있는지 확인 (중복 설치 방지)
    const existingItem = state.placedItems.find(
      (item) => item.position === position && item.layer === building.layer
    )

    // 동일한 아이템이 이미 설치되어 있으면 무시
    if (existingItem && existingItem.buildingId === buildingId) return false

    setState((prev) => ({
      ...prev,
      // 같은 레이어의 기존 아이템을 제거하고 새 아이템 추가 (대체)
      placedItems: [
        ...prev.placedItems.filter(
          (item) => !(item.position === position && item.layer === building.layer)
        ),
        { buildingId, position, layer: building.layer }
      ],
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

  // 모든 배치된 아이템 삭제 (특정 레이어만 또는 전체)
  const clearAllItems = useCallback((layer?: LayerType) => {
    setState((prev) => ({
      ...prev,
      placedItems: layer
        ? prev.placedItems.filter((item) => item.layer !== layer)
        : [],
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
    clearAllItems,
    getItemsAt,
    hasPurchased,
  }
}
