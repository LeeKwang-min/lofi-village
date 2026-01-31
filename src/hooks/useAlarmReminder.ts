/**
 * 알람 리마인더 훅
 * 매 분마다 알람을 체크하고 알림을 보냄
 */

import { useEffect, useRef } from 'react'
import { useAlarmContext } from '@/contexts/AlarmContext'
import { isAlarmActiveToday, formatAlarmTime } from '@/types/alarm'

export function useAlarmReminder() {
  const { alarms, markAsTriggered } = useAlarmContext()
  const lastCheckRef = useRef<string>('')

  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      // 같은 분에 중복 체크 방지
      if (lastCheckRef.current === currentTime) return
      lastCheckRef.current = currentTime

      // 오늘 활성화된 알람들 중 현재 시간과 일치하는 알람 찾기
      alarms.forEach((alarm) => {
        if (!isAlarmActiveToday(alarm)) return
        if (alarm.time !== currentTime) return

        // 이미 오늘 트리거된 알람인지 확인 (1분 이내)
        if (alarm.lastTriggered) {
          const timeSinceTriggered = Date.now() - alarm.lastTriggered
          if (timeSinceTriggered < 60 * 1000) return
        }

        // 알람 트리거
        triggerAlarm(alarm.label || '알람', alarm.time, alarm.useTTS)
        markAsTriggered(alarm.id)
      })
    }

    // 즉시 한 번 체크
    checkAlarms()

    // 10초마다 체크 (정확한 분 체크를 위해)
    const interval = setInterval(checkAlarms, 10 * 1000)

    return () => clearInterval(interval)
  }, [alarms, markAsTriggered])
}

/**
 * 알람 트리거
 */
function triggerAlarm(label: string, time: string, useTTS: boolean) {
  const formattedTime = formatAlarmTime(time)
  const message = label ? `${label} - ${formattedTime}` : `알람 - ${formattedTime}`

  // 시스템 알림
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('⏰ 알람', {
      body: message,
      icon: '/alarm-icon.png',
      tag: `alarm-${time}`,
      requireInteraction: true
    })
  }

  // Electron 알림
  if (window.notificationAPI) {
    window.notificationAPI.show({
      title: '⏰ 알람',
      body: message
    })
  }

  // TTS
  if (useTTS && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(
      label ? `${label} 알람입니다` : `${formattedTime} 알람입니다`
    )
    utterance.lang = 'ko-KR'
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // 한국어 음성 선택
    const voices = window.speechSynthesis.getVoices()
    const koreanVoice = voices.find((v) => v.lang.includes('ko'))
    if (koreanVoice) {
      utterance.voice = koreanVoice
    }

    window.speechSynthesis.speak(utterance)
  }
}
