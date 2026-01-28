import { useState, useEffect, useRef, useCallback } from 'react'

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

interface UseSoundMixerReturn {
  // 상태
  activeSounds: Set<string>  // 믹스에 추가된 사운드 ID
  volumes: Record<string, number>  // 각 사운드의 볼륨
  isPlaying: boolean  // 전역 재생 상태

  // 액션
  toggleSound: (id: string) => void  // 사운드 추가/제거 토글
  setVolume: (id: string, volume: number) => void  // 개별 볼륨 조절
  playAll: () => void  // 모든 활성 사운드 재생
  pauseAll: () => void  // 모든 사운드 정지
  togglePlayback: () => void  // 전역 재생/정지 토글
  isActive: (id: string) => boolean  // 사운드가 활성화되어 있는지 확인
}

export function useSoundMixer(channels: SoundChannel[]): UseSoundMixerReturn {
  const audioRefs = useRef<Map<string, AudioState>>(new Map())
  const [activeSounds, setActiveSounds] = useState<Set<string>>(new Set())
  const [volumes, setVolumes] = useState<Record<string, number>>({})
  const [isPlaying, setIsPlaying] = useState(false)

  // 오디오 요소 초기화
  useEffect(() => {
    const initialVolumes: Record<string, number> = {}

    channels.forEach((channel) => {
      if (!audioRefs.current.has(channel.id)) {
        const audio = new Audio(channel.src)
        audio.loop = true
        audio.volume = 0.5
        audioRefs.current.set(channel.id, { audio, volume: 0.5 })
        initialVolumes[channel.id] = 0.5
      }
    })

    setVolumes((prev) => ({ ...initialVolumes, ...prev }))

    // 클린업
    return () => {
      audioRefs.current.forEach((state) => {
        state.audio.pause()
        state.audio.src = ''
      })
      audioRefs.current.clear()
    }
  }, [channels])

  // 사운드 추가/제거 토글
  const toggleSound = useCallback((id: string) => {
    setActiveSounds((prev) => {
      const next = new Set(prev)
      const audioState = audioRefs.current.get(id)

      if (next.has(id)) {
        // 제거: 재생 중지
        next.delete(id)
        audioState?.audio.pause()

        // 모든 사운드가 제거되면 재생 상태도 리셋
        if (next.size === 0) {
          setIsPlaying(false)
        }
      } else {
        // 추가: 전역이 재생 중이면 바로 재생
        next.add(id)
        if (isPlaying && audioState) {
          audioState.audio.play().catch(console.error)
        }
      }

      return next
    })
  }, [isPlaying])

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
    activeSounds.forEach((id) => {
      const audioState = audioRefs.current.get(id)
      if (audioState) {
        audioState.audio.play().catch(console.error)
      }
    })
  }, [activeSounds])

  // 모든 사운드 정지
  const pauseAll = useCallback(() => {
    setIsPlaying(false)
    audioRefs.current.forEach((state) => {
      state.audio.pause()
    })
  }, [])

  // 전역 재생/정지 토글
  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pauseAll()
    } else {
      playAll()
    }
  }, [isPlaying, playAll, pauseAll])

  // 사운드가 활성화되어 있는지 확인
  const isActive = useCallback((id: string) => {
    return activeSounds.has(id)
  }, [activeSounds])

  return {
    activeSounds,
    volumes,
    isPlaying,
    toggleSound,
    setVolume,
    playAll,
    pauseAll,
    togglePlayback,
    isActive,
  }
}
