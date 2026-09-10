export function won(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`
}

export function signedWon(amount: number): string {
  return `${amount < 0 ? '-' : ''}₩${Math.abs(amount).toLocaleString('ko-KR')}`
}

export function uid(prefix = 'r'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}
