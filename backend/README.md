# 냉장고를 부탁해 — Backend (FastAPI)

자기교정 재고 + 한식 레시피 추천 API. 설계 원칙과 확장 포인트 설명.

## 실행

```bash
uv venv --python 3.12 .venv && source .venv/bin/activate
uv pip install -e .
uvicorn app.main:app --reload   # http://127.0.0.1:8000/docs
```

기동 시 `lifespan`에서 테이블 생성 + 시드(식재료/별칭/레시피)를 멱등 로드합니다.

## 레이어

| 레이어 | 책임 |
|---|---|
| `core/` | 설정(`config`), DB 세션(`database`), 시계(`clock`), 상수(`constants`), 로깅 |
| `models/` | SQLAlchemy ORM. PLAN §5-2 스키마. `enums.py`에 도메인 상태값 |
| `schemas/` | Pydantic. API DTO + **프로바이더 계약**(`ReceiptLineItem`, `RecipeCandidate`, `ConsumptionDelta` 등) |
| `providers/` | 외부 의존 **seam** (아래) |
| `services/` | 비즈니스 로직. 얇은 라우터 / 두꺼운 서비스 |
| `api/` | FastAPI 라우터 + DI(`deps.py`) |
| `seed/` | 시드 데이터(`data.py`)와 멱등 로더(`loader.py`) |

## 프로바이더 seam (확장 가능 설계의 핵심)

세 가지 외부 의존을 추상 인터페이스 + 팩토리로 분리했습니다. **env 한 줄로 구현체를 교체**합니다.

### 1) LLM (`providers/llm/`) — 벤더 seam
- `LLMProvider.complete_json(system, user, images?, task)` 단일 프리미티브.
- 구현: `AzureOpenAIProvider`, `MockLLMProvider`(오프라인 데모용 결정론적 응답).
- `task` 힌트로 mock이 영수증/소비/사진/레시피별 적절한 더미를 반환.

### 2) 영수증 (`providers/receipt/`) — 기능 seam
- `ReceiptParser.parse(image) -> ReceiptParseResult`.
- `LLMVisionReceiptParser`(구현) / `ClovaHybridReceiptParser`(문서화된 스텁).
- **두 방식의 출력 타입이 동일** → 교체/앙상블에 다운스트림 변경 없음.

### 3) 레시피 (`providers/recipe/`) — 기능 seam
- `RecipeSource.suggest(db, available, urgent, k) -> list[RecipeCandidate]`.
- `SeedDbRecipeSource`(결정론적 자동차감) / `LlmRecipeSource`(다양성) / `HybridRecipeSource`(기본: 시드 우선, LLM 보강).

## 자기교정 재고 (PLAN §5-1)

- `InventoryItem` = 현재 재고의 빠른 조회용 **projection**.
- `InventoryEvent` = 모든 변동의 **append-only 로그**. `purchase/consume/discard/expire/adjust`.
- 리포트(`/reports/waste-saving`)는 이벤트 집계로 산출(절약=consume, 낭비=discard/expire).

## 정규화 사전 (자기개선)

`IngredientNormalizer`: ① 정확 일치 → ② 별칭 → ③ LLM 표준화 → ④ 신규 생성 + **별칭 학습**.
영수증 약어("햇대파", "특란10구")가 사용될수록 사전이 풍부해집니다.

## 린트

```bash
ruff check app
```
