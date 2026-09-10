import { addDays, daysBetween, minutesOf, nowClock, startOfWeek, today, weekDates } from './date'
import type { ISODate, LifeRecord, ModuleKey } from './types'

/** 이 Record가 해당 날짜에 보여야 하는가. 대표 날짜뿐 아니라 각 모듈의 실제 발생일도 본다. */
export function touchesDate(record: LifeRecord, date: ISODate): boolean {
  if (record.eventDate === date) return true
  const { schedule, money, food } = record.modules
  if (schedule?.startDate === date) return true
  if (money?.transactions.some((t) => t.occurredAt === date)) return true
  if (food?.consumedAt === date) return true
  return false
}

/** 같은 날짜 안에서 한 Record는 카드 하나로만 나온다. */
export function recordsOn(records: LifeRecord[], date: ISODate): LifeRecord[] {
  return sortByTime(records.filter((r) => touchesDate(r, date)))
}

export function sortByTime(records: LifeRecord[]): LifeRecord[] {
  return [...records].sort((a, b) => {
    const ma = minutesOf(a.eventTime ?? a.modules.schedule?.startTime)
    const mb = minutesOf(b.eventTime ?? b.modules.schedule?.startTime)
    if (ma == null && mb == null) return a.title.localeCompare(b.title, 'ko')
    if (ma == null) return 1 // 시간 미정은 뒤로
    if (mb == null) return -1
    return ma - mb
  })
}

export function timeOf(record: LifeRecord): string | undefined {
  return record.eventTime ?? record.modules.schedule?.startTime
}

export function moduleKeys(record: LifeRecord): ModuleKey[] {
  return (Object.keys(record.modules) as ModuleKey[]).filter((k) => record.modules[k] != null)
}

/** 확정된 거래만 집계한다. 예정 비용은 넣지 않는다. */
export function confirmedSpendOn(records: LifeRecord[], date: ISODate): number {
  return records.reduce((sum, r) => {
    const txs = r.modules.money?.transactions ?? []
    return (
      sum +
      txs
        .filter((t) => t.occurredAt === date && t.status === 'confirmed')
        .reduce((s, t) => s + (t.kind === 'refund' ? -t.amount : t.amount), 0)
    )
  }, 0)
}

export function scheduleCountOn(records: LifeRecord[], date: ISODate): number {
  return records.filter(
    (r) => r.modules.schedule && r.modules.schedule.startDate === date && r.modules.schedule.status !== 'canceled',
  ).length
}

/**
 * 섭취 확인이 필요한 기록.
 * 예정 상태이면서 일정이 이미 끝났거나(종료 시각 경과), 확인 대기로 남겨둔 기록.
 * 종료 시각이 없으면 임의로 끝났다고 간주하지 않고 날짜가 지난 경우에만 제안한다. — 기획서 07
 */
export function needsFoodCheck(record: LifeRecord, at: ISODate = today()): boolean {
  const food = record.modules.food
  if (!food) return false
  if (food.status === 'pending') return true
  if (food.status !== 'planned') return false

  const schedule = record.modules.schedule
  if (schedule?.status === 'canceled') return false

  const day = schedule?.startDate ?? record.eventDate
  const gap = daysBetween(at, day)
  if (gap < 0) return true // 지난 날짜
  if (gap > 0) return false // 아직 오지 않음
  const end = schedule?.endTime
  return end ? end <= nowClock() : false
}

export function pendingFoodRecords(records: LifeRecord[], at: ISODate = today()): LifeRecord[] {
  return records.filter((r) => needsFoodCheck(r, at))
}

export interface WeekSummary {
  weekStart: ISODate
  days: { date: ISODate; amount: number; hasRecord: boolean }[]
  total: number
  previousTotal: number | null
  topCategory: { name: string; amount: number; ratio: number } | null
  recordedDays: number
  pendingFood: number
  confirmedMeals: number
}

export function weekSummary(records: LifeRecord[], anchor: ISODate = today()): WeekSummary {
  const weekStart = startOfWeek(anchor)
  const dates = weekDates(anchor)

  const days = dates.map((date) => ({
    date,
    amount: confirmedSpendOn(records, date),
    hasRecord: records.some((r) => touchesDate(r, date)),
  }))

  const total = days.reduce((s, d) => s + d.amount, 0)

  const prevDates = weekDates(addDays(weekStart, -7))
  const prevHasRecord = prevDates.some((date) => records.some((r) => touchesDate(r, date)))
  const previousTotal = prevHasRecord
    ? prevDates.reduce((s, date) => s + confirmedSpendOn(records, date), 0)
    : null

  const byCategory = new Map<string, number>()
  for (const r of records) {
    for (const t of r.modules.money?.transactions ?? []) {
      if (t.status !== 'confirmed' || !dates.includes(t.occurredAt)) continue
      const key = t.category ?? '기타'
      byCategory.set(key, (byCategory.get(key) ?? 0) + (t.kind === 'refund' ? -t.amount : t.amount))
    }
  }
  const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0]

  return {
    weekStart,
    days,
    total,
    previousTotal,
    topCategory:
      top && total > 0 ? { name: top[0], amount: top[1], ratio: top[1] / total } : null,
    recordedDays: days.filter((d) => d.hasRecord).length,
    pendingFood: pendingFoodRecords(records, anchor).length,
    confirmedMeals: records.filter(
      (r) => r.modules.food?.status === 'confirmed' && dates.includes(r.modules.food.consumedAt ?? ''),
    ).length,
  }
}

/**
 * 이미 쓰고 있는 지출 카테고리를 사용 빈도 순으로. AI에게 함께 보내서
 * 기존 카테고리에 맞으면 그대로 쓰고, 없을 때만 새 이름을 만들게 한다.
 */
export function existingCategories(records: LifeRecord[]): string[] {
  return categoryUsage(records).map((c) => c.name)
}

export interface CategoryUsage {
  name: string
  count: number
  total: number
}

/** 카테고리별 사용 건수와 확정 지출 합계 */
export function categoryUsage(records: LifeRecord[]): CategoryUsage[] {
  const map = new Map<string, CategoryUsage>()
  for (const r of records) {
    for (const t of r.modules.money?.transactions ?? []) {
      const name = t.category?.trim()
      if (!name) continue
      const entry = map.get(name) ?? { name, count: 0, total: 0 }
      entry.count += 1
      if (t.status === 'confirmed') entry.total += t.kind === 'refund' ? -t.amount : t.amount
      map.set(name, entry)
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

/** 기록에서 쓰인 카테고리 + 사용자가 미리 만들어 둔 카테고리 */
export function allCategories(records: LifeRecord[], custom: string[] = []): string[] {
  return [...new Set([...existingCategories(records), ...custom])]
}

export type SearchFilter = 'all' | 'schedule' | 'money' | 'food' | 'text'

export function searchRecords(
  records: LifeRecord[],
  query: string,
  filter: SearchFilter = 'all',
): LifeRecord[] {
  const q = query.trim().toLowerCase()
  const pool = filter === 'all' ? records : records.filter((r) => r.modules[filter] != null)
  if (!q) return []

  return pool
    .filter((r) => searchHaystack(r).includes(q))
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
}

function searchHaystack(record: LifeRecord): string {
  const m = record.modules
  return [
    record.title,
    m.text?.editedText ?? m.text?.originalText ?? '',
    m.place?.name ?? '',
    ...(m.person?.names ?? []),
    m.food?.actualName ?? m.food?.plannedName ?? '',
    ...(m.food?.ingredients ?? []),
    ...(m.money?.transactions ?? []).map((t) => `${t.label} ${t.category ?? ''}`),
    ...(m.task?.items ?? []).map((t) => t.title),
  ]
    .join(' ')
    .toLowerCase()
}

/** 목록 카드의 한 줄 요약 */
export function summaryLine(record: LifeRecord): string {
  const m = record.modules
  const parts: string[] = []
  if (m.person?.names.length) parts.push(m.person.names.join(', '))
  if (m.place?.name) parts.push(m.place.name)
  if (!parts.length && m.text) parts.push(m.text.editedText ?? m.text.originalText)
  if (!parts.length && m.task?.items.length)
    parts.push(`할 일 ${m.task.items.filter((t) => !t.completed).length}개 남음`)
  return parts.join(' · ')
}
