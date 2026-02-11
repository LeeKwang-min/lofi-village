/**
 * 알림 서비스 통합 모듈
 * TTS, 시스템 알림, 메시지를 통합하여 제공합니다.
 */

export { ttsService, type TTSOptions } from './tts'
export {
  notificationService,
  type NotificationOptions as ElectronNotificationOptions
} from './notification'
export {
  getRandomMessage,
  FOCUS_COMPLETE_MESSAGES,
  BREAK_COMPLETE_MESSAGES,
  NOTIFICATION_ACTIONS,
  NotificationActionId,
  type NotificationType,
  type NotificationMessage,
  type NotificationAction,
  type NotificationActionIdType
} from './messages'

import { ttsService } from './tts'
import { notificationService } from './notification'
import {
  getRandomMessage,
  NOTIFICATION_ACTIONS,
  type NotificationType,
  type NotificationMessage
} from './messages'

export interface AlertOptions {
  type: NotificationType
  customMessage?: NotificationMessage
  showNotification?: boolean
  speakTTS?: boolean
  includeActions?: boolean
}

/**
 * 통합 알림 함수
 * Electron 알림과 TTS를 동시에 처리합니다.
 */
export async function sendAlert(options: AlertOptions): Promise<void> {
  const {
    type,
    customMessage,
    showNotification = true,
    speakTTS = true,
    includeActions = true
  } = options

  const message = customMessage || getRandomMessage(type)
  const actions = includeActions ? NOTIFICATION_ACTIONS[type] : undefined

  // Electron 알림 표시
  if (showNotification) {
    try {
      await notificationService.show({
        title: message.title,
        body: message.body,
        actions
      })
    } catch (error) {
      console.warn('알림 표시 실패:', error)
    }
  }

  // TTS 재생
  if (speakTTS) {
    try {
      await ttsService.speak(message.ttsText)
    } catch (error) {
      console.warn('TTS 재생 실패:', error)
    }
  }
}

/**
 * 알림 서비스 초기화
 */
export async function initNotificationService(): Promise<{
  notificationSupported: boolean
  ttsAvailable: boolean
}> {
  const ttsAvailable = ttsService.isAvailable()

  // 음성 목록 로드를 위해 잠시 대기
  if (ttsAvailable) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return {
    notificationSupported: notificationService.isAvailable(),
    ttsAvailable
  }
}
