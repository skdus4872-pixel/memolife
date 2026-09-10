/**
 * Memo Life 2.0 — Record System
 *
 * 확정 원칙: 하나의 사건은 하나의 Record다.
 *   Record = Core(제목·대표 날짜·대표 시간) + Modules(필요한 정보만)
 *
 * 모든 화면(Today / Calendar / Search / Insight)은 이 Record 하나를 참조한다.
 * 화면별 사본을 만들지 않는다. — 기획서 04
 */

/** 'YYYY-MM-DD' */
export type ISODate = string
/** 'HH:mm' */
export type ClockTime = string

export type ModuleKey =
  | 'text'
  | 'schedule'
  | 'money'
  | 'food'
  | 'place'
  | 'person'
  | 'task'
  | 'media'

/** 원문은 언제나 보존한다. 구조화된 값은 별도로 수정한다. — 기획서 05 */
export interface TextModule {
  originalText: string
  editedText?: string
}

export type ScheduleStatus = 'planned' | 'done' | 'canceled'

export interface ScheduleModule {
  startDate: ISODate
  startTime?: ClockTime
  endTime?: ClockTime
  status: ScheduleStatus
}

/** 계획 비용과 실제 지출을 구분한다. 예약금·잔금은 하나의 Money 모듈 안에 복수 거래로 담는다. */
export type TransactionKind = 'deposit' | 'balance' | 'payment' | 'refund'
export type TransactionStatus = 'planned' | 'confirmed'

export interface Transaction {
  id: string
  label: string
  amount: number
  currency: 'KRW'
  kind: TransactionKind
  /** 실제 거래일. Record 대표 날짜와 다를 수 있다. — 기획서 06 */
  occurredAt: ISODate
  status: TransactionStatus
  category?: string
}

export interface MoneyModule {
  transactions: Transaction[]
}

/**
 * 음식은 최상위 기능이 아니라 식사 맥락이 있는 Record에 붙는 Contextual Module이다.
 * 예정 상태는 절대 섭취 통계에 들어가지 않는다. — 기획서 07
 */
export type FoodStatus = 'planned' | 'pending' | 'skipped' | 'confirmed'
export type Portion = 'small' | 'normal' | 'large'

export interface FoodModule {
  plannedName?: string
  actualName?: string
  consumedAt?: ISODate
  status: FoodStatus
  ingredients: string[]
  portion: Portion
  /** 추정 범위. 재료 정보가 없으면 비워둔다(추정 불가). */
  kcalMin?: number
  kcalMax?: number
  estimateBasis?: string
}

export interface PlaceModule {
  name: string
}

/** 동명이인을 자동 병합하지 않는다. 사용자가 확인한 이름만 담는다. */
export interface PersonModule {
  names: string[]
}

export interface TaskItem {
  id: string
  title: string
  dueAt?: ISODate
  completed: boolean
}

export interface TaskModule {
  items: TaskItem[]
}

export interface MediaItem {
  id: string
  type: 'image' | 'audio'
  ref: string
  alt?: string
}

export interface MediaModule {
  items: MediaItem[]
}

export interface Modules {
  text?: TextModule
  schedule?: ScheduleModule
  money?: MoneyModule
  food?: FoodModule
  place?: PlaceModule
  person?: PersonModule
  task?: TaskModule
  media?: MediaModule
}

export interface LifeRecord {
  id: string
  title: string
  /** 대표 날짜. 각 모듈의 실제 발생일을 대체하지 않는다. */
  eventDate: ISODate
  /** 시간 미정이면 비운다. 임의의 시각을 만들지 않는다. */
  eventTime?: ClockTime
  createdAt: string
  updatedAt: string
  pinned?: boolean
  /** AI 제안에서 만들어진 Record인지. 사용자가 직접 쓴 값과 구분한다. */
  source: 'manual' | 'ai'
  modules: Modules
}

export const MODULE_LABEL: Record<ModuleKey, string> = {
  text: '원문',
  schedule: '일정',
  money: '지출',
  food: '음식',
  place: '장소',
  person: '함께',
  task: '할 일',
  media: '첨부',
}

export const MODULE_ICON: Record<ModuleKey, string> = {
  text: 'i-note',
  schedule: 'i-cal',
  money: 'i-money',
  food: 'i-bowl',
  place: 'i-pin',
  person: 'i-people',
  task: 'i-check',
  media: 'i-img',
}
