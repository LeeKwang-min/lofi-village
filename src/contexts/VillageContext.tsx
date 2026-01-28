import { createContext, useContext, ReactNode } from 'react'
import { useVillage } from '@/hooks/useVillage'

// useVillage의 반환 타입
type VillageContextType = ReturnType<typeof useVillage>

const VillageContext = createContext<VillageContextType | null>(null)

interface VillageProviderProps {
  children: ReactNode
}

export function VillageProvider({ children }: VillageProviderProps) {
  const village = useVillage()

  return (
    <VillageContext.Provider value={village}>
      {children}
    </VillageContext.Provider>
  )
}

// 커스텀 훅: Context 사용을 더 편리하게
export function useVillageContext() {
  const context = useContext(VillageContext)
  if (!context) {
    throw new Error('useVillageContext must be used within a VillageProvider')
  }
  return context
}
