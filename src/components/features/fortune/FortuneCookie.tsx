import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

// 포츈 쿠키 메시지들
const FORTUNE_MESSAGES = [
  '작은 진전도 진전이다. 오늘도 화이팅!',
  '지금 하는 일에 집중하면, 내일의 걱정은 사라진다.',
  '완벽하지 않아도 괜찮아. 시작이 반이야.',
  '오늘의 노력이 내일의 실력이 된다.',
  '휴식도 일의 일부야. 너무 자책하지 마.',
  '한 걸음씩, 꾸준히. 그게 비결이야.',
  '실패는 배움의 다른 이름일 뿐이야.',
  '지금 이 순간에 최선을 다하고 있다면, 그걸로 충분해.',
  '복잡한 일도 작게 나누면 할 만해진다.',
  '당신은 생각보다 더 많이 성장했어요.',
  '오늘 못 끝내도 괜찮아. 내일 다시 하면 돼.',
  '집중이 안 될 땐, 잠시 쉬어가도 좋아.',
  '매일 조금씩, 그게 큰 변화를 만든다.',
  '지금 힘들어도, 나중에 웃으며 돌아볼 거야.',
  '스스로에게 친절하게. 넌 잘하고 있어.'
]

// TODO(human): 랜덤 메시지 선택 함수 구현
// 배열에서 랜덤하게 하나의 메시지를 선택해서 반환하세요
// 힌트: Math.random()은 0~1 사이의 랜덤 숫자를 반환합니다
// Math.floor()로 소수점을 버릴 수 있어요
function getRandomMessage(): string {
  const idx = Math.floor(Math.random() * FORTUNE_MESSAGES.length)
  return FORTUNE_MESSAGES[idx]
}

// 오늘 날짜 키 생성 (YYYY-MM-DD 형식)
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

// 오늘의 메시지 가져오기 (하루 동안 유지)
function getTodaysFortune(): string {
  const todayKey = getTodayKey()
  const stored = localStorage.getItem('fortune')

  if (stored) {
    const { date, message } = JSON.parse(stored)
    if (date === todayKey) {
      return message
    }
  }

  // 새로운 날이면 새 메시지 생성
  const newMessage = getRandomMessage()
  localStorage.setItem(
    'fortune',
    JSON.stringify({
      date: todayKey,
      message: newMessage
    })
  )
  return newMessage
}

export function FortuneCookie() {
  const [message, setMessage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 컴포넌트 마운트 시 오늘의 메시지 로드
  useEffect(() => {
    setMessage(getTodaysFortune())
  }, [])

  // 새로운 메시지 뽑기 (애니메이션 포함)
  const refreshMessage = () => {
    setIsRefreshing(true)

    setTimeout(() => {
      const newMessage = getRandomMessage()
      setMessage(newMessage)

      // localStorage 업데이트
      localStorage.setItem(
        'fortune',
        JSON.stringify({
          date: getTodayKey(),
          message: newMessage
        })
      )

      setIsRefreshing(false)
    }, 300)
  }

  return (
    <section className="p-4 rounded-xl border border-surface-hover/50 bg-surface/50">
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2 items-center">
          <span className="text-xl">🥠</span>
          <h2 className="text-sm font-semibold text-text-primary">오늘의 한마디</h2>
        </div>
        <button
          onClick={refreshMessage}
          disabled={isRefreshing}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-secondary disabled:opacity-50"
          title="새로운 메시지"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <p
        className={`text-sm italic text-text-secondary transition-opacity duration-300 ${
          isRefreshing ? 'opacity-0' : 'opacity-100'
        }`}
      >
        &quot;{message}&quot;
      </p>
    </section>
  )
}
