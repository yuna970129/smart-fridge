# 냉장고를 부탁해

> 냉장고 음식 관리 + 요리 추천 웹앱 (해커톤 / 웹 데모 / Python -> NextJS)

---

## 0. 한 줄 요약 (thesis)

> **"먹은 것을 '아무 언어로나' 말하면 재고에서 자동 차감되는, 다국어 음성 소비 캡처 푸드 매니저.
> BizCrush의 소음-강건 다국어 ASR(60개 언어)로 입력을 받고, 한식·한국 영수증까지 로컬라이즈한 웹앱."**

> ⚠️ 차별점은 §1 전체 참고(2026.6 재검증). "LLM 팬트리 앱"은 더 이상 신규가 아니다(§1-3, 2025–26 물결).
> 우리 자리 = **①(미개척) 먹은 것 자연어 차감 × ②다국어 음성(BizCrush) × ③한국 도메인 로컬라이즈**의 교집합.

- 개발 형태: 웹앱 (데모는 웹으로 진행)
- 주 언어: Python (백엔드)

---

## 1. 핵심 컨셉 & 차별점

> **이 섹션이 프로젝트의 심장이다.** "기능 목록"이 아니라 "왜 우리가, 왜 지금"으로 승부한다.

### 1-1. 한 줄 포지셔닝 (the wedge) — 다국어 음성 소비 캡처

> ~~"LLM만으로 소비를 잡는 건 우리뿐"~~ ← 더 이상 사실 아님(2025–26 물결, §1-3). 그래서 더 날카롭게 좁힌다:
>
> **"먹은 것을 *아무 언어로나, 시끄러운 부엌에서* 말하면 재고가 줄어든다."**
>
> - 2세대 LLM 앱들이 비워둔 **'먹은 것(소비)' 캡처**에 집중하고,
> - 그 입력을 **BizCrush의 소음-강건 다국어 ASR(60개 언어·자동 언어감지)**로 받아 → 영어·텍스트 중심 2세대가 못 하는 **다국어·음성-퍼스트**로 차별화하고,
> - **한식·한국 영수증** 도메인까지 로컬라이즈한다. (입력 = 다국어, 도메인 = 한국-퍼스트)

### 1-2. 1세대(LLM 이전): 이 카테고리는 "무덤"이다

> ⚠️ 첫 분석("경쟁사는 소비 추적을 못 한다")은 **틀렸다.** 기능은 대부분 이미 있었다.
> 진짜 사실은 더 강력하다: **온 카테고리가 그걸 하려다 죽었다.** 죽은 앱들이 곧 "이게 어렵다"는 증거다.

| 앱 | 결말 (2026.6) | "먹은 것"을 잡던 방식 | 왜 그렇게 됐나 |
|---|---|---|---|
| **Cooklist** | 소비자 앱 **단종 → B2B 피벗** | 레시피 차감 + 마트 구매내역 연동 | 리테일러 의존 자동화, 소비자 수익화 실패 |
| **Chefling** | **Smarter(프리지캠 HW)에 인수** | FoodCam(냉장고 카메라가 인식) | 하드웨어+유료 구독에 핵심 묶임 |
| **Kitche** | **Remy(AI 식단)에 인수** | 바코드/수동, 구매vs사용 추적 지향 | 단독 소비자 앱으로 지속 한계 |
| **NoWaste** | 소규모 인디 생존 | 수동 삭제 + 유통기한 알림 | 바코드·서버 신뢰성 약함(데이터 소실 리뷰) |
| **SuperCook** | 생존 (무료) | **(아예 안 잡음 — 의도적 포기)** | 비용·마찰 피하려 "레시피 매칭기"로만 |

<sub>출처: cooklist.com·grocerydive(피벗) / thespoon.tech·smarter.am(Chefling→Smarter) / tech.eu(Kitche→Remy) / justuseapp 리뷰(NoWaste 데이터 소실) / Google Play·앱리뷰(SuperCook 수량·유통기한 미추적).</sub>

### 1-3. 2세대(2025–26 LLM 네이티브): 지금 빈칸이 빠르게 메워지는 중 ⚠️

네가 던진 질문("2025 이후 LLM이 발전했는데 시도가 정말 없었나?")의 답: **있다. 그것도 많이.**
직접 사이트를 열어 실재를 확인한 신규 앱들(2025~26):

| 앱 | 무엇을 하나 | 우리와 겹침 |
|---|---|---|
| **Pantryfy** (pantryfy.ai) | "Pantryfy Agent" = 모든 화면의 AI 비서가 **채팅으로 재고 추가·식단·장보기** 후 "바뀐 것"을 보여줌, 가구를 기억 | 🔴 매우 높음 |
| **Recipy** (recipyapp.com) | **"한 문장으로"** 식단·재고→요리·장보기·주문. 웹/iOS/안드 무료 | 🔴 매우 높음 |
| **Grocery AI** (groceryai.com) | 냉장고 스캐너, Chef AI 채팅, 유통기한 알림, 영수증·레시피 임포트, 공유 | 🟠 높음 |
| **KitchenPilot** (독일) | KI 주방비서: 재고→레시피, 스마트 장보기, 임박·낭비 관리 | 🟠 높음 |
| **NoWaste.ai · Fridge2Chef · foodspai · Franken-Recipe · Crumb · Fond** | 영수증·사진→재고, 임박 우선 레시피, 일부 음성·채팅 | 🟠 중~높음 |
| **삼성 Bespoke AI 패밀리허브 + Gemini** | 냉장고 카메라가 ~50종 인식, **손글씨 라벨("Leftover Pasta June 20") 읽어 재고 입력**, 소비 패턴 추적, 임박 알림, 대화형 Bixby+Gemini, Instacart 주문 | 🔴 정면(이미 HW로 구현) |

<sub>출처: 각 공식 사이트 직접 확인(groceryai.com·pantryfy.ai·recipyapp.com·kitchenpilot.net·nowaste.ai·fridge2chef.com) / news.samsung.com·engadget·sammobile(삼성 Gemini 패밀리허브).</sub>

> **단, 남은 빈틈 2개(정직하게):**
> ① 이 물결조차 대부분 *재고 추가 + 레시피*가 중심이고, **"내가 먹은 것"을 자연어로 말해 정확히 차감**하는 건
>    아직 어느 앱도 헤드라인으로 못 박았다(Pantryfy·Recipy가 가장 근접).
> ② **전부 영어권/서구·하드웨어**다 — **한국어·한국 영수증·한식은 비어 있다.**

### 1-4. 진단: 왜 1세대는 다 죽었나 = "소비 추적"이 비쌌기 때문

근본 원인은 **소비(먹은 것) 기록의 마찰**이다. 구매와 달리 소비는 본질적으로 고마찰·저보상이다:

| 구매 | 소비 |
|---|---|
| 명확한 이벤트 1번(영수증) → 배치 입력 | 하루 종일 흩어진 여러 번 → 매번 입력 불가 |
| 정확한 수량(영수증에 찍힘) | 애매함("양파 반 개", "우유 좀") |
| 손이 비어 있음 | 요리 중이라 손이 더럽고 바쁨 |
| — | 입력해도 즉각 보상 없음 |

→ 수동 소비 입력은 **알려진 리텐션 킬러**. 재고가 어긋남 → 신뢰 상실 → 2~3주 뒤 이탈.
**그래서 "제대로" 하려면 자동화가 필요했고, 길은 둘 다 비쌌다:**
- **하드웨어 길**(카메라·센서) → Chefling이 **Smarter에 흡수**, 인식은 유료.
- **리테일러 데이터 길**(구매내역 연동) → Cooklist **B2B 피벗**, Kitche **인수**.
- 돈 안 쓰려면 **일부러 얕게** → SuperCook은 수량·유통기한을 **의도적으로 포기**.

### 1-5. 핵심 비교: 빈칸은 이제 "한국 + 소비"로 좁혀졌다 ⭐

원래 우리가 그린 그림은 "강한 소비 캡처 + 무의존" 사분면이 비어 있다는 거였다.
**2026.6 기준 그 사분면은 2세대 앱들이 빠르게 메우는 중이다.** 그래서 비교축을 한 단계 더 좁힌다 —
이제 의미 있는 축은 **"한국 네이티브냐"** vs **"소비(먹은 것) 캡처에 집중하냐"** 다.

```
            한국 미지원 / 영어권·서구·하드웨어 중심
                              │
  삼성 Gemini냉장고 ●          │     ● Pantryfy   ● Recipy
  Grocery AI ●  KitchenPilot ● │         ● Crumb
   (재고추가+레시피 중심)        │      (자연어/채팅, 무의존)
                              │
  소비 집중 ───────────────────┼─────────────────── 소비 집중
   약함                        │                    강함(먹은 것 차감)
                              │
                              │      ★ 남은 빈칸 = 우리 자리
                              │      "한국 네이티브 + 소비 캡처 집중"
                              │      (한식·한국 영수증·한국어 음성)
                              │
            한국 네이티브(한식·한국 영수증·한국어)
```

| 세대 | 대표 | 소비를 잡는 방식 | 한국 지원 |
|---|---|---|---|
| 1세대(pre-LLM) | Cooklist·Chefling·Kitche·NoWaste·SuperCook | 리테일러/HW/수동 → 비싸서 죽거나 인수 | ✗ |
| 2세대(2025–26) | Pantryfy·Recipy·Grocery AI·삼성 Gemini냉장고 | 채팅·사진·HW로 *추가+레시피* 중심 | ✗ (전부 서구/영어) |
| **우리** | — | **자연어 "먹은 것" 차감 + 사진 (LLM)** | **○ (한식·한국 영수증·한국어)** |

→ 솔직한 결론: **"LLM 팬트리 앱"은 더 이상 신규가 아니다.** 우리가 설 자리는
**①한국 로컬라이즈 + ②소비(먹은 것) 캡처 집중**이라는 더 좁은 교집합이다. 넓은 블루오션이 아니다.

### 1-6. 정직한 차별점: 좁은 교집합 — "다국어 음성으로 먹은 것 차감"

2세대 물결까지 보고 나면, 정직하게 가른다:

- ❌ **신규 아님(있어야 본전):** LLM 자연어 재고관리(Pantryfy·Recipy), "요리함→자동 차감"(Cooklist·삼성푸드), 유통기한 알림·영수증/사진 입력(2세대 다수), (영어·텍스트) 음성 입력(Crumb·SuperCook).
- ✅ **우리 차별점 = 아래 4개의 교집합:**
  1. **'먹은 것(소비)' 캡처에 집중** — "라면에 계란 넣어 먹었어"→차감. 2세대조차 *재고추가+레시피* 중심이라 여긴 미개척. **← 핵심 강점.**
  2. **다국어 음성-퍼스트 (BizCrush)** — 입력을 **소음에 강한 60개 언어 ASR**로 받음. 부엌은 시끄럽고(물·환풍기·지글지글) 가족은 **언어를 섞어 쓴다**("어제 산 cheese 먹었어") → BizCrush 강점과 정확히 맞물림. 2세대는 전부 영어·텍스트/채팅 중심.
  3. **한국 도메인 로컬라이즈** — 한식 레시피, 한국 영수증 약어 정규화("뽀로로치즈"→치즈). (언어는 다국어, 도메인은 한국)
  4. **소프트웨어-온리** — 삼성처럼 냉장고를 안 팔아도 됨. 폰/웹만으로.
- ⚠️ **냉정하게:** "블루오션"은 아니다. 하지만 **①(미개척 소비 캡처) × ②(다국어 음성)** 교집합은 비어 있고, 부엌-소음·코드스위칭이라는 *진짜 사용 맥락*에 BizCrush가 들어맞아 데모가 강하다.

### 1-7. 해자(moat)에 대한 정직한 답 — 미리 죽여둘 반론

> 심사위원 킬러 질문(이제 더 날카롭다): *"2025–26 LLM 앱이 이미 쏟아졌고 삼성도 냉장고에 Gemini 넣었는데, 너희는 뭐가 달라?"*

정직하게: **단기 해자는 얇다.** 그래서 방어선을 분명히 한다.
- **시장이 달아오른 건 호재.** 2세대 물결 + 삼성 진입 = **수요 검증**. "지금 가장 핫한 영역"이라 말할 수 있다.
- **단기 방어 = 다국어 음성(BizCrush) + 한국 도메인 + 속도.** 2세대는 영어·텍스트 중심 → 다국어·음성-퍼스트는 늦게 온다. 삼성은 고가 HW에 묶임 — 우린 폰/웹만으로.
- **장기 해자 = 데이터.** 쓸수록 "이 집의 소비 패턴·언어·별칭 사전"이 쌓여 추정이 정확해짐(네트워크 효과 후보).
- ⚠️ **그래도 사업으로는 위험.** 진입장벽이 낮아 누구나 다국어를 붙일 수 있다. 키우려면 더 좁은 니치나 독점 데이터/유통 채널이 필요.
- 📌 **심사위원 어필(정직하게):** BizCrush API는 *심사위원의 제품*이다. 단, **억지 끼워넣기가 아니라** 부엌-소음·코드스위칭이라는 실제 맥락에 맞물리는 진짜 통합 → 기술 적합성과 어필을 동시에 잡는다.

### 1-8. 이 모든 걸 떠받치는 설계 철학 — "완벽한 장부"를 포기한다 ⭐

경쟁사는 **정확한 장부를 '무료·무마찰'로 동시에** 달성하려다 실패했다. 우리는 목표를 바꾼다:

> **"완벽한 재고"가 아니라 "자기교정되는 추정치(self-correcting estimate)".**
> 사용자가 아무것도 안 해도 재고가 알아서 줄고 정리된다. 입력은 "틀린 걸 고치는 것"일 뿐, 의무가 아니다.

이러면 "매번 입력"이라는 불가능한 요구가 사라진다.
이 철학을 DB에서 구현하는 장치가 **이벤트 로그(`inventory_events`)** 다(§5 참고).

---

## 2. 사용자 플로우 (메인 루프)

```
[구매] 영수증 사진/음성  ──▶  재고 추가 (+이벤트)
                                  │
                                  ▼
[임박] 유통기한 임박 감지  ──▶  레시피 추천 (임박 재료 우선)
                                  │
              ┌───────────────────┼─────────────────────┐
              ▼                   ▼                     ▼
   "만들었어요" 탭        "아직 있어요?" 확인        그래도 침묵
   레시피 재료 자동 차감   있어요 / 다 썼어요          유통기한 경과
   (소비의 80% 해결)       단발 탭 1번                자동 만료 처리
              │                   │                     │
              └───────────────────┴─────────────────────┘
                                  ▼
                   세 갈래 모두 재고를 교정 + 낭비/절약 리포트로 환류
```

핵심: **어느 경로든 사용자 부담은 "탭 1번 이하"**. 소비 입력을 별도 의무가 아니라
추천 기능의 *부산물*로 만든다.

---

## 3. 소비 추적 4대 메커니즘 (개발 우선순위)

### 🥇 1. 레시피 완료 = 자동 차감 (테이블 스테이크스, 그래도 필수)
- 추천 요리를 **"만들었어요" 한 번 탭** → 레시피 재료를 알려진 수량대로 자동 차감.
- 사용자는 수량 입력 불필요(레시피가 "대파 1대, 두부 1모"를 이미 안다).
- ⚠️ **이미 Cooklist·삼성푸드(Whisk)·KitchenPal이 하는 기능** → 우리만의 차별점은 아니다.
  단 *앱이 추천한 끼니*만 커버하므로, 나머지 일상(ad-hoc) 소비는 3번(자연어·사진)이 보완한다.

### 🥈 2. 임박 시점 단발 확인 ("아직 있어요?")
- 연속 입력을 **중요한 순간 1번의 질문**으로 압축.
- 임박 시 푸시: "대파 내일까지예요. 아직 있나요?" → [있어요 / 다 썼어요] 두 탭.
- 평소엔 안 물어봄. 낭비 위험이 있을 때만 동기화 → 연속 문제를 이산 이벤트로 변환.

### 🥉 3. 자연어 음성/텍스트·사진 캐치올 (← 우리의 실제 차별점)
- 레시피 없이 먹은 것: "방금 라면에 계란 넣어 먹었어" → LLM이 계란 1, 라면 1 차감.
- 정형 입력 대신 말하듯이. 모호하면 LLM이 되물음("계란 몇 개요?"), 무응답 시 1개 추정.
- 파이프라인: **BizCrush ASR(다국어·소음강건)** → 텍스트 → LLM이 재료·수량 추출·차감.
- 경쟁 앱 음성은 *영어·정형 입력/추가* 위주. **다국어·소음강건 음성 → 자유로운 자연어 소비 차감**이 차별화 핵심. 부엌에서 한국어·영어 섞어 말해도 잡는다.

### 4. 자동 만료 (사용자 침묵해도 자가 정리)
- 유통기한 경과 + 확인 없음 → 자동 "소비/폐기" 처리 후 재고에서 제거.
- "폐기 추정"은 낭비 리포트로 환류("이번 주 양파 버림") → 다음엔 확인하게 만드는 동기.

---

## 4. 기술 스택 (웹 데모 기준)

해커톤 속도 + "앱처럼 보이는 웹" + Python 중심을 기준으로 선택.

| 레이어 | 1순위 (추천) | 대안 / 비고 |
|---|---|---|
| 백엔드 | **FastAPI** (Python) + Pydantic | Flask (더 단순하지만 비동기·자동문서 약함) |
| 프론트 | **Jinja2 + HTMX + Tailwind(CDN)** — 순수 Python/HTML로 SPA 느낌, 모바일 프레임 | React+Vite (프론트 인력 있을 때) / Streamlit (최速, 단 앱 느낌 약함) |
| DB | **SQLite** (제로 셋업) | 운영 시 PostgreSQL로 이관 |
| ORM | **SQLAlchemy** | 또는 raw SQL (테이블 적어 충분) |
| 영수증 OCR | **멀티모달 LLM 비전** (이미지→구조화 JSON 한 방) | Naver CLOVA OCR(한국 영수증 정확도 ↑) + LLM 정규화 |
| 음식 사진 인식 | **멀티모달 LLM 비전** (요리명 + 추정 재료) | — |
| 음성 인식(STT) | **BizCrush API** — 다국어·소음강건 ASR(60개 언어·자동 언어감지·실시간) ★핵심 강점·심사위원 제품 | 폴백: 브라우저 Web Speech API / Whisper |
| 자연어 → 재고 변동 | **LLM 구조화 출력**(JSON mode / function calling, Pydantic 스키마) | — |
| 레시피 추천 | **시드 레시피 DB + 매칭 알고리즘**(자동차감 보장) | LLM 생성으로 다양성 보강 |
| 스케줄(임박·만료) | 페이지 로드 시 체크 + **APScheduler** | 데모는 로드 시 체크만으로 충분 |

> 참고: 로컬에 고성능 GPU(RTX PRO 6000 96GB)가 있어 로컬 모델도 가능하지만,
> 해커톤 속도를 위해 **호스티드 멀티모달 LLM API**(OpenAI/Azure OpenAI/Claude/Gemini)를 1순위로 권장.
> 한국어 영수증 정확도가 관건이면 **CLOVA OCR**를 OCR 단계에만 끼워넣는 하이브리드가 안전.

**음성 파이프라인:** `BizCrush ASR(음성→텍스트, 다국어·소음강건)` → `LLM(텍스트→재료·수량 구조화)` → `재고 차감 이벤트`. 역할 분리가 깔끔하다(BizCrush=듣기, LLM=이해).

**웹 데모에서 "푸시 알림"은** 실제 푸시 대신 화면 상단 **알림 패널/배너**로 시뮬레이션한다.

---

## 5. 데이터베이스 설계

### 5-1. 설계 철학
- **`inventory_items`** = 현재 재고(빠른 조회용 projection).
- **`inventory_events`** = 모든 변동의 append-only 로그 = **"자기교정 추정치"의 실체이자 낭비/절약 리포트의 원천**.
- **`ingredients` + `ingredient_aliases`** = 정규화 사전("뽀로로치즈" → "치즈", "햇대파" → "대파").
- **`recipe_ingredients`** = "만들었어요 → 자동 차감"의 근거 데이터.

### 5-2. 스키마 (SQLite 기준)

```sql
-- 사용자 (데모는 1명이어도 확장 대비)
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 식재료 마스터 (정규화 사전)
CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY,
  canonical_name TEXT NOT NULL UNIQUE,   -- "대파"
  category TEXT,                          -- 채소/육류/유제품...
  default_unit TEXT,                      -- 대/개/모/g/ml
  default_shelf_life_days INTEGER,        -- 영수증에 유통기한 없을 때 추정용
  avg_price INTEGER                       -- 낭비/절약 ₩ 추정용 (선택)
);

-- 영수증 약어·별칭 → canonical 매핑
CREATE TABLE ingredient_aliases (
  id INTEGER PRIMARY KEY,
  ingredient_id INTEGER REFERENCES ingredients(id),
  alias TEXT NOT NULL                     -- "뽀로로치즈", "햇대파"
);

-- 현재 재고 (events의 projection; 빠른 조회용)
CREATE TABLE inventory_items (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  ingredient_id INTEGER REFERENCES ingredients(id),
  quantity REAL,                          -- 현재 추정 수량
  unit TEXT,
  purchased_at TEXT,
  expires_at TEXT,                        -- 유통기한 (추정 가능)
  status TEXT DEFAULT 'active',           -- active/consumed/expired/discarded
  source TEXT,                            -- receipt/voice/photo/manual
  last_confirmed_at TEXT,                 -- "아직 있어요?" 확인 시각
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 재고 변동 이벤트 로그 (append-only; 자기교정 + 리포트의 핵심) ⭐
CREATE TABLE inventory_events (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  inventory_item_id INTEGER REFERENCES inventory_items(id),
  ingredient_id INTEGER REFERENCES ingredients(id),
  event_type TEXT NOT NULL,               -- purchase/consume/discard/expire/adjust
  quantity_delta REAL,                    -- +구매 / -소비
  unit TEXT,
  source TEXT,                            -- receipt/voice/photo/recipe/system/manual
  ref_type TEXT,                          -- recipe/receipt/...
  ref_id INTEGER,                         -- 원인이 된 recipe_id 등
  raw_input TEXT,                         -- 원문 "라면에 계란 넣어 먹었어"
  est_value INTEGER,                      -- ₩ (절약/낭비 집계용)
  created_at TEXT DEFAULT (datetime('now'))
);

-- 레시피 마스터
CREATE TABLE recipes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  cuisine TEXT,                           -- 한식/양식/일식...
  instructions TEXT,
  image_url TEXT,
  cook_minutes INTEGER
);

-- 레시피 재료 ("만들었어요" → 자동 차감의 근거)
CREATE TABLE recipe_ingredients (
  id INTEGER PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id),
  ingredient_id INTEGER REFERENCES ingredients(id),
  quantity REAL,
  unit TEXT,
  is_essential INTEGER DEFAULT 1          -- 1=필수, 0=선택 (매칭 점수에 사용)
);

-- 영수증 원본 (audit/재처리용, 선택)
CREATE TABLE receipts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  image_path TEXT,
  raw_json TEXT,                          -- LLM/OCR 파싱 원본
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 5-3. 낭비/절약 리포트 (이벤트 집계)
```sql
-- 절약 = 실제 먹은 금액, 낭비 = 버린 금액
SELECT
  SUM(CASE WHEN event_type='consume'              THEN est_value ELSE 0 END) AS saved,
  SUM(CASE WHEN event_type IN ('discard','expire') THEN est_value ELSE 0 END) AS wasted
FROM inventory_events
WHERE user_id = :uid AND created_at >= :week_start;
```

---

## 6. 구현 방법 (기능별)

### 6-1. 영수증 → 재고 추가
1. 이미지 업로드 → 멀티모달 LLM(또는 CLOVA OCR)으로 `[{name, qty, unit, price}]` 구조화 추출.
2. 각 `name`을 `ingredient_aliases`로 canonical 매핑(미스 시 LLM 폴백 + 신규 alias 학습).
3. 유통기한은 영수증에 없으면 `default_shelf_life_days`로 추정.
4. `inventory_items` insert + `inventory_events(event_type='purchase', +qty)` 기록.

### 6-2. 소비 입력 (음성/텍스트/사진)
- **음성**: **BizCrush ASR**(다국어·소음강건·자동 언어감지) → 텍스트 → LLM 구조화 출력 `[{ingredient, qty}]` →
  `inventory_events(consume, -qty)` + `inventory_items` 수량 차감(0 이하면 status=consumed). 텍스트 직접 입력도 같은 경로(폴백 STT=Web Speech).
- **음식 사진**: LLM 비전 → 요리명 + 추정 재료 → 매칭되는 레시피가 있으면 그 레시피 차감, 없으면 추정 재료 차감.
- 모호하면 LLM이 1회 되물음, 무응답 시 기본값(1)으로 추정.

### 6-3. 레시피 추천 (임박 우선)
```
active = SELECT * FROM inventory_items WHERE status='active' ORDER BY expires_at ASC
urgent = active 중 (유통기한 - 오늘) <= 3일
각 recipe에 대해:
  essential = recipe_ingredients(is_essential=1)
  have      = essential ∩ active
  missing   = essential - active
  score = len(have)/len(essential)        # 완성도
        + w1 * (urgent 재료 사용 여부)      # 임박 재료 보너스 (핵심 차별점)
        - w2 * len(missing)               # 부족 재료 패널티
recipes를 score desc 정렬 → 상위 K개 노출
shopping_list = 상위 K개 레시피의 missing 합집합(중복 제거) → "다음에 장 볼 것"
```

### 6-4. "만들었어요" → 자동 차감
- `recipe_id`로 `recipe_ingredients` 조회 → 각 재료에 대해
  `inventory_events(consume, -qty, ref_type='recipe', ref_id=recipe_id)` 기록 + 재고 차감.

### 6-5. "아직 있어요?" 단발 확인
- 트리거: `expires_at`가 N일 이내 + `last_confirmed_at`가 오래됨/없음.
- 알림 패널에 표시 → [있어요] = `last_confirmed_at` 갱신(+유통기한 소폭 연장 가능) /
  [다 썼어요] = `consume` 이벤트.

### 6-6. 자동 만료
- 페이지 로드 또는 APScheduler 잡: `expires_at < 오늘 AND status='active'` →
  `status='expired'` + `inventory_events(expire/discard)` → 낭비 리포트에 반영.

---

## 7. 해커톤 MVP 범위 (우선순위)

| 우선 | 항목 |
|---|---|
| **P0 (필수)** | 재고 CRUD + 이벤트 로그 / 영수증 업로드→LLM 파싱→재고 추가 / 임박 우선 레시피 추천 / **"만들었어요"→자동 차감** / 낭비·절약 리포트 |
| **P1** | **다국어 음성 소비 입력(BizCrush ASR + LLM)** / "아직 있어요?" 확인 패널 / 자동 만료 |
| **P2** | 음식 사진 인식 / "다음에 장 볼 것" 추천 / 알림 스케줄러 |

> 시드 데이터: 한식 위주 레시피 20~50개 + `recipe_ingredients` 정확히 입력(자동차감 데모가 결정론적으로 동작하도록), 식재료 마스터/별칭 일부 선입력.

---

## 8. 데모 시나리오 → `pitch.kr.md`로 분리

발표 내러티브·슬라이드·데모 스크립트·예상 Q&A는 **[pitch.kr.md](./pitch.kr.md)** 참고.

빌드 관점 핵심 흐름만 요약: 영수증→재고 / 임박 우선 추천 / "만들었어요" 자동 차감 /
**다국어 음성 차감(BizCrush, 데모 하이라이트)** / 절약·폐기 리포트.

---

## 부록. 열린 결정 사항 (검토 필요)

- [ ] **BizCrush API 접근/SDK 확보** — 실시간 단발 발화 ASR 지원 형태·요금/쿼터·폴백(Web Speech) 경계 확인
- [ ] 프론트: HTMX(Python 중심) vs React(앱 느낌) 중 택1
- [ ] LLM 제공자: OpenAI / Azure OpenAI / Claude / Gemini / 로컬 GPU
- [ ] 영수증: LLM 비전 단독 vs CLOVA OCR 하이브리드
- [ ] 레시피: 시드 DB 큐레이션 vs LLM 생성 비중
