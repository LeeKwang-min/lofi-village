import { useState, useEffect, useRef, useCallback } from 'react'

interface UseAudioOptions {
  loop?: boolean
  volume?: number
}

interface UseAudioReturn {
  isPlaying: boolean
  volume: number
  play: () => void
  pause: () => void
  toggle: () => void
  setVolume: (volume: number) => void
}

export function useAudio(src: string, options: UseAudioOptions = {}): UseAudioReturn {
  const { loop = true, volume: initialVolume = 0.5 } = options

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(initialVolume)

  // 오디오 요소 초기화
  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = loop
    audio.volume = initialVolume
    audioRef.current = audio

    // 재생 상태 동기화
    audio.addEventListener('play', () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))
    audio.addEventListener('ended', () => setIsPlaying(false))

    // 클린업: 컴포넌트 언마운트 시 오디오 정리
    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [src, loop, initialVolume])

  // TODO(human): play 함수 구현
  // audioRef.current가 존재하면 play() 메서드를 호출하세요
  // 힌트: audio.play()는 Promise를 반환합니다 (에러 처리 권장)
  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => console.error('재생 실패 : ', err))
    }
  }, [])

  // TODO(human): pause 함수 구현
  // audioRef.current가 존재하면 pause() 메서드를 호출하세요
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  // 볼륨 조절
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolumeState(clampedVolume)
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume
    }
  }, [])

  return {
    isPlaying,
    volume,
    play,
    pause,
    toggle,
    setVolume
  }
}
