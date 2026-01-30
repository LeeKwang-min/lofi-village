/**
 * YouTube IFrame API 관련 타입 정의
 * Sound Mixer와 동시 재생을 위한 YouTube 플레이어 상태 관리
 */

// YouTube 영상 정보
export interface YouTubeVideo {
  videoId: string
  title?: string
  url: string
}

// YouTube 플레이어 상태 (IFrame API 상태 코드와 매핑)
export type YouTubePlayerState =
  | 'unstarted'   // -1
  | 'ended'       // 0
  | 'playing'     // 1
  | 'paused'      // 2
  | 'buffering'   // 3
  | 'cued'        // 5

// 상태 코드를 문자열로 변환
export function getPlayerStateFromCode(code: number): YouTubePlayerState {
  switch (code) {
    case -1: return 'unstarted'
    case 0: return 'ended'
    case 1: return 'playing'
    case 2: return 'paused'
    case 3: return 'buffering'
    case 5: return 'cued'
    default: return 'unstarted'
  }
}

// Context 값 타입
export interface YouTubeContextValue {
  // 상태
  playlist: YouTubeVideo[]
  currentVideo: YouTubeVideo | null
  isPlaying: boolean
  volume: number
  playerState: YouTubePlayerState
  isReady: boolean
  error: string | null

  // 플레이리스트 액션
  addToPlaylist: (url: string) => void
  removeFromPlaylist: (videoId: string) => void
  selectVideo: (videoId: string) => void

  // 재생 제어 액션
  play: () => void
  pause: () => void
  togglePlayback: () => void
  setVolume: (volume: number) => void
  clearVideo: () => void
}

/**
 * YouTube URL에서 videoId 추출
 * 지원 형식:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://music.youtube.com/watch?v=VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /music\.youtube\.com\/watch\?v=([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// YouTube IFrame API 전역 타입 선언
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId?: string
          width?: number | string
          height?: number | string
          playerVars?: {
            autoplay?: 0 | 1
            controls?: 0 | 1
            disablekb?: 0 | 1
            fs?: 0 | 1
            modestbranding?: 0 | 1
            playsinline?: 0 | 1
            rel?: 0 | 1
            origin?: string
          }
          events?: {
            onReady?: (event: { target: YTPlayer }) => void
            onStateChange?: (event: { data: number; target: YTPlayer }) => void
            onError?: (event: { data: number }) => void
          }
        }
      ) => YTPlayer
      PlayerState: {
        UNSTARTED: -1
        ENDED: 0
        PLAYING: 1
        PAUSED: 2
        BUFFERING: 3
        CUED: 5
      }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

// YouTube Player 인스턴스 타입
export interface YTPlayer {
  playVideo: () => void
  pauseVideo: () => void
  stopVideo: () => void
  loadVideoById: (videoId: string) => void
  cueVideoById: (videoId: string) => void
  setVolume: (volume: number) => void
  getVolume: () => number
  getPlayerState: () => number
  destroy: () => void
}
