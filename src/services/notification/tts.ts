/**
 * TTS (Text-to-Speech) 서비스
 * Web Speech API를 사용한 음성 알림 기능
 */

export interface TTSOptions {
  lang?: string        // 언어 코드 (기본: 'ko-KR')
  rate?: number        // 말하기 속도 (0.1 ~ 10, 기본: 1)
  pitch?: number       // 음높이 (0 ~ 2, 기본: 1)
  volume?: number      // 볼륨 (0 ~ 1, 기본: 1)
  voiceName?: string   // 특정 음성 이름 (선택적)
}

const DEFAULT_OPTIONS: TTSOptions = {
  lang: 'ko-KR',
  rate: 1,
  pitch: 1,
  volume: 1
}

class TTSService {
  private synth: SpeechSynthesis | null = null
  private options: TTSOptions = DEFAULT_OPTIONS
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
    }
  }

  /**
   * TTS 사용 가능 여부 확인
   */
  isAvailable(): boolean {
    return this.synth !== null
  }

  /**
   * TTS 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * TTS 옵션 설정
   */
  setOptions(options: Partial<TTSOptions>): void {
    this.options = { ...this.options, ...options }
  }

  getOptions(): TTSOptions {
    return { ...this.options }
  }

  /**
   * 사용 가능한 음성 목록 가져오기
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return []
    return this.synth.getVoices()
  }

  /**
   * 한국어 음성 목록 가져오기
   */
  getKoreanVoices(): SpeechSynthesisVoice[] {
    return this.getVoices().filter(voice => voice.lang.includes('ko'))
  }

  /**
   * 텍스트를 음성으로 변환하여 재생
   */
  speak(text: string, options?: Partial<TTSOptions>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('TTS를 사용할 수 없습니다.'))
        return
      }

      if (!this.enabled) {
        resolve()
        return
      }

      // 진행 중인 음성이 있으면 취소
      this.synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      const finalOptions = { ...this.options, ...options }

      utterance.lang = finalOptions.lang || 'ko-KR'
      utterance.rate = finalOptions.rate || 1
      utterance.pitch = finalOptions.pitch || 1
      utterance.volume = finalOptions.volume || 1

      // 특정 음성 설정
      if (finalOptions.voiceName) {
        const voice = this.getVoices().find(v => v.name === finalOptions.voiceName)
        if (voice) utterance.voice = voice
      } else {
        // 한국어 음성 자동 선택
        const koreanVoice = this.getKoreanVoices()[0]
        if (koreanVoice) utterance.voice = koreanVoice
      }

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(event.error))

      this.synth.speak(utterance)
    })
  }

  /**
   * 현재 재생 중인 음성 중단
   */
  stop(): void {
    this.synth?.cancel()
  }
}

// 싱글톤 인스턴스
export const ttsService = new TTSService()
