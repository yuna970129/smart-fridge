# 냉장고를 부탁해 🧊

> 냉장고 재고 관리 + 한식 레시피 추천 웹앱 — **"산 것뿐 아니라 먹은 것까지"** 저마찰로 추적하는 자기교정 재고 시스템.
>
> 기획 문서: [`PLAN.kr.md`](./PLAN.kr.md)

이 저장소는 `PLAN.kr.md`의 기능 전체를 **확장 가능(scalable)** 하게 구현할 수 있는 골격 위에,
해커톤 MVP(P0~P2 핵심)를 동작하는 형태로 구현한 것입니다.

- **백엔드**: FastAPI + SQLAlchemy + SQLite (→ PostgreSQL 이관 가능)
- **프론트**: React + Vite + Tailwind (모바일 앱 프레임)
- **LLM**: Azure OpenAI (인증 주입 전까지는 **mock provider**로 완전 오프라인 동작)
- **영수증**: **LLM 비전 단독** 구현 + CLOVA OCR 하이브리드 자리(스텁)만 열어둠
- **레시피**: **LLM 생성** 우선 + **시드 DB 큐레이션** 병행 (hybrid 기본값)

---

## ⚡ 빠른 시작

사전 준비: Python 3.11+ (권장 3.12, `uv`), Node 18+ (`npm`).

```bash
# 1) 백엔드 (포트 8000)
cd backend
uv venv --python 3.12 .venv
source .venv/bin/activate
uv pip install -e .
uvicorn app.main:app --reload          # http://127.0.0.1:8000/docs

# 2) 프론트 (포트 5173) — 새 터미널
cd frontend
npm install
npm run dev                            # http://localhost:5173
```

> Azure 인증이 없어도 됩니다. 기본 `LLM_PROVIDER=mock`이라 영수증/소비/추천이 **데모용 한국어 더미 데이터**로 즉시 동작합니다.

또는 루트에서 `make install` → `make backend` / `make frontend`.

---

## ❓ "LLM 비전 단독 vs CLOVA OCR 하이브리드 — 호환 가능한가?" → **예, 가능합니다**

두 방식 모두 **동일한 `ReceiptParser` 인터페이스**를 구현하고 **동일한 `ReceiptParseResult` 스키마**를 반환하므로,
교체·심지어 앙상블까지 설정 한 줄로 가능합니다. (코드: `backend/app/providers/receipt/`)

```
llm_vision    : 이미지 ──(LLM 비전)──▶ 구조화 JSON          ← 지금 구현됨 (기본값)
clova_hybrid  : 이미지 ──(CLOVA OCR)──▶ 텍스트 ──(LLM 정규화)──▶ 구조화 JSON   ← 스텁(문서화된 확장점)
```

- 지금은 **LLM 비전 단독**만 구현 (`RECEIPT_PARSER=llm_vision`).
- 나중에 한국어 영수증 정확도가 필요하면 `CLOVA_OCR_*` 환경변수를 채우고
  `ClovaHybridReceiptParser._ocr()`만 구현하면 됩니다. **다운스트림(서비스/API/프론트) 변경 0.**

---

## 🔌 Azure OpenAI 연결 (나중에)

`backend/.env`를 만들고(없으면 `.env.example` 복사) 값을 채운 뒤 서버 재시작:

```bash
cp backend/.env.example backend/.env
```

```dotenv
LLM_PROVIDER=azure_openai
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_API_VERSION=2024-08-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4o          # 멀티모달(비전) 배포명
```

> 자격증명이 비어 있으면 자동으로 mock으로 폴백하고 경고만 남깁니다(데모가 멈추지 않음).
> `GET /health`로 현재 어떤 provider가 활성인지 확인할 수 있습니다.

### 프로바이더 스위치 (env 한 줄로 교체)

| 변수 | 값 | 설명 |
|---|---|---|
| `LLM_PROVIDER` | `mock`(기본) / `azure_openai` | LLM 벤더 |
| `RECEIPT_PARSER` | `llm_vision`(기본) / `clova_hybrid` | 영수증 파서 |
| `RECIPE_SOURCE` | `hybrid`(기본) / `llm_gen` / `seed_db` | 레시피 소스 |

---

## 🏗️ 아키텍처 (확장 포인트 = "seam")

```
backend/app/
├─ core/          설정·DB·시계·로깅·상수
├─ models/        SQLAlchemy ORM (PLAN §5-2 스키마 그대로)
├─ schemas/       Pydantic DTO + 프로바이더 계약(vendor-neutral)
├─ providers/                     ← 교체 가능한 외부 의존 "seam"
│  ├─ llm/        LLMProvider  (azure_openai | mock)        ← 벤더 seam
│  ├─ receipt/    ReceiptParser(llm_vision | clova_hybrid)  ← 영수증 seam
│  └─ recipe/     RecipeSource (seed_db | llm_gen | hybrid) ← 레시피 seam
├─ services/      비즈니스 로직 (재고/소비/추천/리포트/만료/정규화)
├─ api/           FastAPI 라우터
└─ seed/          한식 레시피 23종 + 식재료/별칭 마스터 (멱등 로더)
```

핵심 설계(PLAN §5-1): **`inventory_items`(현재 재고 projection)** + **`inventory_events`(append-only 로그)**.
모든 변동이 이벤트로 남아 "자기교정 추정치"와 낭비/절약 리포트의 근거가 됩니다.

자세한 백엔드 설명: [`backend/README.md`](./backend/README.md)

---

## 🧪 데모 시나리오 (PLAN §8)

1. **영수증 탭** → 사진 업로드 → 두부·대파·된장·계란·라면·우유 자동 등록 (별칭 정규화: `햇대파→대파`, `특란10구→계란`).
2. **추천 탭** → 임박 재료(예: 대파 D-1) 우선 레시피, 보유/부족 재료 표시.
3. **"만들었어요"** → 레시피 재료 자동 차감(토스트 피드백).
4. **먹기 탭** → 음성/텍스트: *"라면에 계란 넣어 먹었어"* → 계란·라면 차감. (음식 사진도 가능)
5. **리포트 탭** → 이번 주 절약/폐기 금액.

---

## 📡 주요 API

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/receipts/upload` | 영수증 이미지 → 파싱 → 재고 추가 |
| GET | `/api/inventory` | 재고 목록(임박/D-day 포함) |
| GET | `/api/recipes/recommend` | 임박 우선 레시피 추천 + 장보기 리스트 |
| POST | `/api/recipes/made` | "만들었어요" → 자동 차감 |
| POST | `/api/consumption/text` | 자연어 소비 차감 |
| POST | `/api/consumption/photo` | 음식 사진 소비 차감 |
| GET | `/api/expiry/alerts` | "아직 있어요?" 알림 대상 |
| POST | `/api/expiry/confirm/{id}` | 단발 확인(있어요/다 썼어요) |
| POST | `/api/expiry/auto-expire` | 자동 만료 스윕 |
| GET | `/api/reports/waste-saving` | 낭비/절약 리포트 |

전체 스펙: 서버 기동 후 `http://127.0.0.1:8000/docs`.

---

## 🛠️ 개발 메모

- 백엔드 린트: `cd backend && ruff check app`
- 프론트 린트/빌드: `cd frontend && npm run lint && npm run build`
- DB 초기화: `rm backend/data/naengbu.db` (다음 기동 시 시드 자동 재생성)
