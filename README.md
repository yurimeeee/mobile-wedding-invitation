# 모바일 청첩장 빌더

드래그 앤 드롭 기반 에디터로 나만의 모바일 청첩장을 만들고, 공유하고, 참석 여부(RSVP)와 축하 메시지까지 한 번에 관리할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- **청첩장 에디터**: 템플릿을 선택하고 텍스트, 이미지, 갤러리, 지도, 음악 등 자유 요소를 드래그 앤 드롭으로 배치·편집
- **인트로 모션 & 스타일링**: 인트로 등장 애니메이션, 요소별 테두리/그림자 등 세부 스타일 옵션 지원
- **모바일 미리보기**: 실제 청첩장 화면을 실시간으로 미리 보며 편집
- **공유 & 발행**: 커스텀 슬러그로 청첩장을 발행하고 QR 코드로 공유
- **RSVP 관리**: 하객의 참석 여부를 수집하고 대시보드에서 확인
- **축하 메시지**: 하객이 남긴 축하 메시지를 실시간으로 확인
- **조회수 집계**: 발행된 청첩장의 조회수 통계 제공
- **카카오맵 연동**: 예식장 위치 안내
- **관리자 대시보드**: 사용자, 청첩장, 템플릿 관리 및 통계(차트) 확인

## 기술 스택

- **프레임워크**: Next.js 16 (App Router), React 19, TypeScript
- **스타일링**: Tailwind CSS 4, Radix UI, shadcn/ui 스타일 컴포넌트
- **에디터/캔버스**: Konva(react-konva), @dnd-kit
- **애니메이션**: Framer Motion
- **백엔드/DB**: Firebase (Auth, Firestore), firebase-admin
- **폼/검증**: react-hook-form, zod
- **배포**: Vercel

## 프로젝트 구조

```
app/
  page.tsx                 # 랜딩 페이지
  login/, signup/          # 사용자 인증
  dashboard/                # 내 청첩장 목록/관리
  editor/[id]/              # 청첩장 에디터
  invitation/[id]/           # 발행된 청첩장 뷰
  admin/                     # 관리자 대시보드
  api/                       # API 라우트 (조회수, 슬러그 조회/중복확인 등)
components/
  dashboard/, editor/, invitation/, admin/  # 기능별 UI 컴포넌트
  ui/                        # 공통 UI 컴포넌트
lib/
  firebase.ts, firebase-admin.ts             # Firebase 초기화
  invitation-service.ts, rsvp-service.ts,
  message-service.ts, custom-element-service.ts  # 도메인 서비스 레이어
  types.ts                    # 공통 타입 정의
firestore.rules              # Firestore 보안 규칙
```

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 값을 채워주세요.

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_KAKAO_MAP_API_KEY=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 스크립트

| 명령어       | 설명                     |
| ------------ | ------------------------ |
| `pnpm dev`   | 개발 서버 실행           |
| `pnpm build` | 프로덕션 빌드            |
| `pnpm start` | 프로덕션 서버 실행       |
| `pnpm lint`  | ESLint 검사              |

## 배포

Vercel을 통해 배포됩니다. Firebase 프로젝트 및 환경 변수가 Vercel 프로젝트 설정에도 동일하게 등록되어 있어야 합니다.
