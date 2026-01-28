# 🏘️ Lofi Village

> 집중과 휴식을 도와주는 아늑한 Lofi 사운드 믹서 & 마을 꾸미기 앱

![App Screenshot](./docs/images/screenshot-main.png)

## ✨ 주요 기능

### 🎵 사운드 믹서

여러 앰비언트 사운드를 조합하여 나만의 집중 환경을 만들어보세요.

- Lofi 비트, 빗소리, 모닥불, 카페 소음 등
- 개별 볼륨 조절 및 믹싱
- 원클릭 재생/정지

### ⏱️ 포모도로 타이머

집중과 휴식 사이클을 관리하세요.

- 60분 집중 / 10분 휴식 사이클
- 시각적 프로그레스 링
- 세션 완료 시 코인 보상

### 🏘️ 마을 꾸미기

집중한 시간만큼 코인을 모아 마을을 성장시키세요.

- 타일, 자연물, 건물, 유닛 배치
- 레이어 기반 맵 시스템
- 다양한 중세 테마 에셋

### 🥠 포츈 쿠키

매일 새로운 동기부여 메시지를 받아보세요.

### 📝 할 일 목록

오늘의 목표를 설정하고 완료해 나가세요.

---

## 📸 스크린샷

|                    사운드 믹서                     |                    타이머                    |                       마을                       |
| :------------------------------------------------: | :------------------------------------------: | :----------------------------------------------: |
| ![Sound Mixer](./docs/images/screenshot-mixer.png) | ![Timer](./docs/images/screenshot-timer.png) | ![Village](./docs/images/screenshot-village.png) |

---

## 🛠️ 기술 스택

- **Framework**: [Electron](https://www.electronjs.org/) + [React](https://react.dev/)
- **Build Tool**: [electron-vite](https://electron-vite.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: TypeScript
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 시작하기

### 요구사항

- Node.js 18.0.0 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/lofi-village.git
cd lofi-village

# 의존성 설치
npm install

# 개발 모드 실행
npm run dev
```

### 빌드

```bash
# 프로덕션 빌드
npm run build
```

---

## 📁 프로젝트 구조

```
lofi-village/
├── electron/           # Electron 메인/프리로드 프로세스
│   ├── main.ts
│   └── preload.ts
├── src/
│   ├── components/     # React 컴포넌트
│   │   ├── features/   # 기능별 컴포넌트
│   │   └── layout/     # 레이아웃 컴포넌트
│   ├── contexts/       # React Context
│   ├── hooks/          # 커스텀 훅
│   └── index.css       # 전역 스타일 & 테마
├── public/
│   └── map/            # 마을 타일맵 에셋
└── package.json
```

---

## 🎨 테마

현재 **Cozy Morning Cafe** 테마가 적용되어 있습니다.

- 밝고 따뜻한 크림색 배경
- 테라코타 오렌지 액센트
- 자연스러운 그린 포인트

---

## 📄 라이선스

MIT License

---

## 🙏 크레딧

- 사운드: [Pixabay](https://pixabay.com/) (무료 상업용 라이선스)
- 타일맵 에셋: [Kenney](https://www.kenney.nl/) CC0 라이선스

---

<p align="center">
  Made with ☕ and 🎵
</p>
