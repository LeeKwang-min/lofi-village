/**
 * Event Reminder Hook
 * 일정 시작 전 알림 자동화 (간소화 버전)
 */

import { useEffect, useRef } from 'react'
import { useEventContext } from '@/contexts/EventContext'
import { EventItem, formatEventTime } from '@/types/event'

// 이미 알림을 보낸 이벤트 ID 저장 (메모리)
const notifiedEventIds = new Set<string>()

/**
 * 일정 알림 훅
 * EventContext의 일정을 모니터링하고 시작 10분 전에 알림
 */
export function useEventReminder(): void {
  const { events, reminderSettings, markAsNotified } = useEventContext()
  const eventsRef = useRef(events)
  eventsRef.current = events

  useEffect(() => {
    if (!reminderSettings.enabled) return

    const checkReminders = () => {
      const now = Date.now()
      const reminderMs = reminderSettings.minutesBefore * 60 * 1000

      eventsRef.current.forEach((event) => {
        // 이미 알림을 보냈으면 건너뛰기
        if (notifiedEventIds.has(event.id) || event.notified) return

        // 알림 시간 계산: 이벤트 시작 시간 - 현재 시간
        const timeUntilEvent = event.startTime - now

        // 10분(또는 설정된 시간) 이내이고, 아직 시작 안 했으면 알림
        if (timeUntilEvent > 0 && timeUntilEvent <= reminderMs) {
          // 중복 방지를 위해 먼저 Set에 추가
          notifiedEventIds.add(event.id)

          // 알림 발송
          showEventNotification(event, reminderSettings.minutesBefore, reminderSettings.useTTS)

          // DB에도 표시
          markAsNotified(event.id)
        }
      })
    }

    // 초기 체크
    const initialTimeout = setTimeout(checkReminders, 1000)

    // 30초마다 체크
    const interval = setInterval(checkReminders, 30 * 1000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [reminderSettings.enabled, reminderSettings.minutesBefore, reminderSettings.useTTS, markAsNotified])
}

/**
 * 이벤트 알림 표시 (시스템 기본 Notification + TTS)
 */
function showEventNotification(event: EventItem, minutesBefore: number, useTTS: boolean): void {
  const timeStr = formatEventTime(event.startTime)
  const locationStr = event.location ? `\n장소: ${event.location}` : ''

  const title = `📅 일정 알림`
  const body = `${event.title}${locationStr}\n${minutesBefore}분 후 시작 (${timeStr})`

  // 시스템 기본 Notification 사용
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, { body })
        }
      })
    }
  }

  // TTS
  if (useTTS && 'speechSynthesis' in window) {
    const ttsText = event.location
      ? `${event.title} 일정이 ${minutesBefore}분 후에 시작합니다. 장소는 ${event.location}입니다.`
      : `${event.title} 일정이 ${minutesBefore}분 후에 시작합니다.`

    const utterance = new SpeechSynthesisUtterance(ttsText)
    utterance.lang = 'ko-KR'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1

    // 기존 음성 중단 후 새 음성 재생
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }
}

export default useEventReminder
