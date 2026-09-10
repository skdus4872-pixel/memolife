import type { ClockTime, ISODate } from './types'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']
const WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today(): ISODate {
  return toISODate(new Date())
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** 월요일 시작 주의 첫날 */
export function startOfWeek(iso: ISODate): ISODate {
  const d = parseISODate(iso)
  const shift = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - shift)
  return toISODate(d)
}

export function weekDates(anchor: ISODate): ISODate[] {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function monthLabel(iso: ISODate): string {
  const d = parseISODate(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
}

export function monthEn(iso: ISODate): string {
  return MONTH_EN[parseISODate(iso).getMonth()]
}

export function dayOfMonth(iso: ISODate): string {
  return pad(parseISODate(iso).getDate())
}

export function weekdayEn(iso: ISODate): string {
  return WEEKDAY_EN[parseISODate(iso).getDay()]
}

export function weekdayKo(iso: ISODate): string {
  return WEEKDAY_KO[parseISODate(iso).getDay()]
}

/** 'SEP 10' */
export function shortDate(iso: ISODate): string {
  return `${monthEn(iso)} ${dayOfMonth(iso)}`
}

/** '9월 10일' */
export function koreanDate(iso: ISODate): string {
  const d = parseISODate(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export function relativeDay(iso: ISODate): string | null {
  const diff = daysBetween(today(), iso)
  if (diff === 0) return '오늘'
  if (diff === 1) return '내일'
  if (diff === -1) return '어제'
  return null
}

export function daysBetween(from: ISODate, to: ISODate): number {
  const ms = parseISODate(to).getTime() - parseISODate(from).getTime()
  return Math.round(ms / 86400000)
}

/** 달력 그리드(일요일 시작, 6주 고정)를 만든다 */
export function monthGrid(anchor: ISODate): { date: ISODate; inMonth: boolean }[] {
  const base = parseISODate(anchor)
  const first = new Date(base.getFullYear(), base.getMonth(), 1)
  const gridStart = new Date(first)
  gridStart.setDate(1 - first.getDay())

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return { date: toISODate(d), inMonth: d.getMonth() === base.getMonth() }
  })
}

export function shiftMonth(anchor: ISODate, delta: number): ISODate {
  const d = parseISODate(anchor)
  const target = new Date(d.getFullYear(), d.getMonth() + delta, 1)
  return toISODate(target)
}

/** '12:30' → 750 (정렬용). 시간 미정은 null */
export function minutesOf(time?: ClockTime): number | null {
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function nowClock(): ClockTime {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
