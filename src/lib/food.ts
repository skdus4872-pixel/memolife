import type { Portion } from './types'

/**
 * 음식은 "무엇을 얼마나 먹었는지"를 남기는 기록이다.
 * 칼로리는 다루지 않는다 — 추정값으로 식사를 평가하지 않는다.
 */

export const PORTION_LABEL: Record<Portion, string> = {
  small: '적게',
  normal: '보통',
  large: '많이',
}

export const PORTIONS: Portion[] = ['small', 'normal', 'large']

/** 음식별로 자주 쓰는 재료 후보. 선택 칩의 초기 목록으로만 쓴다. */
export function suggestIngredients(foodName: string): string[] {
  const name = foodName ?? ''
  if (name.includes('마라')) return ['소고기', '청경채', '두부', '분모자', '중국당면', '버섯']
  if (name.includes('국') || name.includes('탕') || name.includes('찌개'))
    return ['국물', '두부', '채소', '돼지고기', '밥']
  if (name.includes('파스타') || name.includes('면')) return ['면', '치즈', '채소', '해산물']
  if (name.includes('샐러드')) return ['샐러드', '달걀', '치즈', '닭고기']
  if (name.includes('커피') || name.includes('라떼')) return ['커피', '디저트']
  return ['밥', '채소', '달걀', '고기', '국물']
}
