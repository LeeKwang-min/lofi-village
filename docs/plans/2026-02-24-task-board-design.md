# Task Board 설계 문서

## 개요
"오늘의 할 일" 기능을 "할 일 목록"으로 확장. 단순 체크리스트에서 칸반 스타일 3-섹션 보드로 전환하고, DnD와 투두별 메모 기능을 추가한다.

## 요구사항
1. "오늘의 할 일" → "할 일 목록" 명칭 변경
2. 미완료 / 진행중 / 완료 3개 섹션으로 분리
3. DnD로 섹션 간 이동 + 섹션 내 순서 변경
4. 투두별 디스크립션/메모 편집 (인라인 확장 방식)

## 데이터 모델

```typescript
type TaskStatus = 'todo' | 'in-progress' | 'done'

interface Task {
  id: string
  text: string
  status: TaskStatus
  description: string
  createdAt: number
  updatedAt: number
}
```

**마이그레이션**: 기존 `completed: true` → `status: 'done'`, `completed: false` → `status: 'todo'`. `description` 빈 문자열, `updatedAt = createdAt` 기본값.

**저장소 키**: `'lofi-village-tasks'` 유지.

## 상태 관리

**TaskContext** 신규 생성 (EventContext 패턴 따름):

```
TaskContext
├── tasks: Task[]
├── addTask(text: string): void
├── updateTask(id: string, updates: Partial<Task>): void
├── deleteTask(id: string): void
├── moveTask(id: string, newStatus: TaskStatus): void
├── reorderTask(id: string, targetStatus: TaskStatus, newIndex: number): void
└── getTasksByStatus(status: TaskStatus): Task[]
```

**멀티 윈도우 동기화**: `StorageEvent` + `focus` 이벤트.

## DnD 구현

**라이브러리**: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`

- `DndContext`: TaskBoard 최상위에서 감싸기
- `SortableContext`: 각 섹션별 정렬 컨텍스트
- `useSortable`: 개별 TaskItem에 적용
- `DragOverlay`: 드래그 중 미리보기

## UI 레이아웃

### SubWindow (standalone) - 세로 칸반
```
┌──────────────────────────────┐
│  📋 할 일 목록          [✕]  │
├──────────────────────────────┤
│  [+ 새 할 일 추가...]        │
├──────────────────────────────┤
│  ○ 미완료 (N)                │  ← 접기/펼치기
│  │ Task A               ▼   │  ← DnD 가능
│  │ Task B               ▼   │
│                              │
│  ◐ 진행중 (N)                │
│  │ Task C               ▼   │
│  │   메모: ...              │  ← 인라인 확장
│                              │
│  ● 완료 (N)                  │
│  │ ✓ Task D             ▼   │  ← 취소선
└──────────────────────────────┘
```

### 메인 앱 (isStandalone=false)
- 컴팩트 카드, `미완료 N | 진행중 N | 완료 N` 요약 표시

### 인터랙션
- 새 할 일: 항상 "미완료" 섹션에 추가
- DnD: 섹션 간 이동 시 `status` 자동 변경
- 상태 아이콘 클릭: 미완료 → 진행중 → 완료 순환
- 항목 클릭: 인라인 메모 확장/접기 (textarea)
- 삭제: 확장 영역 내 삭제 버튼

## SubWindow 설정 변경
- 타이틀: "오늘의 할 일" → "할 일 목록"
- 크기: 400x500 → 480x600

## 파일 구조

### 신규
```
src/contexts/TaskContext.tsx
src/components/features/tasks/TaskBoard.tsx
src/components/features/tasks/TaskSection.tsx
src/components/features/tasks/TaskItem.tsx
```

### 수정
```
src/components/features/tasks/TaskList.tsx
src/App.tsx
electron/main.ts
src/components/features/quick-actions/QuickActions.tsx
```

### 패키지
```
@dnd-kit/core
@dnd-kit/sortable
@dnd-kit/utilities
```
