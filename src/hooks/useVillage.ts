import { useState, useEffect, useCallback } from 'react'
import { nanoid } from 'nanoid'
import { ALL_BUILDINGS, getAssetsByLayer, BuildingConfig, getDefaultQuantity } from '@/config/villageAssets'

// 레이어 타입
export type LayerType = 'tile' | 'structure' | 'environment' | 'unit'

// Building 타입을 config에서 재export
export type Building = BuildingConfig

// 배치된 아이템 정보
export interface PlacedItem {
  id: string          // 고유 배치 ID
  buildingId: string
  layer: LayerType
  // 타일: 그리드 포지션
  position?: number   // 0-24 (타일 전용)
  // 자유 배치: 퍼센트 좌표
  x?: number          // 0-100 (자연/건물/유닛)
  y?: number          // 0-100
  flipX: boolean      // 좌우 반전
  flipY: boolean      // 상하 반전
  scale: number       // 크기 배율 (0.5 ~ 2.0)
  zOrder: number      // 배치 순서 (높을수록 앞에 표시)
}

// 마을 상태
export interface VillageState {
  coins: number
  totalFocusMinutes: number
  placedItems: PlacedItem[]
  inventory: Record<string, number>  // buildingId → 보유 수량
}

// config 파일의 전체 빌딩 목록 사용
export const BUILDINGS = ALL_BUILDINGS

// 레이어별 아이템 필터
export const getBuildingsByLayer = (layer: LayerType): Building[] =>
  getAssetsByLayer(layer)

const STORAGE_KEY = 'lofi-village-data'

// 초기 상태
const initialState: VillageState = {
  coins: 50,
  totalFocusMinutes: 0,
  placedItems: [],
  inventory: {},
}

// 기존 데이터 마이그레이션
interface LegacyState {
  coins?: number
  totalFocusMinutes?: number
  placedItems?: Array<{
    buildingId: string
    position: number
    layer: LayerType
    id?: string
    rotation?: number
    flipX?: boolean
    flipY?: boolean
    scale?: number
    x?: number
    y?: number
  }>
  unlockedBuildings?: string[]
  inventory?: Record<string, number>
}

function migrateState(raw: LegacyState): VillageState {
  const state: VillageState = {
    coins: raw.coins ?? initialState.coins,
    totalFocusMinutes: raw.totalFocusMinutes ?? initialState.totalFocusMinutes,
    placedItems: [],
    inventory: {},
  }

  // inventory 마이그레이션: 구 unlockedBuildings → 신 inventory
  if (raw.inventory) {
    state.inventory = raw.inventory
  } else if (raw.unlockedBuildings) {
    for (const buildingId of raw.unlockedBuildings) {
      const building = ALL_BUILDINGS.find(b => b.id === buildingId)
      if (building) {
        const qty = getDefaultQuantity(building.layer)
        state.inventory[buildingId] = (state.inventory[buildingId] || 0) + qty
      }
    }
  }

  // placedItems 마이그레이션: id, flipX/flipY, zOrder 필드 보장
  if (raw.placedItems) {
    let nextZOrder = 0
    state.placedItems = raw.placedItems.map(item => ({
      id: item.id || nanoid(),
      buildingId: item.buildingId,
      layer: item.layer,
      position: item.position,
      x: item.x,
      y: item.y,
      flipX: item.flipX ?? false,
      flipY: item.flipY ?? false,
      scale: item.scale ?? 1,
      zOrder: (item as { zOrder?: number }).zOrder ?? nextZOrder++,
    }))
  }

  return state
}

// localStorage에서 상태 불러오기
function loadVillageState(): VillageState {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return migrateState(JSON.parse(stored))
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

  // 보유 수량 조회
  const getOwnedQuantity = useCallback((buildingId: string): number => {
    return state.inventory[buildingId] || 0
  }, [state.inventory])

  // 남은 수량 조회 (보유 - 배치된 수)
  const getRemainingQuantity = useCallback((buildingId: string): number => {
    const owned = state.inventory[buildingId] || 0
    const placed = state.placedItems.filter(item => item.buildingId === buildingId).length
    return owned - placed
  }, [state.inventory, state.placedItems])

  // 건물 구매 (수량 기반)
  const purchaseBuilding = useCallback((building: Building): boolean => {
    if (building.cost > state.coins) {
      return false
    }

    const qty = getDefaultQuantity(building.layer)

    setState((prev) => ({
      ...prev,
      coins: prev.coins - building.cost,
      inventory: {
        ...prev.inventory,
        [building.id]: (prev.inventory[building.id] || 0) + qty,
      },
    }))

    return true
  }, [state.coins])

  // 아이템 배치 — 타일: 그리드 방식 / 비타일: x,y 좌표
  // 반환값: 배치된 아이템 ID (성공) 또는 null (실패)
  const placeBuilding = useCallback((
    buildingId: string,
    options: { position?: number; x?: number; y?: number; flipX?: boolean; flipY?: boolean; scale?: number }
  ): string | null => {
    const building = BUILDINGS.find((b) => b.id === buildingId)
    if (!building) return null

    // 남은 수량 체크
    const owned = state.inventory[buildingId] || 0
    const placed = state.placedItems.filter(item => item.buildingId === buildingId).length
    if (owned - placed <= 0) return null

    const newId = nanoid()

    if (building.layer === 'tile') {
      const position = options.position
      if (position === undefined) return null

      // 같은 레이어+위치에 동일 아이템이 있으면 무시
      const existing = state.placedItems.find(
        item => item.position === position && item.layer === 'tile'
      )
      if (existing && existing.buildingId === buildingId) return null

      setState((prev) => ({
        ...prev,
        placedItems: [
          ...prev.placedItems.filter(
            item => !(item.position === position && item.layer === 'tile')
          ),
          {
            id: newId,
            buildingId,
            layer: 'tile',
            position,
            flipX: options.flipX ?? false,
            flipY: options.flipY ?? false,
            scale: options.scale ?? 1,
            zOrder: 0,
          },
        ],
      }))
    } else {
      // 자유 배치
      if (options.x === undefined || options.y === undefined) return null

      setState((prev) => {
        const maxZOrder = Math.max(0, ...prev.placedItems.map(i => i.zOrder))
        return {
          ...prev,
          placedItems: [
            ...prev.placedItems,
            {
              id: newId,
              buildingId,
              layer: building.layer,
              x: options.x!,
              y: options.y!,
              flipX: options.flipX ?? false,
              flipY: options.flipY ?? false,
              scale: options.scale ?? 1,
              zOrder: maxZOrder + 1,
            },
          ],
        }
      })
    }

    return newId
  }, [state.placedItems, state.inventory])

  // 아이템 제거 (ID 기반)
  const removeItem = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      placedItems: prev.placedItems.filter(item => item.id !== itemId),
    }))
  }, [])

  // 배치된 아이템 부분 업데이트
  const updateItem = useCallback((
    itemId: string,
    updates: Partial<Pick<PlacedItem, 'x' | 'y' | 'flipX' | 'flipY' | 'scale'>>
  ) => {
    setState(prev => ({
      ...prev,
      placedItems: prev.placedItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }))
  }, [])

  // zOrder 순서 변경: 앞으로 당기기 (zOrder 높이기)
  const bringForward = useCallback((itemId: string) => {
    setState(prev => {
      const target = prev.placedItems.find(i => i.id === itemId)
      if (!target || target.layer === 'tile') return prev

      // 현재 아이템보다 zOrder가 큰 것 중 가장 작은 것 찾기
      const nextAbove = prev.placedItems
        .filter(i => i.layer !== 'tile' && i.zOrder > target.zOrder)
        .sort((a, b) => a.zOrder - b.zOrder)[0]

      if (!nextAbove) return prev // 이미 최상위

      return {
        ...prev,
        placedItems: prev.placedItems.map(item => {
          if (item.id === target.id) return { ...item, zOrder: nextAbove.zOrder }
          if (item.id === nextAbove.id) return { ...item, zOrder: target.zOrder }
          return item
        }),
      }
    })
  }, [])

  // zOrder 순서 변경: 뒤로 밀기 (zOrder 낮추기)
  const sendBackward = useCallback((itemId: string) => {
    setState(prev => {
      const target = prev.placedItems.find(i => i.id === itemId)
      if (!target || target.layer === 'tile') return prev

      // 현재 아이템보다 zOrder가 작은 것 중 가장 큰 것 찾기
      const nextBelow = prev.placedItems
        .filter(i => i.layer !== 'tile' && i.zOrder < target.zOrder)
        .sort((a, b) => b.zOrder - a.zOrder)[0]

      if (!nextBelow) return prev // 이미 최하위

      return {
        ...prev,
        placedItems: prev.placedItems.map(item => {
          if (item.id === target.id) return { ...item, zOrder: nextBelow.zOrder }
          if (item.id === nextBelow.id) return { ...item, zOrder: target.zOrder }
          return item
        }),
      }
    })
  }, [])

  // 타일 제거 (위치 기반 — 해당 그리드 셀의 타일 삭제)
  const removeTileAt = useCallback((position: number) => {
    setState((prev) => ({
      ...prev,
      placedItems: prev.placedItems.filter(
        item => !(item.position === position && item.layer === 'tile')
      ),
    }))
  }, [])

  // 모든 배치된 아이템 삭제
  const clearAllItems = useCallback((layer?: LayerType) => {
    setState((prev) => ({
      ...prev,
      placedItems: layer
        ? prev.placedItems.filter((item) => item.layer !== layer)
        : [],
    }))
  }, [])

  // 특정 위치의 타일 레이어 아이템 가져오기
  const getItemsAt = useCallback(
    (position: number): { tile?: Building; environment?: Building; structure?: Building; unit?: Building } => {
      const items: { tile?: Building; environment?: Building; structure?: Building; unit?: Building } = {}

      state.placedItems
        .filter((item) => item.position === position && item.layer === 'tile')
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

  // 자유 배치된 아이템 목록 (zOrder 오름차순 → 나중에 설치된 아이템이 위에 렌더링)
  const getFreePlacedItems = useCallback((): (PlacedItem & { building: Building })[] => {
    return state.placedItems
      .filter(item => item.layer !== 'tile' && item.x !== undefined && item.y !== undefined)
      .map(item => {
        const building = BUILDINGS.find(b => b.id === item.buildingId)!
        return { ...item, building }
      })
      .filter(item => item.building)
      .sort((a, b) => a.zOrder - b.zOrder)
  }, [state.placedItems])

  // 레벨 계산
  const level = Math.floor(state.totalFocusMinutes / 60) + 1

  return {
    coins: state.coins,
    totalFocusMinutes: state.totalFocusMinutes,
    placedItems: state.placedItems,
    inventory: state.inventory,
    level,
    addCoins,
    addFocusTime,
    purchaseBuilding,
    placeBuilding,
    removeItem,
    updateItem,
    bringForward,
    sendBackward,
    removeTileAt,
    clearAllItems,
    getItemsAt,
    getOwnedQuantity,
    getRemainingQuantity,
    getFreePlacedItems,
  }
}
