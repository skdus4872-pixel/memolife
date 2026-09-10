# Memo Life 2.0

하나의 사건을 하나의 Record로 기록하고, 필요한 정보를 모듈로 붙이는 일상 기록 앱.
`Gmail/메모라이프html files/` 의 화면 목업(00–11)을 실제 동작하는 앱으로 옮긴 것.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 타입체크 + 프로덕션 빌드
```

React 18 + TypeScript + Vite. 상태는 로컬 스토리지(`memolife.records.v1`)에 저장된다.
샘플 데이터는 앱을 처음 열 때 오늘 날짜 기준으로 만들어지고, My → 샘플 데이터 다시 불러오기로 되돌릴 수 있다.

## 데이터 구조

```
LifeRecord
  Core     id · title · eventDate · eventTime(없으면 시간 미정)
  Modules  text / schedule / money / food / place / person / task / media
```

기획서에서 온 규칙이 코드에 그대로 들어가 있다.

| 규칙 | 구현 위치 |
| --- | --- |
| 모든 화면이 같은 Record 하나를 참조한다 | `src/lib/store.tsx` (단일 배열, 화면별 사본 없음) |
| 대표 날짜와 모듈 발생일을 구분한다 | `src/lib/derive.ts` `touchesDate`, `confirmedSpendOn` |
| 확정된 거래만 지출 통계에 넣는다 | `derive.ts` `confirmedSpendOn`, `weekSummary` |
| 예정 식사는 섭취 통계에 넣지 않는다 | `derive.ts` `needsFoodCheck`, `FoodModule.status` |
| 종료 시각이 없으면 임의로 끝났다고 보지 않는다 | `derive.ts` `needsFoodCheck` |
| 재료가 없으면 kcal를 추정하지 않는다 | `src/lib/kcal.ts` `estimateKcal` → `null` |
| 이름·장소가 같아도 자동 병합하지 않는다 | `components/ModuleSheet.tsx` PersonForm / PlaceForm |
| 모듈 삭제와 Record 전체 삭제를 구분한다 | `ModuleSheet` 이 정보만 지우기 / RecordDetail 더보기 |

## 화면과 라우트

| 라우트 | 화면 | 목업 |
| --- | --- | --- |
| `/` | Today — 오늘 요약, 확인할 기록, 시간순 타임라인, 시간 미정 | 01 |
| `/quick-record` | 빠른 기록 — 자연어 입력 → 분석하기 / AI 없이 저장 | 02 |
| `/quick-record/analysis` | AI 분석 — 제안 선택·수정 후 저장 | 03 |
| `/record/:id` | 기록 상세 — 모듈 조회·수정·추가, 고정, 삭제 | 04 |
| `/record/:id/food` | 음식 기록 — 섭취 확인 → 재료·양 → 예상 범위 저장 | 05 |
| `/calendar` | 캘린더 — 월 이동, 기록 있는 날 표시, 날짜별 목록 | 06 |
| `/insight` | 인사이트 — 확정 지출, 요일 막대, 분류, 기록일, 확인 대기 | 07 |
| `/search` | 검색 — 원문·사람·장소·재료까지, 모듈 필터 | 08 |
| `/my`, `/my/saved` | 마이 — 저장된 기록, 내보내기, 설정 | 09 |

## AI 분석 (OpenAI)

`.env.example` 를 `.env` 로 복사하고 키를 넣으면 켜진다.

```
OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini   (기본값)
```

키는 **서버 쪽에서만** 읽힌다. 클라이언트는 `/api/analyze` 만 호출한다.

```
+ 버튼 → 원문 입력 → /api/analyze → AI 제안 → 사용자가 고르고 고침 → 저장
```

| 파일 | 역할 |
| --- | --- |
| `src/lib/analysis.ts` | 요청·제안 타입 (클라이언트/서버 공용) |
| `server/analyze.ts` | 프롬프트, JSON 스키마, OpenAI 호출, 결과 검증 |
| `server/http.ts` | `/api/analyze` 미들웨어 (GET=상태, POST=분석) |
| `vite.config.ts` | 개발·preview 서버에 위 미들웨어 연결 |
| `api/analyze.ts` | 배포용 서버리스 함수 (Vercel 등) |
| `src/lib/ai.ts` | 클라이언트 fetch 래퍼 |
| `src/screens/AiAnalysis.tsx` | 03 화면 — 체크박스 선택 · 값 수정 · 저장 |

받는 값(제안 하나)은 이런 모양이다.

```json
{
  "kind": "money", "selected": true, "needsCheck": false,
  "sourceSpan": "예약금 2만원",
  "label": "예약금", "amount": 20000, "occurredAt": "2026-09-10",
  "transactionKind": "deposit", "paid": true,
  "category": "음식", "categoryIsNew": false
}
```

분석 규칙:

- **카테고리** — 앱에 이미 있는 카테고리 목록(`existingCategories`)을 함께 보낸다.
  맞는 게 있으면 그것을 쓰고, 없을 때만 새 이름을 만들고 `categoryIsNew: true` 로 표시한다.
  화면에서는 "새 카테고리" 배지가 붙고, 기존 카테고리 칩으로 바꿀 수 있다.
- **확인 필요** — 확신이 낮거나 거래일·날짜가 불분명하면 `needsCheck` 가 붙어 "확인 필요" 배지가 뜬다.
  사용자가 값을 고치면 배지가 사라진다.
- **저장 시점** — 분석 결과는 저장이 아니다. 체크한 제안만 Record로 들어간다.
- **예상 비용은 집계 제외** — `paid: false` 는 `status: 'planned'` 로 저장돼 지출 통계에 안 들어간다.
- **먹었다고 해도 확정하지 않는다** — 음식은 `pending`(확인 대기)으로 저장되고,
  음식 확인 화면을 거쳐야 섭취 통계에 들어간다.
- 분석에 실패해도 원문은 남는다 — "AI 없이 저장"으로 텍스트만 기록할 수 있다.

## 다음 단계 후보

PWA(홈 화면 설치·오프라인), 사진·음성 입력, 검색의 기간·사람·장소 필터,
카테고리 관리, 알림, 다크 테마, Apple Watch Quick Record.
