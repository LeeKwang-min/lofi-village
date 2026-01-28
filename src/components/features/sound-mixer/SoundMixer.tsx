import { Play, Pause, Volume2 } from 'lucide-react'
import { useSoundMixer, SoundChannel } from '@/hooks/useSoundMixer'

// 사운드 채널 정의
// 테스트용 무료 오디오 URL (나중에 로컬 파일로 교체 가능)
// 출처: Pixabay (무료 상업용 가능)
const SOUND_CHANNELS: SoundChannel[] = [
  {
    id: 'lofi',
    name: 'Lofi',
    emoji: '🎹',
    src: 'https://cdn.pixabay.com/audio/2024/11/01/audio_febc508c96.mp3'
  },
  {
    id: 'rain',
    name: 'Rain',
    emoji: '🌧️',
    src: 'https://cdn.pixabay.com/audio/2022/05/31/audio_1c08d20d1a.mp3'
  },
  {
    id: 'fire',
    name: 'Fire',
    emoji: '🔥',
    src: 'https://cdn.pixabay.com/audio/2024/06/19/audio_92efdd5219.mp3'
  },
  {
    id: 'cafe',
    name: 'Cafe',
    emoji: '☕',
    src: 'https://cdn.pixabay.com/audio/2024/02/14/audio_de23a6eff6.mp3'
  }
]

interface SoundChannelCardProps {
  channel: SoundChannel
  isActive: boolean
  volume: number
  isPlaying: boolean
  onToggle: () => void
  onVolumeChange: (volume: number) => void
}

function SoundChannelCard({
  channel,
  isActive,
  volume,
  isPlaying,
  onToggle,
  onVolumeChange
}: SoundChannelCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl transition-all duration-200 ${
        isActive
          ? 'border-2 border-warm/50 bg-warm/20'
          : 'border-2 border-transparent bg-background/50 hover:border-surface-hover hover:bg-surface-hover'
      }`}
    >
      {/* 클릭 영역 - 토글 */}
      <button onClick={onToggle} className="flex flex-col gap-1 items-center p-3 pb-2 w-full">
        <div className="relative">
          <span className="text-2xl">{channel.emoji}</span>
          {/* 재생 중 인디케이터 */}
          {isActive && isPlaying && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </div>
        <span className={`text-xs font-medium ${isActive ? 'text-warm' : 'text-text-secondary'}`}>
          {channel.name}
        </span>
        {/* 활성화 상태 표시 */}
        <span className={`text-[10px] ${isActive ? 'text-warm/70' : 'text-text-muted'}`}>
          {isActive ? '믹스에 추가됨' : '클릭하여 추가'}
        </span>
      </button>

      {/* 볼륨 슬라이더 - 활성화된 경우에만 표시 */}
      {isActive && (
        <div className="flex gap-2 items-center px-3 pb-3">
          <Volume2 size={12} className="flex-shrink-0 text-warm/70" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-surface [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-warm"
          />
          <span className="w-6 text-right text-[10px] text-warm/70">
            {Math.round(volume * 100)}
          </span>
        </div>
      )}
    </div>
  )
}

export function SoundMixer() {
  const { activeSounds, volumes, isPlaying, toggleSound, setVolume, togglePlayback, isActive } =
    useSoundMixer(SOUND_CHANNELS)

  const activeCount = activeSounds.size

  return (
    <section className="p-4 rounded-xl border border-surface-hover/50 bg-surface/50">
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2 items-center">
          <span className="text-xl">🎵</span>
          <h2 className="text-sm font-semibold text-text-primary">사운드 믹서</h2>
        </div>
        {activeCount > 0 && (
          <span className="rounded-full bg-warm/10 px-2 py-0.5 text-xs text-warm">
            {activeCount}개 활성
          </span>
        )}
      </div>

      {/* 사운드 채널 그리드 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {SOUND_CHANNELS.map((channel) => (
          <SoundChannelCard
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

      {/* 전역 재생 컨트롤 */}
      <div className="pt-3 border-t border-surface-hover">
        <button
          onClick={togglePlayback}
          disabled={activeCount === 0}
          className={`flex w-full items-center justify-center gap-2 rounded-lg p-3 font-medium transition-all ${
            activeCount === 0
              ? 'cursor-not-allowed bg-surface/50 text-text-muted'
              : isPlaying
                ? 'bg-warm/20 text-warm hover:bg-warm/30'
                : 'bg-cool/20 text-cool hover:bg-cool/30'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause size={18} />
              <span className="text-sm">일시정지</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span className="text-sm">
                {activeCount === 0 ? '사운드를 추가하세요' : '재생하기'}
              </span>
            </>
          )}
        </button>
      </div>
    </section>
  )
}
