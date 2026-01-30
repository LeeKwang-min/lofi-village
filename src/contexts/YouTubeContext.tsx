/**
 * YouTube Context
 * YouTube IFrame API를 통한 동영상 재생 상태를 전역으로 관리
 * 플레이리스트 기능으로 여러 영상을 저장하고 선택 재생 가능
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import {
  YouTubeVideo,
  YouTubePlayerState,
  YouTubeContextValue,
  YTPlayer,
  extractVideoId,
  getPlayerStateFromCode
} from '@/types/youtube'

// ===== Context 생성 =====
const YouTubeContext = createContext<YouTubeContextValue | null>(null)

// YouTube IFrame API 스크립트 로드 상태
let isAPILoading = false
let isAPILoaded = false
const apiReadyCallbacks: (() => void)[] = []

/**
 * YouTube IFrame API 스크립트 동적 로드
 */
function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (isAPILoaded && window.YT) {
      resolve()
      return
    }

    apiReadyCallbacks.push(resolve)

    if (isAPILoading) return

    isAPILoading = true

    window.onYouTubeIframeAPIReady = () => {
      isAPILoaded = true
      isAPILoading = false
      apiReadyCallbacks.forEach(cb => cb())
      apiReadyCallbacks.length = 0
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    document.head.appendChild(script)
  })
}

/**
 * noembed API를 통해 YouTube 영상 제목 가져오기
 */
async function fetchVideoTitle(videoId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    )
    if (!response.ok) return null

    const data = await response.json()
    return data.title || null
  } catch (error) {
    console.error('[YouTube] Failed to fetch video title:', error)
    return null
  }
}

// ===== Provider 컴포넌트 =====
export function YouTubeProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<YTPlayer | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // 플레이리스트 상태
  const [playlist, setPlaylist] = useState<YouTubeVideo[]>([])
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.5)
  const [playerState, setPlayerState] = useState<YouTubePlayerState>('unstarted')
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 현재 비디오 ref (콜백에서 최신 상태 참조용)
  const currentVideoRef = useRef<YouTubeVideo | null>(null)

  // currentVideo 변경 시 ref 동기화
  useEffect(() => {
    currentVideoRef.current = currentVideo
  }, [currentVideo])

  // 플레이어 컨테이너 생성 (숨김)
  useEffect(() => {
    const container = document.createElement('div')
    container.id = 'youtube-player-container'
    container.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;'

    const playerDiv = document.createElement('div')
    playerDiv.id = 'youtube-player'
    container.appendChild(playerDiv)

    document.body.appendChild(container)
    containerRef.current = container

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
      container.remove()
    }
  }, [])

  // YouTube API 로드 및 플레이어 초기화
  useEffect(() => {
    loadYouTubeAPI().then(() => {
      new window.YT.Player('youtube-player', {
        width: 1,
        height: 1,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            console.log('[YouTube] Player ready')
            playerRef.current = event.target as YTPlayer
            playerRef.current.setVolume(volume * 100)
            setIsReady(true)
          },
          onStateChange: (event) => {
            if (!currentVideoRef.current) {
              return
            }
            const state = getPlayerStateFromCode(event.data)
            console.log('[YouTube] State changed:', state, event.data)
            setPlayerState(state)
            setIsPlaying(state === 'playing')
          },
          onError: (event) => {
            console.error('[YouTube] Error:', event.data)
            const errorMessages: Record<number, string> = {
              2: '잘못된 영상 ID입니다.',
              5: 'HTML5 플레이어 오류가 발생했습니다.',
              100: '영상을 찾을 수 없습니다.',
              101: '소유자가 임베드를 허용하지 않습니다.',
              150: '소유자가 임베드를 허용하지 않습니다.',
            }
            setError(errorMessages[event.data] || '알 수 없는 오류가 발생했습니다.')
            setIsPlaying(false)
          }
        }
      })
    })
  }, [])

  // 내부: 영상 로드 및 재생
  const loadAndPlayVideo = useCallback((video: YouTubeVideo) => {
    setError(null)
    console.log('[YouTube] Loading video:', video.videoId)

    setCurrentVideo(video)
    currentVideoRef.current = video

    if (playerRef.current && isReady) {
      playerRef.current.loadVideoById(video.videoId)
    }
  }, [isReady])

  // 플레이리스트에 영상 추가 (자동 재생 없음)
  const addToPlaylist = useCallback(async (url: string) => {
    setError(null)

    const videoId = extractVideoId(url)
    if (!videoId) {
      setError('유효하지 않은 YouTube URL입니다.')
      return
    }

    // 중복 체크
    setPlaylist(prev => {
      if (prev.some(v => v.videoId === videoId)) {
        setError('이미 플레이리스트에 있는 영상입니다.')
        return prev
      }

      // 일단 videoId로 추가 (제목은 비동기로 업데이트)
      const newVideo: YouTubeVideo = { videoId, url, title: undefined }
      return [...prev, newVideo]
    })

    // 제목 비동기로 가져와서 업데이트
    const title = await fetchVideoTitle(videoId)
    if (title) {
      setPlaylist(prev =>
        prev.map(v => v.videoId === videoId ? { ...v, title } : v)
      )
    }
  }, [])

  // 플레이리스트에서 영상 제거
  const removeFromPlaylist = useCallback((videoId: string) => {
    setPlaylist(prev => {
      const newPlaylist = prev.filter(v => v.videoId !== videoId)

      // 현재 재생 중인 영상을 제거한 경우
      if (currentVideoRef.current?.videoId === videoId) {
        // 다음 영상이 있으면 선택만 (재생은 안 함), 없으면 정지
        const currentIndex = prev.findIndex(v => v.videoId === videoId)
        const nextVideo = newPlaylist[currentIndex] || newPlaylist[currentIndex - 1] || null

        if (nextVideo) {
          // 다음 영상을 현재 영상으로 설정 (재생은 안 함)
          setCurrentVideo(nextVideo)
          currentVideoRef.current = nextVideo
        } else {
          // 플레이리스트가 비었으면 정지
          currentVideoRef.current = null
          setCurrentVideo(null)
          setIsPlaying(false)
          setPlayerState('unstarted')
          if (playerRef.current) {
            try {
              playerRef.current.stopVideo()
            } catch (e) {
              console.error('[YouTube] Error stopping video:', e)
            }
          }
        }
      }

      return newPlaylist
    })
  }, [])

  // 플레이리스트에서 영상 선택 재생
  const selectVideo = useCallback((videoId: string) => {
    const video = playlist.find(v => v.videoId === videoId)
    if (video) {
      loadAndPlayVideo(video)
    }
  }, [playlist, loadAndPlayVideo])

  // 재생
  const play = useCallback(() => {
    // currentVideo가 없으면 첫 번째 영상 선택
    if (!currentVideo && playlist.length > 0) {
      loadAndPlayVideo(playlist[0])
      return
    }

    if (playerRef.current && currentVideo) {
      playerRef.current.playVideo()
    }
  }, [currentVideo, playlist, loadAndPlayVideo])

  // 정지
  const pause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pauseVideo()
    }
  }, [])

  // 재생/정지 토글
  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  // 볼륨 설정
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolumeState(clampedVolume)

    if (playerRef.current) {
      playerRef.current.setVolume(clampedVolume * 100)
    }
  }, [])

  // 전체 초기화 (플레이리스트 포함)
  const clearVideo = useCallback(() => {
    console.log('[YouTube] Clearing all')

    currentVideoRef.current = null
    setPlaylist([])
    setCurrentVideo(null)
    setIsPlaying(false)
    setPlayerState('unstarted')
    setError(null)

    if (playerRef.current) {
      try {
        playerRef.current.stopVideo()
      } catch (e) {
        console.error('[YouTube] Error stopping video:', e)
      }
    }
  }, [])

  const value: YouTubeContextValue = {
    playlist,
    currentVideo,
    isPlaying,
    volume,
    playerState,
    isReady,
    error,
    addToPlaylist,
    removeFromPlaylist,
    selectVideo,
    play,
    pause,
    togglePlayback,
    setVolume,
    clearVideo,
  }

  return (
    <YouTubeContext.Provider value={value}>
      {children}
    </YouTubeContext.Provider>
  )
}

// ===== Hook =====
export function useYouTubeContext() {
  const context = useContext(YouTubeContext)
  if (!context) {
    throw new Error('useYouTubeContext must be used within a YouTubeProvider')
  }
  return context
}
