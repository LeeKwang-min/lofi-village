import { useState } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import {
  useSoundContext,
  SoundChannel,
  LOFI_CHANNELS,
  AMBIENT_GROUPS,
  AMBIENT_CHANNELS,
  ALL_CHANNELS,
} from '@/contexts/SoundContext'
import { YouTubeSection } from '@/components/features/youtube'
import { useYouTubeContext } from '@/contexts/YouTubeContext'

// 탭 타입 정의
type MixerTab = 'lofi' | 'ambient' | 'youtube'

interface TabConfig {
  id: MixerTab
  label: string
  emoji: string
}

const TABS: TabConfig[] = [
  { id: 'lofi', label: 'Lofi', emoji: '🎹' },
  { id: 'ambient', label: 'Ambient', emoji: '🌿' },
  { id: 'youtube', label: 'YouTube', emoji: '📺' },
]

interface SoundTrackItemProps {
  channel: SoundChannel
  isActive: boolean
  volume: number
  isPlaying: boolean
  onToggle: () => void
  onVolumeChange: (volume: number) => void
}

function SoundTrackItem({
  channel,
  isActive,
  volume,
  isPlaying,
  onToggle,
  onVolumeChange
}: SoundTrackItemProps) {
  const isCurrentlyPlaying = isActive && isPlaying

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
        isActive ? 'bg-warm/10' : 'hover:bg-surface-hover/50'
      }`}
    >
      {/* 재생/정지 버튼 */}
      <button
        onClick={onToggle}
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all ${
          isCurrentlyPlaying
            ? 'shadow-lg bg-warm text-background shadow-warm/30'
            : isActive
              ? 'bg-warm/20 text-warm hover:bg-warm hover:text-background'
              : 'bg-surface text-text-secondary hover:bg-warm/20 hover:text-warm'
        }`}
      >
        {isCurrentlyPlaying ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      {/* 트랙 정보 */}
      <div className="flex flex-1 gap-2 items-center min-w-0">
        <span className="text-lg">{channel.emoji}</span>
        <div className="flex flex-col min-w-0">
          <span
            className={`truncate text-sm font-medium ${
              isActive ? 'text-warm' : 'text-text-primary'
            }`}
          >
            {channel.name}
          </span>
          {isCurrentlyPlaying && (
            <div className="flex gap-1 items-center">
              <span className="flex gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <span
                    key={i}
                    className="w-0.5 animate-pulse rounded-full bg-warm"
                    style={{
                      height: `${6 + Math.random() * 6}px`,
                      animationDelay: `${i * 0.15}s`
                    }}
                  />
                ))}
              </span>
              <span className="text-[10px] text-warm/70">재생 중</span>
            </div>
          )}
        </div>
      </div>

      {/* 볼륨 컨트롤 - 활성화 또는 호버 시 표시 */}
      <div
        className={`flex items-center gap-2 transition-opacity ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onVolumeChange(volume > 0 ? 0 : 0.5)
          }}
          className="transition-colors text-text-muted hover:text-warm"
        >
          {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-surface [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-warm"
        />
        <span className="w-7 text-right text-[10px] tabular-nums text-text-muted">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  )
}

export function SoundMixer() {
  const { activeSounds, volumes, isPlaying, toggleSound, setVolume, togglePlayback, isActive } =
    useSoundContext()
  const { playlist, currentVideo, isPlaying: isYouTubePlaying } = useYouTubeContext()

  const [activeTab, setActiveTab] = useState<MixerTab>('lofi')

  // 각 탭별 활성 트랙 수 계산
  const lofiActiveCount = LOFI_CHANNELS.filter(c => activeSounds.has(c.id)).length
  const ambientActiveCount = AMBIENT_CHANNELS.filter(c => activeSounds.has(c.id)).length
  const youtubeActiveCount = playlist.length

  const activeCount = activeSounds.size
  const totalActiveCount = activeCount + youtubeActiveCount

  // 탭별 활성 카운트 가져오기
  const getTabActiveCount = (tabId: MixerTab): number => {
    switch (tabId) {
      case 'lofi': return lofiActiveCount
      case 'ambient': return ambientActiveCount
      case 'youtube': return youtubeActiveCount
    }
  }

  return (
    <section className="flex overflow-hidden flex-col rounded-xl border border-surface-hover/50 bg-surface/50">
      {/* 헤더 */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-surface-hover/50">
        <div className="flex gap-2 items-center">
          <span className="text-lg">🎧</span>
          <h2 className="text-sm font-semibold text-text-primary">Sound Mixer</h2>
        </div>
        <span className="text-xs text-text-muted">
          {totalActiveCount > 0 ? `${totalActiveCount}개 선택됨` : '트랙을 선택하세요'}
        </span>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-surface-hover/30 bg-background/30">
        {TABS.map((tab) => {
          const count = getTabActiveCount(tab.id)
          const isActiveTab = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all relative ${
                isActiveTab
                  ? 'text-warm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isActiveTab
                    ? 'bg-warm/20 text-warm'
                    : 'bg-surface-hover/50 text-text-muted'
                }`}>
                  {count}
                </span>
              )}
              {/* 활성 탭 인디케이터 */}
              {isActiveTab && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-warm" />
              )}
            </button>
          )
        })}
      </div>

      {/* 탭 콘텐츠 - 고정 높이로 UX 일관성 유지 */}
      <div className="flex overflow-y-auto flex-col h-72 custom-scrollbar">
        {/* 🎹 Lofi 탭 */}
        {activeTab === 'lofi' && (
          <div className="py-1">
            {LOFI_CHANNELS.map((channel) => (
              <SoundTrackItem
                key={channel.id}
                channel={channel}
                isActive={isActive(channel.id)}
                volume={volumes[channel.id] ?? 0.5}
                isPlaying={isPlaying}
                onToggle={() => toggleSound(channel.id)}
                onVolumeChange={(vol) => setVolume(channel.id, vol)}
              />
            ))}
          </div>
        )}

        {/* 🌿 Ambient 탭 */}
        {activeTab === 'ambient' && (
          <div>
            {AMBIENT_GROUPS.map((group) => (
              <div key={group.id}>
                {/* 소그룹 헤더 */}
                <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-1.5 bg-surface/90 backdrop-blur-sm border-b border-surface-hover/20">
                  <span className="text-sm">{group.emoji}</span>
                  <span className="text-[11px] font-medium text-text-secondary">{group.name}</span>
                  <span className="text-[10px] text-text-muted">({group.channels.length})</span>
                </div>
                {/* 소그룹 트랙들 */}
                <div className="py-0.5">
                  {group.channels.map((channel) => (
                    <SoundTrackItem
                      key={channel.id}
                      channel={channel}
                      isActive={isActive(channel.id)}
                      volume={volumes[channel.id] ?? 0.5}
                      isPlaying={isPlaying}
                      onToggle={() => toggleSound(channel.id)}
                      onVolumeChange={(vol) => setVolume(channel.id, vol)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 📺 YouTube 탭 */}
        {activeTab === 'youtube' && (
          <YouTubeSection />
        )}
      </div>

      {/* 플레이어 컨트롤 바 */}
      <div className="flex gap-4 justify-between items-center px-4 py-3 border-t border-surface-hover/50 bg-background/30">
        {/* 재생 상태 표시 */}
        <div className="flex flex-1 gap-2 items-center min-w-0">
          {(isPlaying && activeCount > 0) || isYouTubePlaying ? (
            <>
              <div className="flex h-4 items-end gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-sm animate-bounce bg-warm"
                    style={{
                      height: '100%',
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.6s'
                    }}
                  />
                ))}
              </div>
              <span className="text-xs truncate text-warm">믹스 재생 중...</span>
            </>
          ) : (
            <span className="text-xs text-text-muted">
              {totalActiveCount === 0 ? '트랙을 선택해주세요' : '재생 대기 중'}
            </span>
          )}
        </div>

        {/* 메인 재생 버튼 */}
        <button
          onClick={togglePlayback}
          disabled={activeCount === 0}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
            activeCount === 0
              ? 'cursor-not-allowed bg-surface/50 text-text-muted'
              : isPlaying
                ? 'bg-warm text-background shadow-lg shadow-warm/40 hover:scale-105 hover:shadow-warm/60'
                : 'bg-gradient-to-br from-warm to-warm/80 text-background shadow-lg shadow-warm/30 hover:scale-105 hover:shadow-warm/50'
          }`}
        >
          {isPlaying ? (
            <Pause size={22} fill="currentColor" />
          ) : (
            <Play size={22} fill="currentColor" className="ml-1" />
          )}
        </button>

        {/* 트랙 카운트 */}
        <div className="flex flex-1 gap-1 justify-end items-center min-w-0">
          <span className="text-xs text-text-muted">{ALL_CHANNELS.length + 1} sources</span>
        </div>
      </div>
    </section>
  )
}
