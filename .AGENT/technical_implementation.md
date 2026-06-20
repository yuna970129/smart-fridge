# 🧊 Fridge AI | 기술 구현

**Stack**: Next.js (App Router, TS) + Supabase + Gemini API
**Deployment**: Vercel

> 📌 **구현 반영 메모 (living doc)**
> - **단일 Next.js 풀스택 앱**을 **레포 루트**에 둔다. 프론트(`app/` 화면 +
>   `components/`)와 백엔드(`app/api/` 라우트 + `lib/`)가 한 레포에 공존한다.
>   (별도 `fridge-ai/` 하위 폴더를 만들지 않음)
> - **키 없이도 실행**된다(데모 모드): Supabase 미설정 시 로컬 JSON 스토어
>   (`.data/fridge.json`), Gemini 미설정 시 결정론적 Mock AI로 폴백.
> - 영수증 스캔은 **저장하지 않고 인식만** 반환한다. 저장은 사용자가
>   "Confirm & Save" 시 `POST /api/fridge`로 수행(시나리오 일치).
> - 모델 기본값은 `gemini-2.0-flash` (`GEMINI_MODEL`로 변경 가능).

---

## 📋 체크리스트

- [x] 패키지 설치 (`@supabase/supabase-js`, `@google/generative-ai`)
- [x] `.env.example` 제공 (`.env.local`로 복사해 사용)
- [x] Supabase 테이블 스키마 정의
- [x] API 라우트 생성 (scan-receipt / check-dish / fridge / seed)
- [x] 로컬 테스트 (mock 모드 end-to-end 통과)

---

## 1️⃣ 프로젝트 구조 (레포 루트)

```
app/
  page.tsx                     # Home
  scan-receipt/page.tsx        # 업로드→로딩→결과→저장
  check-dish/page.tsx          # 업로드→로딩→체크리스트→확정
  fridge/page.tsx              # 재고 목록 + 삭제
  globals.css                  # 팔레트 + 글래스모피즘
  api/
    scan-receipt/route.ts
    check-dish/route.ts
    fridge/route.ts            # GET / POST / PATCH / DELETE
    seed/route.ts              # POST(reset+seed) / DELETE(clear)
components/                    # 재사용 UI (Button, UploadCard, ...)
lib/
  config.ts  store.ts  gemini.ts  supabase.ts
  emoji.ts   image.ts  api.ts     types.ts
```

---

## 2️⃣ 패키지 설치

```bash
npm install @supabase/supabase-js @google/generative-ai
```

---

## 3️⃣ 환경변수 설정

`.env.example` → `.env.local`로 복사. **모든 값은 선택**이며, 미설정/placeholder
(`xxx`, `your-...`)는 "없음"으로 간주되어 데모 폴백이 동작한다.

```
# Supabase (선택)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # 서버 쓰기용(권장)

# Gemini (선택)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash

# App (선택)
DEMO_USER_ID=demo-user
DATA_DIR=.data        # 읽기전용 호스트(Vercel)에서는 /tmp 권장
```

---

## 4️⃣ Supabase 테이블 생성

### Supabase SQL Editor에서 실행:

```sql
CREATE TABLE ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'demo-user',
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('have', 'gone')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_status ON ingredients(user_id, status);
```

---

## 5️⃣ 핵심 파일

### `lib/config.ts`
환경변수를 읽고 실제 키 여부(`hasSupabase`, `hasGemini`)를 판단한다.
placeholder 값은 무시하여 데모 폴백으로 전환한다.

### `lib/supabase.ts`
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
// 서비스 롤 키 우선(서버측, RLS 우회), 없으면 anon 키. 미설정 시 null 반환.
export function getSupabase(): SupabaseClient | null { /* ... */ }
```

### `lib/store.ts` — 저장소 추상화
공통 인터페이스 `FridgeStore`(`list/add/remove/setStatus/reset`)를
**SupabaseStore**(키 있을 때)와 **JsonStore**(폴백, `.data/fridge.json`)로 구현.
`add()`는 이름 기준 중복 제거 + `gone` 항목 재활성화.

### `lib/gemini.ts` — AI (실물 + Mock)
```ts
export async function analyzeReceipt(base64, mime): Promise<ScannedItem[]>;
export async function analyzeDish(base64, mime, fridgeItems): Promise<RawDishResult>;
```
키가 있으면 Gemini(`responseMimeType: application/json`) 호출, 없으면 Mock 반환
(영수증=샘플 7종, 요리=냉장고 교집합 기반 "Kimchi Jjigae" 등). 응답의 ```json```
펜스를 제거하고 파싱.

---

## 6️⃣ API 라우트

| Method | Route | Body | 설명 |
|---|---|---|---|
| POST | `/api/scan-receipt` | `{ image }` | 영수증 품목 인식 (저장 안 함) |
| POST | `/api/check-dish` | `{ image }` | 요리명 + 사용된 냉장고 품목(매칭 row) |
| GET | `/api/fridge` | `?status=have\|gone\|all` | 재고 조회 |
| POST | `/api/fridge` | `{ items:[{name,emoji}] }` | 저장(Confirm & Save) |
| PATCH | `/api/fridge` | `{ id, status }` | `gone`(Used all)/`have` 전환 |
| DELETE | `/api/fridge` | `{ id }` | 영구 삭제 |
| POST | `/api/seed` | — | 초기화 + 데모 데이터 |
| DELETE | `/api/seed` | — | 냉장고 비우기 |

`image`는 base64 data URL (`data:image/png;base64,...`).
모든 라우트는 `runtime = "nodejs"` (로컬 JSON 스토어의 `fs` 사용).

### 예: `app/api/scan-receipt/route.ts`
```ts
export async function POST(req: NextRequest) {
  const { image } = await req.json();
  const { base64, mimeType } = parseDataUrl(image);
  const items = await analyzeReceipt(base64, mimeType); // 저장하지 않음
  return NextResponse.json({ items, mock: usingMockAI });
}
```

### 예: `app/api/check-dish/route.ts`
```ts
const fridge = await getStore().list('have');
const result = await analyzeDish(base64, mimeType, fridge.map(f => f.name));
// AI가 돌려준 이름을 냉장고 row(id 포함)에 매칭해서 반환
return NextResponse.json({ dishName, ingredients: matched, mock });
```

---

## 7️⃣ 로컬 테스트

```bash
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

mock 모드 스모크 테스트(키 없이):
```bash
curl -s -XPOST localhost:3000/api/seed                       # 데모 7종
curl -s localhost:3000/api/fridge                            # 조회
curl -s -XPOST localhost:3000/api/check-dish \
  -H 'Content-Type: application/json' -d '{"image":"data:image/png;base64,..."}'
```

---

## 🎯 완료

✅ 프론트엔드(4화면) + 백엔드(API) 단일 레포
✅ Supabase 연동(+ 로컬 JSON 폴백)
✅ Gemini 통합(+ Mock 폴백)
✅ 키 없이 즉시 데모 가능 · `npm run build` 통과
