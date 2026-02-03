/**
 * 알림 기능을 위한 React 훅
 */

import { useCallback, useEffect, useState, useRef } from 'react'
import {
  sendAlert,
  initNotificationService,
  ttsService,
  notificationService,
  NotificationActionId,
  type NotificationType,
  type TTSOptions,
  type NotificationActionIdType
} from '@/services/notification'

// 액션 핸들러 타입
export type NotificationActionHandler = (actionId: NotificationActionIdType | string) => void

interface UseNotificationOptions {
  onAction?: NotificationActionHandler
}

interface UseNotificationReturn {
  // 상태
  isReady: boolean
  ttsEnabled: boolean
  notificationEnabled: boolean

  // 타이머 알림
  notifyFocusComplete: () => Promise<void>
  notifyBreakComplete: () => Promise<void>

  // 일반 알림 (캘린더 등에서 사용)
  notify: (title: string, body: string, ttsText?: string) => Promise<void>

  // 설정
  setTTSEnabled: (enabled: boolean) => void
  setNotificationEnabled: (enabled: boolean) => void
  setTTSOptions: (options: Partial<TTSOptions>) => void

  // 액션 ID 상수 (편의용)
  ActionId: typeof NotificationActionId
}

export function useNotification(options: UseNotificationOptions = {}): UseNotificationReturn {
  const { onAction } = options

  const [isReady, setIsReady] = useState(false)
  const [ttsEnabled, setTTSEnabled] = useState(true)
  const [notificationEnabled, setNotificationEnabled] = useState(true)

  const onActionRef = useRef(onAction)
  onActionRef.current = onAction

  // 초기화 및 알림 액션 이벤트 리스너 등록
  useEffect(() => {
    initNotificationService().then(() => {
      setIsReady(true)
    })

    // 알림 클릭/액션 이벤트 리스너
    const cleanup = notificationService.onClicked((data) => {
      onActionRef.current?.(data.action as NotificationActionIdType)
    })

    return cleanup
  }, [])

  // TTS 활성화 상태 동기화
  useEffect(() => {
    ttsService.setEnabled(ttsEnabled)
  }, [ttsEnabled])

  // 알림 활성화 상태 동기화
  useEffect(() => {
    notificationService.setEnabled(notificationEnabled)
  }, [notificationEnabled])

  // 집중 완료 알림
  const notifyFocusComplete = useCallback(async () => {
    await sendAlert({ type: 'focus-complete' })
  }, [])

  // 휴식 완료 알림
  const notifyBreakComplete = useCallback(async () => {
    await sendAlert({ type: 'break-complete' })
  }, [])

  // 일반 알림 (캘린더 연동 등에서 사용)
  const notify = useCallback(async (title: string, body: string, ttsText?: string) => {
    await sendAlert({
      type: 'calendar-reminder',
      customMessage: {
        title,
        body,
        ttsText: ttsText || body
      }
    })
  }, [])

  // TTS 옵션 설정
  const setTTSOptions = useCallback((options: Partial<TTSOptions>) => {
    ttsService.setOptions(options)
  }, [])

  return {
    isReady,
    ttsEnabled,
    notificationEnabled,
    notifyFocusComplete,
    notifyBreakComplete,
    notify,
    setTTSEnabled,
    setNotificationEnabled,
    setTTSOptions,
    ActionId: NotificationActionId
  }
}
