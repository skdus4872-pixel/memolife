export function won(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`
}

export function signedWon(amount: number): string {
  return `${amount < 0 ? '-' : ''}₩${Math.abs(amount).toLocaleString('ko-KR')}`
}

export function kcalRange(min?: number, max?: number): string | null {
  if (min == null || max == null) return null
  return `${min.toLocaleString('ko-KR')} – ${max.toLocaleString('ko-KR')} kcal`
}

/** 대략값을 한 번에 말해야 할 때만 사용한다(목록 요약 등) */
export function kcalAround(min?: number, max?: number): string | null {
  if (min == null || max == null) return null
  const mid = Math.round((min + max) / 2 / 10) * 10
  return `약 ${mid.toLocaleString('ko-KR')} kcal`
}

export function uid(prefix = 'r'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}
