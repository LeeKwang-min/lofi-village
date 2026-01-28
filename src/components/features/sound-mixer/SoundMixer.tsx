import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { useSoundMixer, SoundChannel } from '@/hooks/useSoundMixer'

// 사운드 채널 정의
// 음원 파일은 public/sounds/ 폴더에 저장
// 경로 예시: public/sounds/rain.mp3 → '/sounds/rain.mp3'

// 🎹 Lofi Beats - 음악 트랙
const LOFI_CHANNELS: SoundChannel[] = [
  { id: 'lofi1', name: 'Lofi Beat 1', emoji: '🎹', src: './sounds/lofi1.mp3' },
  { id: 'lofi2', name: 'Lofi Beat 2', emoji: '🎵', src: './sounds/lofi2.mp3' },
  { id: 'lofi3', name: 'Lofi Beat 3', emoji: '🎶', src: './sounds/lofi3.mp3' },
]

// 🌿 Ambient Sounds - 화이트 노이즈 (그룹별)
interface SoundGroup {
  id: string
  name: string
  emoji: string
  channels: SoundChannel[]
}

const AMBIENT_GROUPS: SoundGroup[] = [
  {
    id: 'rain',
    name: 'Rain',
    emoji: '🌧️',
    channels: [
      { id: 'rain1', name: 'Soft Rain', emoji: '🌧️', src: './sounds/rain1.mp3' },
      { id: 'rain2', name: 'Heavy Rain', emoji: '⛈️', src: './sounds/rain2.mp3' },
      { id: 'rain3', name: 'Rain Drops', emoji: '💧', src: './sounds/rain3.mp3' },
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
      { id: 'cafe4', name: 'Coffee Shop', emoji: '🏪', src: './sounds/cafe4.mp3' },
    ]
  },
  {
    id: 'fire',
    name: 'Fire',
    emoji: '🔥',
    channels: [
      { id: 'fire1', name: 'Fireplace', emoji: '🔥', src: './sounds/fire1.mp3' },
      { id: 'fire2', name: 'Campfire', emoji: '🏕️', src: './sounds/fire2.mp3' },
    ]
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    channels: [
      { id: 'forest1', name: 'Forest Birds', emoji: '🌲', src: './sounds/forest1.mp3' },
      { id: 'forest2', name: 'Forest Ambience', emoji: '🌳', src: './sounds/forest2.mp3' },
      { id: 'forest3', name: 'Forest Night', emoji: '🦉', src: './sounds/forest3.mp3' },
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
      { id: 'water4', name: 'Ocean Waves', emoji: '🐚', src: './sounds/water4.mp3' },
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
      { id: 'wind4', name: 'Howling Wind', emoji: '🍃', src: './sounds/wind4.mp3' },
    ]
  },
]

// 모든 Ambient 채널 (flat)
const AMBIENT_CHANNELS: SoundChannel[] = AMBIENT_GROUPS.flatMap(g => g.channels)

// 전체 채널 (useSoundMixer에 전달용)
const ALL_CHANNELS: SoundChannel[] = [...LOFI_CHANNELS, ...AMBIENT_CHANNELS]

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
    useSoundMixer(ALL_CHANNELS)

  const activeCount = activeSounds.size

  return (
    <section className="flex overflow-hidden flex-col rounded-xl border border-surface-hover/50 bg-surface/50">
      {/* 헤더 */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-surface-hover/50">
        <div className="flex gap-2 items-center">
          <span className="text-lg">🎧</span>
          <h2 className="text-sm font-semibold text-text-primary">Sound Mixer</h2>
        </div>
        <span className="text-xs text-text-muted">
          {activeCount > 0 ? `${activeCount}개 선택됨` : '트랙을 선택하세요'}
        </span>
      </div>

      {/* 트랙 목록 */}
      <div className="flex overflow-y-auto flex-col max-h-72 custom-scrollbar">
        {/* 🎹 Lofi Beats 섹션 */}
        <div className="sticky top-0 z-10 px-3 py-2 border-b border-surface-hover/30 bg-surface/80 backdrop-blur-sm">
          <span className="text-xs font-semibold text-warm">🎹 Lofi Beats</span>
          <span className="ml-2 text-[10px] text-text-muted">{LOFI_CHANNELS.length}곡</span>
        </div>
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

        {/* 🌿 Ambient Sounds 섹션 */}
        <div className="sticky top-0 z-10 px-3 py-2 border-y border-surface-hover/30 bg-surface/80 backdrop-blur-sm">
          <span className="text-xs font-semibold text-cool">🌿 Ambient Sounds</span>
          <span className="ml-2 text-[10px] text-text-muted">{AMBIENT_CHANNELS.length}개</span>
        </div>

        {/* 소그룹별 렌더링 */}
        {AMBIENT_GROUPS.map((group) => (
          <div key={group.id}>
            {/* 소그룹 헤더 */}
            <div className="flex items-center gap-2 px-4 py-1.5 bg-background/30">
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

      {/* 플레이어 컨트롤 바 */}
      <div className="flex gap-4 justify-between items-center px-4 py-3 border-t border-surface-hover/50 bg-background/30">
        {/* 재생 상태 표시 */}
        <div className="flex flex-1 gap-2 items-center min-w-0">
          {isPlaying && activeCount > 0 ? (
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
              {activeCount === 0 ? '트랙을 선택해주세요' : '재생 대기 중'}
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
          <span className="text-xs text-text-muted">{ALL_CHANNELS.length} tracks</span>
        </div>
      </div>
    </section>
  )
}
