/**
 * AI 분석의 입출력 계약. 클라이언트와 서버가 함께 쓴다.
 *
 * 원칙 (기획서 05)
 *   1. AI는 후보를 제안할 뿐, 저장 여부는 사용자가 결정한다.
 *   2. 원문은 언제나 Text 모듈로 함께 보존한다.
 *   3. 불확실한 값은 needsCheck로 표시하고 원문의 근거(sourceSpan)를 함께 보여준다.
 *   4. 이미 쓰고 있는 카테고리가 있으면 그것을 쓰고, 없을 때만 새로 만든다.
 *   5. 먹었다고 말해도 섭취로 확정하지 않는다 — 음식 확인 화면을 거친다.
 */
import type { ClockTime, ISODate, TransactionKind } from './types'

export interface AnalyzeRequest {
  text: string
  /** 이미 쓰고 있는 지출 카테고리 (사용 빈도 순) */
  categories: string[]
  /** 상대 날짜("내일")를 풀기 위한 기준 날짜 */
  today: ISODate
  timezone?: string
}

export type SuggestionKind = 'schedule' | 'money' | 'food' | 'place' | 'person' | 'task'

interface Base {
  id: string
  kind: SuggestionKind
  /** 기본 선택 여부. 사용자가 화면에서 바꾼다. */
  selected: boolean
  /** 확인이 필요한 값(연도 없음, 오전/오후 모호, 거래일 불명 등) */
  needsCheck?: boolean
  /** 원문에서 이 제안이 나온 부분 */
  sourceSpan?: string
}

export interface ScheduleSuggestion extends Base {
  kind: 'schedule'
  date: ISODate
  startTime?: ClockTime
  endTime?: ClockTime
}

export interface MoneySuggestion extends Base {
  kind: 'money'
  label: string
  amount: number
  occurredAt: ISODate
  transactionKind: TransactionKind
  /** 실제 결제면 confirmed, 예상 비용이면 planned */
  paid: boolean
  category: string
  /** 기존 카테고리에 없어서 새로 만든 이름인지 */
  categoryIsNew: boolean
}

export interface FoodSuggestion extends Base {
  kind: 'food'
  name: string
  /** 이미 먹었다고 말한 경우. 확정은 음식 확인 화면에서 한다. */
  eaten: boolean
}

export interface PlaceSuggestion extends Base {
  kind: 'place'
  name: string
}

export interface PersonSuggestion extends Base {
  kind: 'person'
  names: string[]
}

export interface TaskSuggestion extends Base {
  kind: 'task'
  title: string
  dueAt?: ISODate
}

export type Suggestion =
  | ScheduleSuggestion
  | MoneySuggestion
  | FoodSuggestion
  | PlaceSuggestion
  | PersonSuggestion
  | TaskSuggestion

export interface AnalysisResult {
  /** 제안된 기록 제목. 사용자가 고칠 수 있다. */
  title: string
  /** 언제나 그대로 보존되는 원문 */
  originalText: string
  suggestions: Suggestion[]
  model?: string
}

export interface AiStatus {
  configured: boolean
  model: string | null
}

export const SUGGESTION_LABEL: Record<SuggestionKind, string> = {
  schedule: '일정',
  money: '지출',
  food: '음식',
  place: '장소',
  person: '함께',
  task: '할 일',
}

export const SUGGESTION_ICON: Record<SuggestionKind, string> = {
  schedule: 'i-cal',
  money: 'i-money',
  food: 'i-bowl',
  place: 'i-pin',
  person: 'i-people',
  task: 'i-check',
}
