/**
 * 메모장 컴포넌트
 * 간단한 아이디어나 메모를 기록하는 기능
 */

import { useState, useEffect, useRef } from 'react'
import { Save, Trash2, Clock } from 'lucide-react'

const STORAGE_KEY = 'lofi-village-memo'

interface MemoData {
  content: string
  updatedAt: string
}

interface MemoProps {
  isStandalone?: boolean
}

export function Memo({ isStandalone = false }: MemoProps) {
  const [content, setContent] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 데이터 로드
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data: MemoData = JSON.parse(stored)
        setContent(data.content)
        setLastSaved(new Date(data.updatedAt))
      } catch (e) {
        console.error('Failed to load memo:', e)
      }
    }
  }, [])

  // 자동 저장 (디바운스)
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (content || localStorage.getItem(STORAGE_KEY)) {
        setIsSaving(true)
        const data: MemoData = {
          content,
          updatedAt: new Date().toISOString(),
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        setLastSaved(new Date())
        setTimeout(() => setIsSaving(false), 500)
      }
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content])

  const handleClear = () => {
    if (content && confirm('메모를 모두 삭제하시겠습니까?')) {
      setContent('')
      localStorage.removeItem(STORAGE_KEY)
      setLastSaved(null)
    }
  }

  const formatLastSaved = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return '방금 전'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`

    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={`flex flex-col ${isStandalone ? 'h-full' : ''}`}>
      {/* 상태 바 */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2 items-center text-xs text-text-muted">
          {isSaving ? (
            <>
              <Save size={12} className="animate-pulse" />
              <span>저장 중...</span>
            </>
          ) : lastSaved ? (
            <>
              <Clock size={12} />
              <span>마지막 저장: {formatLastSaved(lastSaved)}</span>
            </>
          ) : (
            <span>새 메모</span>
          )}
        </div>

        {content && (
          <button
            onClick={handleClear}
            className="flex gap-1 items-center text-xs transition-colors text-text-muted hover:text-red-400"
          >
            <Trash2 size={12} />
            <span>삭제</span>
          </button>
        )}
      </div>

      {/* 메모 입력 영역 */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="아이디어, 메모, 생각을 자유롭게 적어보세요..."
        className={`w-full resize-none rounded-xl border border-surface-hover bg-background/50 p-4 text-sm text-text-primary placeholder:text-text-muted focus:border-warm/50 focus:outline-none focus:ring-1 focus:ring-warm/20 custom-scrollbar ${
          isStandalone ? 'flex-1' : 'h-48'
        }`}
      />

      {/* 글자 수 */}
      <div className="mt-2 text-right text-xs text-text-muted">
        {content.length} 글자
      </div>
    </div>
  )
}
