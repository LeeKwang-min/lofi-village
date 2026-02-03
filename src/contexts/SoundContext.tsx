/**
 * Sound Context
 * 사운드 믹서 상태를 전역으로 관리하여 탭 전환 시에도 재생 유지
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode
} from 'react'

// ===== 타입 정의 =====
export interface SoundChannel {
  id: string
  name: string
  emoji: string
  src: string
}

interface AudioState {
  audio: HTMLAudioElement
  volume: number
}

interface SoundContextValue {
  // 상태
  activeSounds: Set<string>
  volumes: Record<string, number>
  isPlaying: boolean

  // 액션
  toggleSound: (id: string) => void
  setVolume: (id: string, volume: number) => void
  playAll: () => void
  pauseAll: () => void
  togglePlayback: () => void
  isActive: (id: string) => boolean
}

// ===== 사운드 채널 정의 =====

// 🎹 Lofi Beats
export const LOFI_CHANNELS: SoundChannel[] = [
  { id: 'lofi1', name: 'Acoustic 1', emoji: '🎸', src: './sounds/lofi_acoustic1.mp3' },
  { id: 'lofi2', name: 'Acoustic 2', emoji: '🎸', src: './sounds/lofi_acoustic2.mp3' },
  { id: 'lofi3', name: 'Acoustic 3', emoji: '🎸', src: './sounds/lofi_acoustic3.mp3' },
  { id: 'lofi4', name: 'Cill 1', emoji: '🍵', src: './sounds/lofi_cill1.mp3' },
  { id: 'lofi5', name: 'Cill 2', emoji: '🍵', src: './sounds/lofi_cill2.mp3' },
  { id: 'lofi6', name: 'Cill 3', emoji: '🍵', src: './sounds/lofi_cill3.mp3' },
  { id: 'lofi7', name: 'City 1', emoji: '🏙️', src: './sounds/lofi_city1.mp3' },
  { id: 'lofi8', name: 'City 2', emoji: '🏙️', src: './sounds/lofi_city2.mp3' },
  { id: 'lofi9', name: 'City 3', emoji: '🏙️', src: './sounds/lofi_city3.mp3' }
]

// 🌿 Ambient Sounds (그룹별)
export interface SoundGroup {
  id: string
  name: string
  emoji: string
  channels: SoundChannel[]
}

export const AMBIENT_GROUPS: SoundGroup[] = [
  {
    id: 'rain',
    name: 'Rain',
    emoji: '🌧️',
    channels: [
      { id: 'rain1', name: 'Soft Rain', emoji: '🌧️', src: './sounds/rain1.mp3' },
      { id: 'rain2', name: 'Rain Drops', emoji: '💧', src: './sounds/rain2.mp3' }
    ]
  },
  {
    id: 'cafe',
    name: 'Cafe',
    emoji: '☕',
    channels: [
      { id: 'cafe1', name: 'Cafe Ambience 1', emoji: '☕', src: './sounds/cafe1.mp3' },
      { id: 'cafe2', name: 'Cafe Ambience 2', emoji: '🍵', src: './sounds/cafe2.mp3' },
      { id: 'cafe3', name: 'Cafe Chatter', emoji: '👥', src: './sounds/cafe3.mp3' },
      { id: 'cafe4', name: 'Coffee Shop', emoji: '🏪', src: './sounds/cafe4.mp3' }
    ]
  },
  {
    id: 'fire',
    name: 'Fire',
    emoji: '🔥',
    channels: [
      { id: 'fire1', name: 'Fireplace', emoji: '🔥', src: './sounds/fire1.mp3' },
      { id: 'fire2', name: 'Campfire', emoji: '🏕️', src: './sounds/fire2.mp3' }
    ]
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    channels: [
      { id: 'forest1', name: 'Forest Birds', emoji: '🌲', src: './sounds/forest1.mp3' },
      { id: 'forest2', name: 'Forest Ambience', emoji: '🌳', src: './sounds/forest2.mp3' },
      { id: 'forest3', name: 'Forest Night', emoji: '🦉', src: './sounds/forest3.mp3' }
    ]
  },
  {
    id: 'water',
    name: 'Water',
    emoji: '💦',
    channels: [
      { id: 'water1', name: 'Stream', emoji: '💦', src: './sounds/water1.mp3' },
      { id: 'water2', name: 'River', emoji: '🏞️', src: './sounds/water2.mp3' },
      { id: 'water3', name: 'Waterfall', emoji: '🌊', src: './sounds/water3.mp3' },
      { id: 'water4', name: 'Ocean Waves', emoji: '🐚', src: './sounds/water4.mp3' }
    ]
  },
  {
    id: 'wind',
    name: 'Wind',
    emoji: '🌬️',
    channels: [
      { id: 'wind1', name: 'Gentle Breeze', emoji: '🌬️', src: './sounds/wind1.mp3' },
      { id: 'wind2', name: 'Wind Chimes', emoji: '🎐', src: './sounds/wind2.mp3' },
      { id: 'wind3', name: 'Strong Wind', emoji: '💨', src: './sounds/wind3.mp3' },
      { id: 'wind4', name: 'Howling Wind', emoji: '🍃', src: './sounds/wind4.mp3' }
    ]
  }
]

export const AMBIENT_CHANNELS: SoundChannel[] = AMBIENT_GROUPS.flatMap((g) => g.channels)
export const ALL_CHANNELS: SoundChannel[] = [...LOFI_CHANNELS, ...AMBIENT_CHANNELS]

// ===== Context 생성 =====
const SoundContext = createContext<SoundContextValue | null>(null)

// ===== Provider 컴포넌트 =====
export function SoundProvider({ children }: { children: ReactNode }) {
  const audioRefs = useRef<Map<string, AudioState>>(new Map())
  const [activeSounds, setActiveSounds] = useState<Set<string>>(new Set())
  const [volumes, setVolumes] = useState<Record<string, number>>({})
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(isPlaying)

  // isPlaying ref 동기화
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  // 오디오 요소 초기화 (한 번만 실행)
  useEffect(() => {
    const initialVolumes: Record<string, number> = {}

    ALL_CHANNELS.forEach((channel) => {
      if (!audioRefs.current.has(channel.id)) {
        const audio = new Audio(channel.src)
        audio.loop = true
        audio.volume = 0.5
        audioRefs.current.set(channel.id, { audio, volume: 0.5 })
        initialVolumes[channel.id] = 0.5
      }
    })

    setVolumes((prev) => ({ ...initialVolumes, ...prev }))

    // 앱 종료 시에만 클린업 (탭 전환 시에는 실행되지 않음)
    return () => {
      audioRefs.current.forEach((state) => {
        state.audio.pause()
        state.audio.src = ''
      })
      audioRefs.current.clear()
    }
  }, [])

  // 사운드 추가/제거 토글
  const toggleSound = useCallback((id: string) => {
    setActiveSounds((prev) => {
      const next = new Set(prev)
      const audioState = audioRefs.current.get(id)

      if (next.has(id)) {
        next.delete(id)
        audioState?.audio.pause()

        if (next.size === 0) {
          setIsPlaying(false)
        }
      } else {
        next.add(id)
        if (isPlayingRef.current && audioState) {
          audioState.audio.play().catch(console.error)
        }
      }

      return next
    })
  }, [])

  // 개별 볼륨 조절
  const setVolume = useCallback((id: string, volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))

    setVolumes((prev) => ({ ...prev, [id]: clampedVolume }))

    const audioState = audioRefs.current.get(id)
    if (audioState) {
      audioState.audio.volume = clampedVolume
      audioState.volume = clampedVolume
    }
  }, [])

  // 모든 활성 사운드 재생
  const playAll = useCallback(() => {
    setIsPlaying(true)
    setActiveSounds((current) => {
      current.forEach((id) => {
        const audioState = audioRefs.current.get(id)
        if (audioState) {
          audioState.audio.play().catch(console.error)
        }
      })
      return current
    })
  }, [])

  // 모든 사운드 정지
  const pauseAll = useCallback(() => {
    setIsPlaying(false)
    audioRefs.current.forEach((state) => {
      state.audio.pause()
    })
  }, [])

  // 백그라운드에서 돌아올 때 오디오 상태 복구
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlayingRef.current) {
        // visible 상태로 돌아왔고, 재생 중이었다면 모든 활성 사운드 재개
        setActiveSounds((current) => {
          current.forEach((id) => {
            const audioState = audioRefs.current.get(id)
            if (audioState && audioState.audio.paused) {
              audioState.audio.play().catch(console.error)
            }
          })
          return current
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // 전역 재생/정지 토글
  const togglePlayback = useCallback(() => {
    if (isPlayingRef.current) {
      pauseAll()
    } else {
      playAll()
    }
  }, [playAll, pauseAll])

  // 사운드가 활성화되어 있는지 확인
  const isActive = useCallback(
    (id: string) => {
      return activeSounds.has(id)
    },
    [activeSounds]
  )

  const value: SoundContextValue = {
    activeSounds,
    volumes,
    isPlaying,
    toggleSound,
    setVolume,
    playAll,
    pauseAll,
    togglePlayback,
    isActive
  }

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

// ===== Hook =====
export function useSoundContext() {
  const context = useContext(SoundContext)
  if (!context) {
    throw new Error('useSoundContext must be used within a SoundProvider')
  }
  return context
}
