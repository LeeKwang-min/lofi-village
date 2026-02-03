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
}

// ==================== TILES (바닥) ====================
// 가격: 5~20 코인
export const TILE_ASSETS: BuildingConfig[] = [
  { id: 'custom_tile_01', name: '바닥 (이벤트)', layer: 'tile', imagePath: './map/custom/grass.png', cost: 0, description: '바닥 타일' },
  { id: 'tile_01', name: '바닥 1', layer: 'tile', imagePath: './map/Tile/medievalTile_01.png', cost: 5, description: '바닥 타일' },
  { id: 'tile_02', name: '바닥 2', layer: 'tile', imagePath: './map/Tile/medievalTile_02.png', cost: 5, description: '바닥 타일' },
  { id: 'tile_03', name: '바닥 3', layer: 'tile', imagePath: './map/Tile/medievalTile_03.png', cost: 5, description: '바닥 타일' },
  { id: 'tile_04', name: '바닥 4', layer: 'tile', imagePath: './map/Tile/medievalTile_04.png', cost: 5, description: '바닥 타일' },
  { id: 'tile_05', name: '바닥 5', layer: 'tile', imagePath: './map/Tile/medievalTile_05.png', cost: 5, description: '바닥 타일' },
  { id: 'tile_06', name: '바닥 6', layer: 'tile', imagePath: './map/Tile/medievalTile_06.png', cost: 5, description: '바닥 타일' },
  { id: 'tile_07', name: '바닥 7', layer: 'tile', imagePath: './map/Tile/medievalTile_07.png', cost: 5, description: '바닥 타일' },
  { id: 'tile_08', name: '바닥 8', layer: 'tile', imagePath: './map/Tile/medievalTile_08.png', cost: 5, description: '바닥 타일' },
  { id: 'tile_09', name: '바닥 9', layer: 'tile', imagePath: './map/Tile/medievalTile_09.png', cost: 8, description: '바닥 타일' },
  { id: 'tile_10', name: '바닥 10', layer: 'tile', imagePath: './map/Tile/medievalTile_10.png', cost: 8, description: '바닥 타일' },
  { id: 'tile_11', name: '바닥 11', layer: 'tile', imagePath: './map/Tile/medievalTile_11.png', cost: 8, description: '바닥 타일' },
  { id: 'tile_12', name: '바닥 12', layer: 'tile', imagePath: './map/Tile/medievalTile_12.png', cost: 8, description: '바닥 타일' },
  { id: 'tile_13', name: '바닥 13', layer: 'tile', imagePath: './map/Tile/medievalTile_13.png', cost: 10, description: '바닥 타일' },
  { id: 'tile_14', name: '바닥 14', layer: 'tile', imagePath: './map/Tile/medievalTile_14.png', cost: 10, description: '바닥 타일' },
  { id: 'tile_15', name: '바닥 15', layer: 'tile', imagePath: './map/Tile/medievalTile_15.png', cost: 10, description: '바닥 타일' },
  { id: 'tile_16', name: '바닥 16', layer: 'tile', imagePath: './map/Tile/medievalTile_16.png', cost: 10, description: '바닥 타일' },
  { id: 'tile_17', name: '바닥 17', layer: 'tile', imagePath: './map/Tile/medievalTile_17.png', cost: 12, description: '바닥 타일' },
  { id: 'tile_18', name: '바닥 18', layer: 'tile', imagePath: './map/Tile/medievalTile_18.png', cost: 12, description: '바닥 타일' },
  { id: 'tile_19', name: '바닥 19', layer: 'tile', imagePath: './map/Tile/medievalTile_19.png', cost: 12, description: '바닥 타일' },
  { id: 'tile_20', name: '바닥 20', layer: 'tile', imagePath: './map/Tile/medievalTile_20.png', cost: 12, description: '바닥 타일' },
  { id: 'tile_21', name: '바닥 21', layer: 'tile', imagePath: './map/Tile/medievalTile_21.png', cost: 15, description: '바닥 타일' },
  { id: 'tile_22', name: '바닥 22', layer: 'tile', imagePath: './map/Tile/medievalTile_22.png', cost: 15, description: '바닥 타일' },
  { id: 'tile_23', name: '바닥 23', layer: 'tile', imagePath: './map/Tile/medievalTile_23.png', cost: 15, description: '바닥 타일' },
  { id: 'tile_24', name: '바닥 24', layer: 'tile', imagePath: './map/Tile/medievalTile_24.png', cost: 15, description: '바닥 타일' },
  { id: 'tile_25', name: '바닥 25', layer: 'tile', imagePath: './map/Tile/medievalTile_25.png', cost: 6, description: '바닥 타일' },
  { id: 'tile_26', name: '바닥 26', layer: 'tile', imagePath: './map/Tile/medievalTile_26.png', cost: 6, description: '바닥 타일' },
  { id: 'tile_27', name: '바닥 27', layer: 'tile', imagePath: './map/Tile/medievalTile_27.png', cost: 6, description: '바닥 타일' },
  { id: 'tile_28', name: '바닥 28', layer: 'tile', imagePath: './map/Tile/medievalTile_28.png', cost: 6, description: '바닥 타일' },
  { id: 'tile_29', name: '바닥 29', layer: 'tile', imagePath: './map/Tile/medievalTile_29.png', cost: 7, description: '바닥 타일' },
  { id: 'tile_30', name: '바닥 30', layer: 'tile', imagePath: './map/Tile/medievalTile_30.png', cost: 7, description: '바닥 타일' },
  { id: 'tile_31', name: '바닥 31', layer: 'tile', imagePath: './map/Tile/medievalTile_31.png', cost: 7, description: '바닥 타일' },
  { id: 'tile_32', name: '바닥 32', layer: 'tile', imagePath: './map/Tile/medievalTile_32.png', cost: 7, description: '바닥 타일' },
  { id: 'tile_33', name: '바닥 33', layer: 'tile', imagePath: './map/Tile/medievalTile_33.png', cost: 9, description: '바닥 타일' },
  { id: 'tile_34', name: '바닥 34', layer: 'tile', imagePath: './map/Tile/medievalTile_34.png', cost: 9, description: '바닥 타일' },
  { id: 'tile_35', name: '바닥 35', layer: 'tile', imagePath: './map/Tile/medievalTile_35.png', cost: 9, description: '바닥 타일' },
  { id: 'tile_36', name: '바닥 36', layer: 'tile', imagePath: './map/Tile/medievalTile_36.png', cost: 9, description: '바닥 타일' },
  { id: 'tile_37', name: '바닥 37', layer: 'tile', imagePath: './map/Tile/medievalTile_37.png', cost: 10, description: '바닥 타일' },
  { id: 'tile_38', name: '바닥 38', layer: 'tile', imagePath: './map/Tile/medievalTile_38.png', cost: 10, description: '바닥 타일' },
  { id: 'tile_39', name: '바닥 39', layer: 'tile', imagePath: './map/Tile/medievalTile_39.png', cost: 10, description: '바닥 타일' },
  { id: 'tile_40', name: '바닥 40', layer: 'tile', imagePath: './map/Tile/medievalTile_40.png', cost: 10, description: '바닥 타일' },
  { id: 'tile_41', name: '바닥 41', layer: 'tile', imagePath: './map/Tile/medievalTile_41.png', cost: 8, description: '바닥 타일' },
  { id: 'tile_42', name: '바닥 42', layer: 'tile', imagePath: './map/Tile/medievalTile_42.png', cost: 8, description: '바닥 타일' },
  { id: 'tile_43', name: '바닥 43', layer: 'tile', imagePath: './map/Tile/medievalTile_43.png', cost: 8, description: '바닥 타일' },
  { id: 'tile_44', name: '바닥 44', layer: 'tile', imagePath: './map/Tile/medievalTile_44.png', cost: 8, description: '바닥 타일' },
  { id: 'tile_45', name: '바닥 45', layer: 'tile', imagePath: './map/Tile/medievalTile_45.png', cost: 12, description: '바닥 타일' },
  { id: 'tile_46', name: '바닥 46', layer: 'tile', imagePath: './map/Tile/medievalTile_46.png', cost: 12, description: '바닥 타일' },
  { id: 'tile_47', name: '바닥 47', layer: 'tile', imagePath: './map/Tile/medievalTile_47.png', cost: 12, description: '바닥 타일' },
  { id: 'tile_48', name: '바닥 48', layer: 'tile', imagePath: './map/Tile/medievalTile_48.png', cost: 12, description: '바닥 타일' },
  { id: 'tile_49', name: '바닥 49', layer: 'tile', imagePath: './map/Tile/medievalTile_49.png', cost: 10, description: '바닥 타일' },
  { id: 'tile_50', name: '바닥 50', layer: 'tile', imagePath: './map/Tile/medievalTile_50.png', cost: 10, description: '바닥 타일' },
  { id: 'tile_51', name: '바닥 51', layer: 'tile', imagePath: './map/Tile/medievalTile_51.png', cost: 10, description: '바닥 타일' },
  { id: 'tile_52', name: '바닥 52', layer: 'tile', imagePath: './map/Tile/medievalTile_52.png', cost: 10, description: '바닥 타일' },
  { id: 'tile_53', name: '바닥 53', layer: 'tile', imagePath: './map/Tile/medievalTile_53.png', cost: 15, description: '바닥 타일' },
  { id: 'tile_54', name: '바닥 54', layer: 'tile', imagePath: './map/Tile/medievalTile_54.png', cost: 15, description: '바닥 타일' },
  { id: 'tile_55', name: '바닥 55', layer: 'tile', imagePath: './map/Tile/medievalTile_55.png', cost: 15, description: '바닥 타일' },
  { id: 'tile_56', name: '바닥 56', layer: 'tile', imagePath: './map/Tile/medievalTile_56.png', cost: 15, description: '바닥 타일' },
  { id: 'tile_57', name: '바닥 57', layer: 'tile', imagePath: './map/Tile/medievalTile_57.png', cost: 20, description: '바닥 타일' },
  { id: 'tile_58', name: '바닥 58', layer: 'tile', imagePath: './map/Tile/medievalTile_58.png', cost: 20, description: '바닥 타일' },
]

// ==================== ENVIRONMENT (자연) ====================
// 가격: 8~35 코인
export const ENVIRONMENT_ASSETS: BuildingConfig[] = [
  { id: 'custom_env_01', name: '나무 (이벤트)', layer: 'environment', imagePath: './map/custom/tree.png', cost: 0, description: '자연물' },
  { id: 'custom_env_02', name: '통나무 (이벤트)', layer: 'environment', imagePath: './map/custom/log.PNG', cost: 0, description: '자연물' },
  { id: 'env_01', name: '자연 1', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_01.png', cost: 20, description: '자연물' },
  { id: 'env_02', name: '자연 2', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_02.png', cost: 30, description: '자연물' },
  { id: 'env_03', name: '자연 3', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_03.png', cost: 25, description: '자연물' },
  { id: 'env_04', name: '자연 4', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_04.png', cost: 35, description: '자연물' },
  { id: 'env_05', name: '자연 5', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_05.png', cost: 10, description: '자연물' },
  { id: 'env_06', name: '자연 6', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_06.png', cost: 15, description: '자연물' },
  { id: 'env_07', name: '자연 7', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_07.png', cost: 20, description: '자연물' },
  { id: 'env_08', name: '자연 8', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_08.png', cost: 25, description: '자연물' },
  { id: 'env_09', name: '자연 9', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_09.png', cost: 10, description: '자연물' },
  { id: 'env_10', name: '자연 10', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_10.png', cost: 15, description: '자연물' },
  { id: 'env_11', name: '자연 11', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_11.png', cost: 18, description: '자연물' },
  { id: 'env_12', name: '자연 12', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_12.png', cost: 20, description: '자연물' },
  { id: 'env_13', name: '자연 13', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_13.png', cost: 12, description: '자연물' },
  { id: 'env_14', name: '자연 14', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_14.png', cost: 12, description: '자연물' },
  { id: 'env_15', name: '자연 15', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_15.png', cost: 12, description: '자연물' },
  { id: 'env_16', name: '자연 16', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_16.png', cost: 12, description: '자연물' },
  { id: 'env_17', name: '자연 17', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_17.png', cost: 8, description: '자연물' },
  { id: 'env_18', name: '자연 18', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_18.png', cost: 10, description: '자연물' },
  { id: 'env_19', name: '자연 19', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_19.png', cost: 15, description: '자연물' },
  { id: 'env_20', name: '자연 20', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_20.png', cost: 8, description: '자연물' },
  { id: 'env_21', name: '자연 21', layer: 'environment', imagePath: './map/Environment/medievalEnvironment_21.png', cost: 10, description: '자연물' },
]

// ==================== STRUCTURES (건물) ====================
// 가격: 50~350 코인
export const STRUCTURE_ASSETS: BuildingConfig[] = [
  { id: 'struct_01', name: '건물 1', layer: 'structure', imagePath: './map/Structure/medievalStructure_01.png', cost: 50, description: '건물' },
  { id: 'struct_02', name: '건물 2', layer: 'structure', imagePath: './map/Structure/medievalStructure_02.png', cost: 80, description: '건물' },
  { id: 'struct_03', name: '건물 3', layer: 'structure', imagePath: './map/Structure/medievalStructure_03.png', cost: 120, description: '건물' },
  { id: 'struct_04', name: '건물 4', layer: 'structure', imagePath: './map/Structure/medievalStructure_04.png', cost: 150, description: '건물' },
  { id: 'struct_05', name: '건물 5', layer: 'structure', imagePath: './map/Structure/medievalStructure_05.png', cost: 100, description: '건물' },
  { id: 'struct_06', name: '건물 6', layer: 'structure', imagePath: './map/Structure/medievalStructure_06.png', cost: 150, description: '건물' },
  { id: 'struct_07', name: '건물 7', layer: 'structure', imagePath: './map/Structure/medievalStructure_07.png', cost: 200, description: '건물' },
  { id: 'struct_08', name: '건물 8', layer: 'structure', imagePath: './map/Structure/medievalStructure_08.png', cost: 120, description: '건물' },
  { id: 'struct_09', name: '건물 9', layer: 'structure', imagePath: './map/Structure/medievalStructure_09.png', cost: 130, description: '건물' },
  { id: 'struct_10', name: '건물 10', layer: 'structure', imagePath: './map/Structure/medievalStructure_10.png', cost: 140, description: '건물' },
  { id: 'struct_11', name: '건물 11', layer: 'structure', imagePath: './map/Structure/medievalStructure_11.png', cost: 110, description: '건물' },
  { id: 'struct_12', name: '건물 12', layer: 'structure', imagePath: './map/Structure/medievalStructure_12.png', cost: 250, description: '건물' },
  { id: 'struct_13', name: '건물 13', layer: 'structure', imagePath: './map/Structure/medievalStructure_13.png', cost: 350, description: '건물' },
  { id: 'struct_14', name: '건물 14', layer: 'structure', imagePath: './map/Structure/medievalStructure_14.png', cost: 180, description: '건물' },
  { id: 'struct_15', name: '건물 15', layer: 'structure', imagePath: './map/Structure/medievalStructure_15.png', cost: 200, description: '건물' },
  { id: 'struct_16', name: '건물 16', layer: 'structure', imagePath: './map/Structure/medievalStructure_16.png', cost: 300, description: '건물' },
  { id: 'struct_17', name: '건물 17', layer: 'structure', imagePath: './map/Structure/medievalStructure_17.png', cost: 60, description: '건물' },
  { id: 'struct_18', name: '건물 18', layer: 'structure', imagePath: './map/Structure/medievalStructure_18.png', cost: 100, description: '건물' },
  { id: 'struct_19', name: '건물 19', layer: 'structure', imagePath: './map/Structure/medievalStructure_19.png', cost: 70, description: '건물' },
  { id: 'struct_20', name: '건물 20', layer: 'structure', imagePath: './map/Structure/medievalStructure_20.png', cost: 90, description: '건물' },
  { id: 'struct_21', name: '건물 21', layer: 'structure', imagePath: './map/Structure/medievalStructure_21.png', cost: 160, description: '건물' },
  { id: 'struct_22', name: '건물 22', layer: 'structure', imagePath: './map/Structure/medievalStructure_22.png', cost: 140, description: '건물' },
  { id: 'struct_23', name: '건물 23', layer: 'structure', imagePath: './map/Structure/medievalStructure_23.png', cost: 80, description: '건물' },
]

// ==================== UNITS (유닛) ====================
// 가격: 30~200 코인
export const UNIT_ASSETS: BuildingConfig[] = [
  { id: 'custom_unit_01', name: '여자 (이벤트)', layer: 'unit', imagePath: './map/custom/woman.png', cost: 0, description: '유닛' },
  { id: 'unit_01', name: '유닛 1', layer: 'unit', imagePath: './map/Unit/medievalUnit_01.png', cost: 30, description: '유닛' },
  { id: 'unit_02', name: '유닛 2', layer: 'unit', imagePath: './map/Unit/medievalUnit_02.png', cost: 30, description: '유닛' },
  { id: 'unit_03', name: '유닛 3', layer: 'unit', imagePath: './map/Unit/medievalUnit_03.png', cost: 35, description: '유닛' },
  { id: 'unit_04', name: '유닛 4', layer: 'unit', imagePath: './map/Unit/medievalUnit_04.png', cost: 35, description: '유닛' },
  { id: 'unit_05', name: '유닛 5', layer: 'unit', imagePath: './map/Unit/medievalUnit_05.png', cost: 60, description: '유닛' },
  { id: 'unit_06', name: '유닛 6', layer: 'unit', imagePath: './map/Unit/medievalUnit_06.png', cost: 80, description: '유닛' },
  { id: 'unit_07', name: '유닛 7', layer: 'unit', imagePath: './map/Unit/medievalUnit_07.png', cost: 120, description: '유닛' },
  { id: 'unit_08', name: '유닛 8', layer: 'unit', imagePath: './map/Unit/medievalUnit_08.png', cost: 50, description: '유닛' },
  { id: 'unit_09', name: '유닛 9', layer: 'unit', imagePath: './map/Unit/medievalUnit_09.png', cost: 55, description: '유닛' },
  { id: 'unit_10', name: '유닛 10', layer: 'unit', imagePath: './map/Unit/medievalUnit_10.png', cost: 45, description: '유닛' },
  { id: 'unit_11', name: '유닛 11', layer: 'unit', imagePath: './map/Unit/medievalUnit_11.png', cost: 70, description: '유닛' },
  { id: 'unit_12', name: '유닛 12', layer: 'unit', imagePath: './map/Unit/medievalUnit_12.png', cost: 200, description: '유닛' },
  { id: 'unit_13', name: '유닛 13', layer: 'unit', imagePath: './map/Unit/medievalUnit_13.png', cost: 200, description: '유닛' },
  { id: 'unit_14', name: '유닛 14', layer: 'unit', imagePath: './map/Unit/medievalUnit_14.png', cost: 150, description: '유닛' },
  { id: 'unit_15', name: '유닛 15', layer: 'unit', imagePath: './map/Unit/medievalUnit_15.png', cost: 150, description: '유닛' },
  { id: 'unit_16', name: '유닛 16', layer: 'unit', imagePath: './map/Unit/medievalUnit_16.png', cost: 100, description: '유닛' },
  { id: 'unit_17', name: '유닛 17', layer: 'unit', imagePath: './map/Unit/medievalUnit_17.png', cost: 100, description: '유닛' },
  { id: 'unit_18', name: '유닛 18', layer: 'unit', imagePath: './map/Unit/medievalUnit_18.png', cost: 80, description: '유닛' },
  { id: 'unit_19', name: '유닛 19', layer: 'unit', imagePath: './map/Unit/medievalUnit_19.png', cost: 50, description: '유닛' },
  { id: 'unit_20', name: '유닛 20', layer: 'unit', imagePath: './map/Unit/medievalUnit_20.png', cost: 55, description: '유닛' },
  { id: 'unit_21', name: '유닛 21', layer: 'unit', imagePath: './map/Unit/medievalUnit_21.png', cost: 60, description: '유닛' },
  { id: 'unit_22', name: '유닛 22', layer: 'unit', imagePath: './map/Unit/medievalUnit_22.png', cost: 70, description: '유닛' },
  { id: 'unit_23', name: '유닛 23', layer: 'unit', imagePath: './map/Unit/medievalUnit_23.png', cost: 45, description: '유닛' },
  { id: 'unit_24', name: '유닛 24', layer: 'unit', imagePath: './map/Unit/medievalUnit_24.png', cost: 40, description: '유닛' },
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

// 에셋 통계
export const ASSET_STATS = {
  tiles: TILE_ASSETS.length,
  environments: ENVIRONMENT_ASSETS.length,
  structures: STRUCTURE_ASSETS.length,
  units: UNIT_ASSETS.length,
  total: ALL_BUILDINGS.length,
}
