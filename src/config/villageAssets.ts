/**
 * 마을 에셋 설정 파일
 * 모든 건물, 타일, 환경, 유닛 데이터를 관리합니다.
 */

import { LayerType } from '@/hooks/useVillage'

export interface BuildingConfig {
  id: string
  name: string
  layer: LayerType
  imagePath: string
  cost: number
  description: string
  spriteFrames?: number
}

// ==================== TILES (바닥) ====================
// 가격: 5~20 코인
export const TILE_ASSETS: BuildingConfig[] = [
  { id: 'custom_tile_01', name: '바닥', layer: 'tile', imagePath: './map/Tile/grass.png', cost: 0, description: '바닥 타일' },
  { id: 'custom_tile_02', name: '물', layer: 'tile', imagePath: './map/Tile/BlueWater.png', cost: 0, description: '바닥 타일', spriteFrames: 2 },
  { id: 'custom_tile_03', name: '물 - 핑크', layer: 'tile', imagePath: './map/Tile/PinkWater.png', cost: 0, description: '바닥 타일', spriteFrames: 2 },
  { id: 'custom_tile_04', name: '물 - 에메랄드', layer: 'tile', imagePath: './map/Tile/EmeraldWater.png', cost: 0, description: '바닥 타일', spriteFrames: 2 },
  { id: 'tile_01', name: '바닥 1', layer: 'tile', imagePath: './map/Tile/medievalTile_01.png', cost: 5, description: '바닥 타일' },
  { id: 'tile_15', name: '바닥 15', layer: 'tile', imagePath: './map/Tile/medievalTile_15.png', cost: 10, description: '바닥 타일' },
]

// ==================== ENVIRONMENT (자연) ====================
// 가격: 8~35 코인
export const ENVIRONMENT_ASSETS: BuildingConfig[] = [
  // { id: 'custom_env_01', name: '나무', layer: 'environment', imagePath: './map/Environment/tree.png', cost: 0, description: '자연물' },
  // { id: 'custom_env_02', name: '통나무', layer: 'environment', imagePath: './map/Environment/log.PNG', cost: 0, description: '자연물' },
  { id: 'custom_env_03', name: '모닥불', layer: 'environment', imagePath: './map/Environment/FireSmall.png', cost: 0, description: '자연물' },
  { id: 'custom_env_04', name: '긴나무', layer: 'environment', imagePath: './map/Environment/TreeLongBasic.png', cost: 0, description: '자연물' },
  { id: 'custom_env_05', name: '긴꽃나무', layer: 'environment', imagePath: './map/Environment/TreeLongFlower.png', cost: 0, description: '자연물' },
  { id: 'custom_env_06', name: '잔디', layer: 'environment', imagePath: './map/Environment/BushBasic.png', cost: 0, description: '자연물' },
  { id: 'custom_env_07', name: '꽃잔디', layer: 'environment', imagePath: './map/Environment/BushFlowerPink.png', cost: 0, description: '자연물' },
  { id: 'custom_env_08', name: '꽃잔디2', layer: 'environment', imagePath: './map/Environment/BushFlowerYellow.png', cost: 0, description: '자연물' },
  { id: 'custom_env_09', name: '통나무', layer: 'environment', imagePath: './map/Environment/LugBasic.PNG', cost: 0, description: '자연물' },
  { id: 'custom_env_10', name: '통나무 오리', layer: 'environment', imagePath: './map/Environment/LugDuck.PNG', cost: 0, description: '자연물' },
  { id: 'custom_env_11', name: '사과나무', layer: 'environment', imagePath: './map/Environment/SphereTreeApple.PNG', cost: 0, description: '자연물' },
  { id: 'custom_env_12', name: '둥근나무', layer: 'environment', imagePath: './map/Environment/SphereTreeBasic.PNG', cost: 0, description: '자연물' },
  { id: 'custom_env_13', name: '둥근나무 - 핑크', layer: 'environment', imagePath: './map/Environment/SphereTreePink.PNG', cost: 0, description: '자연물' },
  { id: 'custom_env_14', name: '작은돌', layer: 'environment', imagePath: './map/Environment/StoneMiniBasic.png', cost: 0, description: '자연물' },
  { id: 'custom_env_15', name: '작은돌 - 잔디', layer: 'environment', imagePath: './map/Environment/StoneMiniMoss.png', cost: 0, description: '자연물' },
]

// ==================== STRUCTURES (건물) ====================
// 가격: 50~350 코인
export const STRUCTURE_ASSETS: BuildingConfig[] = [
  { id: 'struct_02', name: '건물 2', layer: 'structure', imagePath: './map/Structure/medievalStructure_02.png', cost: 80, description: '건물' },
  { id: 'struct_09', name: '건물 9', layer: 'structure', imagePath: './map/Structure/medievalStructure_09.png', cost: 130, description: '건물' },
  { id: 'struct_17', name: '건물 17', layer: 'structure', imagePath: './map/Structure/medievalStructure_17.png', cost: 60, description: '건물' },
  { id: 'struct_18', name: '건물 18', layer: 'structure', imagePath: './map/Structure/medievalStructure_18.png', cost: 100, description: '건물' },
  { id: 'struct_19', name: '건물 19', layer: 'structure', imagePath: './map/Structure/medievalStructure_19.png', cost: 70, description: '건물' },
  { id: 'struct_20', name: '건물 20', layer: 'structure', imagePath: './map/Structure/medievalStructure_20.png', cost: 90, description: '건물' },
  { id: 'struct_21', name: '건물 21', layer: 'structure', imagePath: './map/Structure/medievalStructure_21.png', cost: 160, description: '건물' },
  { id: 'struct_22', name: '건물 22', layer: 'structure', imagePath: './map/Structure/medievalStructure_22.png', cost: 140, description: '건물' },
]

// ==================== UNITS (유닛) ====================
// 가격: 30~200 코인
export const UNIT_ASSETS: BuildingConfig[] = [
  { id: 'custom_unit_01', name: '여자', layer: 'unit', imagePath: './map/Unit/woman.png', cost: 0, description: '유닛' },
  { id: 'custom_unit_02', name: '남자', layer: 'unit', imagePath: './map/Unit/man.png', cost: 0, description: '유닛' },
]

// ==================== 전체 에셋 배열 ====================
export const ALL_BUILDINGS: BuildingConfig[] = [
  ...TILE_ASSETS,
  ...ENVIRONMENT_ASSETS,
  ...STRUCTURE_ASSETS,
  ...UNIT_ASSETS,
]

// 레이어별 에셋 필터 함수
export const getAssetsByLayer = (layer: LayerType): BuildingConfig[] => {
  switch (layer) {
    case 'tile':
      return TILE_ASSETS
    case 'environment':
      return ENVIRONMENT_ASSETS
    case 'structure':
      return STRUCTURE_ASSETS
    case 'unit':
      return UNIT_ASSETS
    default:
      return []
  }
}

// 레이어별 기본 지급 수량
export function getDefaultQuantity(layer: LayerType): number {
  switch (layer) {
    case 'tile': return 25
    case 'environment': return 5
    case 'structure': return 1
    case 'unit': return 1
  }
}

// 에셋 통계
export const ASSET_STATS = {
  tiles: TILE_ASSETS.length,
  environments: ENVIRONMENT_ASSETS.length,
  structures: STRUCTURE_ASSETS.length,
  units: UNIT_ASSETS.length,
  total: ALL_BUILDINGS.length,
}
