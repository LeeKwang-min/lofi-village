/**
 * 알림 메시지 상수
 * 타이머, 캘린더 등 다양한 알림에서 사용할 메시지들을 관리합니다.
 */

export type NotificationType = 'focus-complete' | 'break-complete' | 'calendar-reminder' | 'schedule-complete'

// 알림 액션 ID 상수
export const NotificationActionId = {
  START_BREAK: 'start-break',
  EXTEND_FOCUS: 'extend-focus',
  START_FOCUS: 'start-focus',
  SNOOZE: 'snooze',
  DISMISS: 'dismiss'
} as const

export type NotificationActionIdType = typeof NotificationActionId[keyof typeof NotificationActionId]

export interface NotificationAction {
  id: NotificationActionIdType | string
  label: string
}

export interface NotificationMessage {
  title: string
  body: string
  ttsText: string
}

// 타입별 알림 액션 버튼 정의
export const NOTIFICATION_ACTIONS: Record<NotificationType, NotificationAction[]> = {
  'focus-complete': [
    { id: NotificationActionId.START_BREAK, label: '휴식 시작' },
    { id: NotificationActionId.EXTEND_FOCUS, label: '5분 연장' }
  ],
  'break-complete': [
    { id: NotificationActionId.START_FOCUS, label: '집중 시작' },
    { id: NotificationActionId.SNOOZE, label: '5분 더 쉬기' }
  ],
  'calendar-reminder': [
    { id: NotificationActionId.SNOOZE, label: '5분 후 알림' },
    { id: NotificationActionId.DISMISS, label: '확인' }
  ],
  'schedule-complete': [
    { id: NotificationActionId.START_BREAK, label: '다음 일정 시작' },
    { id: NotificationActionId.DISMISS, label: '확인' }
  ]
}

// 집중 완료 메시지 (5개)
export const FOCUS_COMPLETE_MESSAGES: NotificationMessage[] = [
  {
    title: '집중 완료! 🎉',
    body: '훌륭해요! 잠시 휴식을 취하세요.',
    ttsText: '수고하셨습니다! 잠시 휴식을 취해보세요.'
  },
  {
    title: '집중 완료! ✨',
    body: '대단해요! 스트레칭 시간이에요.',
    ttsText: '잘 하셨어요! 기지개를 펴고 스트레칭을 해주세요.'
  },
  {
    title: '집중 완료! 💪',
    body: '목표 달성! 물 한 잔 어때요?',
    ttsText: '집중 시간이 끝났습니다. 물 한 잔 마시며 쉬어가세요.'
  },
  {
    title: '집중 완료! 🌟',
    body: '멋져요! 눈의 피로를 풀어주세요.',
    ttsText: '수고 많으셨어요! 잠시 눈을 감고 휴식해보세요.'
  },
  {
    title: '집중 완료! 🏆',
    body: '최고예요! 휴식도 실력이에요.',
    ttsText: '훌륭합니다! 충분한 휴식으로 다음 집중을 준비하세요.'
  }
]

// 휴식 완료 메시지 (5개)
export const BREAK_COMPLETE_MESSAGES: NotificationMessage[] = [
  {
    title: '휴식 끝! 🎯',
    body: '다시 집중할 시간이에요!',
    ttsText: '휴식이 끝났습니다. 다시 집중할 시간이에요!'
  },
  {
    title: '휴식 끝! 🚀',
    body: '충전 완료! 다시 시작해볼까요?',
    ttsText: '에너지 충전 완료! 다시 힘차게 시작해볼까요?'
  },
  {
    title: '휴식 끝! 💡',
    body: '새로운 마음으로 도전하세요!',
    ttsText: '휴식이 끝났어요. 새로운 마음으로 도전해보세요!'
  },
  {
    title: '휴식 끝! ⚡',
    body: '준비되셨나요? 집중 모드 ON!',
    ttsText: '준비되셨나요? 이제 집중 모드를 시작합니다!'
  },
  {
    title: '휴식 끝! 🔥',
    body: '목표를 향해 다시 달려봐요!',
    ttsText: '충분히 쉬셨죠? 목표를 향해 다시 달려봅시다!'
  }
]

const lastIndexMap: Record<NotificationType, number> = {
  'focus-complete': -1,
  'break-complete': -1,
  'calendar-reminder': -1,
  'schedule-complete': -1
}

/**
 * 메시지 배열에서 랜덤하게 하나를 선택 (연속 중복 방지)
 */
export function getRandomMessage(type: NotificationType): NotificationMessage {
  const messages = type === 'focus-complete'
    ? FOCUS_COMPLETE_MESSAGES
    : BREAK_COMPLETE_MESSAGES

  const lastIndex = lastIndexMap[type]

  let newIndex: number;

  do {
    newIndex = Math.floor(Math.random() * messages.length)
  } while (newIndex === lastIndex)

  lastIndexMap[type] = newIndex

  return messages[newIndex]
}
