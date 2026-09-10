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
앱은 빈 상태로 시작한다. 미리 넣어둔 예시 기록은 없고, 사용자가 쓴 기록만 남는다.

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
| 칼로리는 다루지 않는다 — 무엇을 얼마나 먹었는지만 남긴다 | `src/lib/food.ts`, `FoodModule` |
| 이름·장소가 같아도 자동 병합하지 않는다 | `components/ModuleSheet.tsx` PersonForm / PlaceForm |
| 모듈 삭제와 Record 전체 삭제를 구분한다 | `ModuleSheet` 이 정보만 지우기 / RecordDetail 더보기 |

## 화면과 라우트

| 라우트 | 화면 | 목업 |
| --- | --- | --- |
| `/` | Today — 오늘 요약, 확인할 기록, 시간순 타임라인, 시간 미정 | 01 |
| `/quick-record` | 빠른 기록 — 자연어 입력 → 분석하기 / AI 없이 저장 | 02 |
| — | 앱을 처음 여는 순간에만 스플래시 2초, 이후에는 로딩되는 동안만 | 00 |
| `/quick-record/analysis` | AI 분석 — 제안 선택·수정 후 저장 | 03 |
| `/record/:id` | 기록 상세 — 모듈 조회·수정·추가, 고정, 삭제 | 04 |
| `/record/:id/food` | 음식 기록 — 섭취 확인 → 재료·양 → 예상 범위 저장 | 05 |
| `/calendar` | 캘린더 — 월 이동, 기록 있는 날 표시, 날짜별 목록 | 06 |
| `/insight` | 인사이트 — 확정 지출, 요일 막대, 분류, 기록일, 확인 대기 | 07 |
| `/search` | 검색 — 원문·사람·장소·재료까지, 모듈 필터 | 08 |
| `/my` | 마이 — 프로필, 기록 관리, 설정 | 09 |
| `/my/account` | 계정 — 로그인 상태, 클라우드 동기화, 로그아웃 | — |
| `/my/saved` | 저장된(고정한) 기록 | — |
| `/my/categories` | 카테고리 관리 — 이름 변경·삭제·추가 | — |
| `/my/data` | 데이터 관리 — 내보내기·가져오기·초기화 | — |
| `/my/ai` | AI 설정 — 연결 상태, 제안 켜기/끄기 | — |
| `/my/notifications` | 알림과 제안 — 식사 확인 제안 | — |
| `/my/theme` | 테마 — 라이트(기본)/다크/시스템 | — |
| `/my/help` | 도움말 — 기록을 다루는 방식 | — |
| `/exit` | 앱 종료 — 스플래시를 다시 보여주고 창을 닫음 | 00 |

설정은 `localStorage`(`memolife.settings.v1`)에 저장되고 실제 동작에 반영된다.

| 설정 | 영향 |
| --- | --- |
| AI 제안 받기 | 끄면 빠른 기록이 분석 없이 원문만 저장한다 |
| 식사 확인 제안 | 끄면 Today의 "확인할 기록"과 카드의 확인 버튼이 사라진다 |
| 테마 | 기본 라이트. `data-theme` 로 다크 팔레트를 적용한다 (토큰만 교체) |
| 카테고리 | 여기서 만든 이름도 AI 분석에 함께 보낸다 |

## AI 분석 (OpenAI)

로컬은 `.env.example` 를 `.env` 로 복사하고 키를 넣으면 켜진다.

```
OPENAI_API_KEY=...
# OPENAI_MODEL=gpt-4o-mini   (기본값)
```

키는 **서버 쪽에서만** 읽힌다. 클라이언트는 `/api/analyze` 만 호출한다.
키를 코드나 저장소에 넣지 않는다 — `.env` 는 `.gitignore` 에 있고, `.env.example` 에는 자리표시자만 있다.

```
+ 버튼 → 원문 입력 → /api/analyze → AI 제안 → 사용자가 고르고 고침 → 저장
```

| 파일 | 역할 |
| --- | --- |
| `src/lib/analysis.ts` | 요청·제안 타입 (클라이언트/서버 공용) |
| `api/analyze.ts` | 프롬프트, JSON 스키마, OpenAI 호출, 결과 검증 + Vercel 서버리스 함수 |
| `server/http.ts` | 개발 서버용 `/api/analyze` 미들웨어 (위 파일의 로직을 그대로 사용) |
| `vite.config.ts` | 개발·preview 서버에 위 미들웨어 연결 |
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

## 클라우드 저장 (Firebase)

로그인은 **선택**이다. 로그인하지 않아도 앱은 그대로 쓸 수 있고 기록은 이 기기에만 남는다.
로그인하면 기록과 설정이 계정에 저장되고, 다른 기기에서 같은 계정으로 열면 이어서 볼 수 있다.

| 파일 | 역할 |
| --- | --- |
| `src/lib/firebase.ts` | Firebase 초기화 (웹 설정값은 비밀이 아니라 번들에 포함된다) |
| `src/lib/auth.tsx` | 로그인 상태, Google · 이메일 로그인/회원가입, 오류 문구 |
| `src/lib/cloud.tsx` | Realtime Database 동기화 (`users/{uid}`) |
| `src/components/AuthSheet.tsx` | 로그인 · 회원가입 시트 |
| `src/screens/settings/Account.tsx` | 계정 화면 — 상태, 이름, 로그아웃 |

동기화 규칙:

- 로그인하는 순간 기기에 있던 기록과 계정에 있던 기록을 **합친다**. 같은 `id` 는 `updatedAt` 이 최신인 쪽이 남는다.
- 그 뒤에는 계정이 기준이다. 기기에서 바뀌면 올리고(0.6초 모아서), 다른 기기에서 바뀌면 내려받는다.
- 삭제도 반영되도록 목록 전체를 쓴다. 두 기기에서 동시에 편집하면 나중에 저장한 쪽이 남는다.
- 로그인 안내 팝업은 기기당 한 번만 뜬다 (`memolife.authPrompt.v1`).

### Firebase 콘솔에서 해줘야 하는 설정

1. **Authentication → Sign-in method**: 이메일/비밀번호(켜져 있음), **Google** 사용 설정
2. **Authentication → Settings → 승인된 도메인**: 배포 도메인(`*.vercel.app` 등) 추가 — 없으면 Google 로그인 팝업이 막힌다
3. **Realtime Database → 규칙**: 본인 데이터만 읽고 쓰도록

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

확인 방법: 로그인 후 My → 계정에서 **클라우드 상태**가 "최신 상태"면 정상. "문제 발생"이면 규칙을 다시 확인한다.

## Vercel 배포

저장소를 Vercel에 연결하면 자동 감지된다. `vercel.json` 에 명시해 둔 값:

| 항목 | 값 |
| --- | --- |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Serverless Function | `api/analyze.ts` (maxDuration 30초) |

**환경 변수** — Project → Settings → Environment Variables 에 등록한다.
값은 저장소에 들어가지 않고 Vercel이 함수 런타임에 주입한다.

| 이름 | 필수 | 적용 환경 |
| --- | --- | --- |
| `OPENAI_API_KEY` | 필수 | Production / Preview (Development 는 로컬 `.env` 사용) |
| `OPENAI_MODEL` | 선택 | 기본 `gpt-4o-mini` |
| `OPENAI_BASE_URL` | 선택 | 프록시·Azure를 쓸 때만 |

환경 변수를 추가하거나 바꾼 뒤에는 **재배포해야** 함수에 반영된다.

배포 후 확인:

1. `https://<도메인>/api/analyze` 를 열면 `{"configured":true,"model":"gpt-4o-mini"}` 가 나와야 한다.
   `configured:false` 면 키가 그 환경에 없거나 재배포를 안 한 것이다.
2. 앱에서 My → AI 설정에 모델 이름이 보이면 연결된 것이다.
3. `+` 로 한 문장 넣고 분석 → 제안 화면이 뜨면 끝.

라우팅은 `HashRouter` 라서 새로고침 404를 위한 rewrite 설정이 필요 없다.

> `package.json` 이 `"type": "module"` 이라 서버리스 함수는 ESM 으로 실행된다.
> Node ESM 은 확장자 없는 상대 경로를 해석하지 못하므로 **`api/analyze.ts` 안에는 값 import 를 두지 않는다.**
> (한 번 `FUNCTION_INVOCATION_FAILED` 로 죽었던 원인이다. 공유가 필요하면 타입만 import 한다.)

## 다음 단계 후보

PWA(홈 화면 설치·오프라인), 사진·음성 입력, 검색의 기간·사람·장소 필터,
카테고리 관리, 알림, 다크 테마, Apple Watch Quick Record.
