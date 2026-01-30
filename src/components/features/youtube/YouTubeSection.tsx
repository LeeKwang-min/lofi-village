/**
 * YouTube Section
 * 플레이리스트 형태로 여러 YouTube 영상을 관리하고 재생
 */

import { useState, FormEvent } from 'react'
import { Play, Pause, Volume2, VolumeX, X, Youtube, AlertCircle, Loader2, Plus } from 'lucide-react'
import { useYouTubeContext } from '@/contexts/YouTubeContext'

export function YouTubeSection() {
  const {
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
    togglePlayback,
    setVolume,
  } = useYouTubeContext()

  const [inputUrl, setInputUrl] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (inputUrl.trim()) {
      addToPlaylist(inputUrl.trim())
      setInputUrl('')
    }
  }

  const isBuffering = playerState === 'buffering'

  return (
    <div className="space-y-3 py-2">
      <div className="px-3 space-y-3">
        {/* URL 입력 폼 */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Youtube size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="YouTube URL 붙여넣기..."
              disabled={!isReady}
              className="w-full rounded-lg border border-surface-hover bg-background/50 py-2 pl-9 pr-3 text-sm text-text-primary placeholder-text-muted focus:border-rose-400/50 focus:outline-none focus:ring-1 focus:ring-rose-400/30 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!isReady || !inputUrl.trim()}
            className="flex items-center gap-1 rounded-lg bg-rose-500/20 px-3 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
            <span>추가</span>
          </button>
        </form>

        {/* 에러 메시지 */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* 플레이리스트 */}
        {playlist.length > 0 ? (
          <div className="space-y-1">
            {playlist.map((video) => {
              const isCurrent = currentVideo?.videoId === video.videoId
              const isCurrentPlaying = isCurrent && isPlaying
              const isCurrentBuffering = isCurrent && isBuffering

              return (
                <div
                  key={video.videoId}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                    isCurrent ? 'bg-rose-500/10' : 'hover:bg-surface-hover/50'
                  }`}
                >
                  {/* 재생/정지 버튼 */}
                  <button
                    onClick={() => isCurrent ? togglePlayback() : selectVideo(video.videoId)}
                    disabled={isCurrentBuffering}
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                      isCurrentPlaying
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                        : isCurrent
                          ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white'
                          : 'bg-surface text-text-secondary hover:bg-rose-500/20 hover:text-rose-400'
                    } disabled:opacity-50`}
                  >
                    {isCurrentBuffering ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isCurrentPlaying ? (
                      <Pause size={14} fill="currentColor" />
                    ) : (
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>

                  {/* 영상 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Youtube size={12} className={`flex-shrink-0 ${isCurrent ? 'text-rose-400' : 'text-text-muted'}`} />
                      <span className={`text-sm font-medium truncate ${
                        isCurrent ? 'text-rose-400' : 'text-text-primary'
                      }`}>
                        {video.title || video.videoId}
                      </span>
                    </div>
                    {isCurrent && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isCurrentPlaying && (
                          <>
                            <span className="flex gap-0.5">
                              {[...Array(3)].map((_, i) => (
                                <span
                                  key={i}
                                  className="w-0.5 animate-pulse rounded-full bg-rose-400"
                                  style={{
                                    height: `${6 + Math.random() * 6}px`,
                                    animationDelay: `${i * 0.15}s`
                                  }}
                                />
                              ))}
                            </span>
                            <span className="text-[10px] text-rose-400/70">재생 중</span>
                          </>
                        )}
                        {isCurrentBuffering && (
                          <span className="text-[10px] text-text-muted">버퍼링...</span>
                        )}
                        {playerState === 'paused' && isCurrent && (
                          <span className="text-[10px] text-text-muted">일시정지</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => removeFromPlaylist(video.videoId)}
                    className="p-1.5 rounded-full text-text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-text-muted text-center py-4">
            YouTube 영상을 추가하여 Ambient Sound와 함께 재생해보세요
          </p>
        )}

        {/* 볼륨 컨트롤 - 플레이리스트가 있을 때만 표시 */}
        {playlist.length > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t border-surface-hover/30">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.5)}
              className="text-text-muted hover:text-rose-400 transition-colors"
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1.5 cursor-pointer appearance-none rounded-full bg-surface [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-400"
            />
            <span className="w-10 text-right text-xs tabular-nums text-text-muted">
              {Math.round(volume * 100)}%
            </span>
          </div>
        )}

        {/* 광고 안내 */}
        {playlist.length > 0 && (
          <p className="text-[10px] text-text-muted/70 text-center">
            ⚠️ YouTube 광고가 재생될 수 있습니다
          </p>
        )}
      </div>
    </div>
  )
}
