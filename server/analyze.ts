/**
 * 자연어 기록 → 구조화된 제안.
 *
 * API 키는 이 파일(서버 쪽)에서만 읽는다. 클라이언트 번들에는 들어가지 않는다.
 * - 개발: vite.config.ts 의 미들웨어가 /api/analyze 로 연결한다.
 * - 배포: api/analyze.ts (서버리스 함수)가 같은 함수를 호출한다.
 */
import type {
  AnalysisResult,
  AnalyzeRequest,
  Suggestion,
  SuggestionKind,
} from '../src/lib/analysis'
import type { TransactionKind } from '../src/lib/types'

export const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

/** OPENAI_BASE_URL 로 프록시·Azure·테스트 서버를 가리킬 수 있다. */
const endpointOf = (env: Record<string, string | undefined>) =>
  env.OPENAI_BASE_URL || DEFAULT_ENDPOINT

export class AnalyzeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message)
  }
}

const SYSTEM_PROMPT = `너는 한국어 일상 기록 앱 "Memo Life"의 분석기다.
사용자가 자유롭게 쓴 한 문장(또는 여러 문장)에서 저장할 만한 정보를 뽑아 구조화한다.

지켜야 할 규칙:
1. 원문에 없는 정보를 만들지 않는다. 장소·사람·금액을 추측하지 않는다.
2. 상대 날짜는 today를 기준으로 계산한다. (오늘/내일/모레/이번 주 금요일 등)
3. 연도가 없으면 today와 같은 해로 보되, 이미 지난 날짜면 가장 가까운 미래로 본다.
4. 오전/오후가 불분명하거나 날짜·금액을 확신할 수 없으면 confidence를 "low"로 둔다.
5. 금액은 실제 결제를 마친 것으로 보이면 paid=true, 앞으로 낼 돈이면 paid=false.
   "예약금", "잔금", "환불"이 드러나면 kind로 구분한다.
6. category는 반드시 먼저 known_categories 중에서 고른다. 어느 것에도 맞지 않을 때만
   새 이름을 만들고 category_is_new=true 로 표시한다. 새 이름은 2~4글자 한국어 명사.
7. 음식은 먹은 사실이 분명하면 eaten=true, 먹기로 한 예정이면 eaten=false.
   칼로리나 재료는 추정하지 않는다.
8. source_span 에는 그 제안의 근거가 된 원문의 표현을 그대로(원문에 있는 문자열 그대로) 넣는다.
9. title 은 사용자가 나중에 이 기록을 알아볼 수 있는 짧은 제목(15자 이내)이다.
   "무엇을/누구와" 중심으로 쓰고 날짜·금액은 넣지 않는다.
10. 확실하지 않으면 제안을 만들지 않는 편이 낫다. 억지로 채우지 않는다.`

const SCHEMA = {
  name: 'record_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'suggestions'],
    properties: {
      title: { type: 'string', description: '기록 제목 (15자 이내)' },
      suggestions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'type',
            'confidence',
            'source_span',
            'date',
            'start_time',
            'end_time',
            'amount',
            'kind',
            'occurred_at',
            'paid',
            'category',
            'category_is_new',
            'food_name',
            'eaten',
            'label',
            'names',
            'due_date',
          ],
          properties: {
            type: {
              type: 'string',
              enum: ['schedule', 'money', 'food', 'place', 'person', 'task'],
            },
            confidence: { type: 'string', enum: ['high', 'low'] },
            source_span: { type: ['string', 'null'] },
            // schedule
            date: { type: ['string', 'null'], description: 'YYYY-MM-DD' },
            start_time: { type: ['string', 'null'], description: 'HH:mm' },
            end_time: { type: ['string', 'null'], description: 'HH:mm' },
            // money
            amount: { type: ['number', 'null'] },
            kind: {
              type: ['string', 'null'],
              description: 'payment | deposit | balance | refund 중 하나',
            },
            occurred_at: { type: ['string', 'null'], description: '거래일 YYYY-MM-DD' },
            paid: { type: ['boolean', 'null'] },
            category: { type: ['string', 'null'] },
            category_is_new: { type: ['boolean', 'null'] },
            // food
            food_name: { type: ['string', 'null'] },
            eaten: { type: ['boolean', 'null'] },
            // place / task / money label
            label: { type: ['string', 'null'] },
            // person
            names: { type: ['array', 'null'], items: { type: 'string' } },
            due_date: { type: ['string', 'null'] },
          },
        },
      },
    },
  },
} as const

interface RawSuggestion {
  type: SuggestionKind
  confidence: 'high' | 'low'
  source_span: string | null
  date: string | null
  start_time: string | null
  end_time: string | null
  amount: number | null
  kind: TransactionKind | null
  occurred_at: string | null
  paid: boolean | null
  category: string | null
  category_is_new: boolean | null
  food_name: string | null
  eaten: boolean | null
  label: string | null
  names: string[] | null
  due_date: string | null
}

const TX_KINDS: TransactionKind[] = ['payment', 'deposit', 'balance', 'refund']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const CLOCK = /^\d{2}:\d{2}$/

const asDate = (value: string | null, fallback: string) =>
  value && ISO_DATE.test(value) ? value : fallback
const asClock = (value: string | null) => (value && CLOCK.test(value) ? value : undefined)

/** 모델 출력 → 앱이 쓰는 Suggestion. 형식이 어긋난 항목은 조용히 버린다. */
function toSuggestions(raw: RawSuggestion[], input: AnalyzeRequest): Suggestion[] {
  const out: Suggestion[] = []

  raw.forEach((s, index) => {
    const id = `s${index}`
    const base = {
      id,
      selected: true,
      needsCheck: s.confidence === 'low',
      sourceSpan: s.source_span ?? undefined,
    }

    switch (s.type) {
      case 'schedule': {
        if (!s.date && !s.start_time) return
        out.push({
          ...base,
          kind: 'schedule',
          date: asDate(s.date, input.today),
          startTime: asClock(s.start_time),
          endTime: asClock(s.end_time),
          needsCheck: base.needsCheck || !s.date,
        })
        return
      }
      case 'money': {
        if (typeof s.amount !== 'number' || !Number.isFinite(s.amount) || s.amount <= 0) return
        const known = input.categories.includes(s.category ?? '')
        out.push({
          ...base,
          kind: 'money',
          label: s.label?.trim() || '지출',
          amount: Math.round(s.amount),
          occurredAt: asDate(s.occurred_at, asDate(s.date, input.today)),
          transactionKind: TX_KINDS.includes(s.kind as TransactionKind)
            ? (s.kind as TransactionKind)
            : 'payment',
          paid: s.paid ?? true,
          category: s.category?.trim() || '기타',
          categoryIsNew: s.category_is_new ?? !known,
          // 거래일이 분명하지 않으면 확인이 필요하다
          needsCheck: base.needsCheck || !s.occurred_at,
        })
        return
      }
      case 'food': {
        const name = s.food_name?.trim() || s.label?.trim()
        if (!name) return
        out.push({ ...base, kind: 'food', name, eaten: s.eaten ?? false })
        return
      }
      case 'place': {
        const name = s.label?.trim()
        if (!name) return
        out.push({ ...base, kind: 'place', name })
        return
      }
      case 'person': {
        const names = (s.names ?? []).map((n) => n.trim()).filter(Boolean)
        if (names.length === 0) return
        out.push({ ...base, kind: 'person', names })
        return
      }
      case 'task': {
        const title = s.label?.trim()
        if (!title) return
        out.push({
          ...base,
          kind: 'task',
          title,
          dueAt: s.due_date && ISO_DATE.test(s.due_date) ? s.due_date : undefined,
        })
        return
      }
      default:
        return
    }
  })

  return out
}

export function isConfigured(env: NodeJS.ProcessEnv | Record<string, string | undefined>): boolean {
  return Boolean(env.OPENAI_API_KEY)
}

export function modelName(env: Record<string, string | undefined>): string {
  return env.OPENAI_MODEL || DEFAULT_MODEL
}

export async function runAnalysis(
  input: AnalyzeRequest,
  env: Record<string, string | undefined>,
): Promise<AnalysisResult> {
  const apiKey = env.OPENAI_API_KEY
  if (!apiKey) {
    throw new AnalyzeError(
      'OPENAI_API_KEY 가 설정되지 않았습니다. 로컬은 .env, 배포는 Vercel 환경 변수에 넣어주세요.',
      503,
      'not_configured',
    )
  }

  const text = input.text?.trim()
  if (!text) throw new AnalyzeError('분석할 내용이 없습니다.', 400, 'empty_text')

  const model = modelName(env)
  const userPayload = JSON.stringify(
    {
      text,
      today: input.today,
      timezone: input.timezone ?? 'Asia/Seoul',
      known_categories: input.categories,
    },
    null,
    2,
  )

  const call = (responseFormat: unknown, systemPrompt: string) =>
    fetch(endpointOf(env), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPayload },
        ],
        response_format: responseFormat,
      }),
    })

  let response: Response
  try {
    response = await call({ type: 'json_schema', json_schema: SCHEMA }, SYSTEM_PROMPT)

    // 모델이 json_schema 를 지원하지 않으면 json_object 로 한 번 더 시도한다.
    if (response.status === 400) {
      const detail = await response.clone().text().catch(() => '')
      if (/response_format|json_schema|schema/i.test(detail)) {
        response = await call(
          { type: 'json_object' },
          `${SYSTEM_PROMPT}\n\n반드시 다음 JSON 구조로만 답한다:\n${JSON.stringify(SCHEMA.schema)}`,
        )
      }
    }
  } catch (error) {
    throw new AnalyzeError(
      `분석 서버에 연결하지 못했습니다. (${(error as Error).message})`,
      502,
      'network',
    )
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new AnalyzeError(
      `분석에 실패했습니다. (${response.status}) ${detail.slice(0, 300)}`,
      response.status === 401 ? 401 : 502,
      response.status === 401 ? 'bad_key' : 'upstream',
    )
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new AnalyzeError('분석 결과가 비어 있습니다.', 502, 'empty_response')

  let parsed: { title?: string; suggestions?: RawSuggestion[] }
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new AnalyzeError('분석 결과를 읽지 못했습니다.', 502, 'bad_json')
  }

  return {
    title: parsed.title?.trim() || text.slice(0, 15),
    originalText: text,
    suggestions: toSuggestions(parsed.suggestions ?? [], input),
    model,
  }
}
