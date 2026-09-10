import type { Portion } from './types'

/**
 * 예상 칼로리는 "정확한 섭취량"이 아니라 선택한 재료와 양을 근거로 한 범위다.
 * 음식명만으로는 추정하지 않는다. 재료가 없으면 추정 불가로 남긴다. — 기획서 07
 *
 * 기준: 1인분 상차림에서 해당 재료가 차지하는 통상 분량(g)의 열량 하한·상한.
 * 실제 서비스에서는 식품영양성분 DB로 교체하고 basis에 출처·버전을 남긴다.
 */
export const INGREDIENT_KCAL: Record<string, [min: number, max: number]> = {
  소고기: [180, 260],
  돼지고기: [190, 280],
  닭고기: [130, 190],
  해산물: [90, 140],
  달걀: [70, 90],
  두부: [80, 120],
  분모자: [150, 210],
  중국당면: [160, 220],
  라면사리: [230, 300],
  밥: [280, 330],
  면: [220, 300],
  청경채: [10, 20],
  버섯: [15, 30],
  숙주: [10, 20],
  배추: [10, 20],
  어묵: [90, 130],
  치즈: [90, 130],
  튀김: [180, 260],
  마라소스: [120, 200],
  국물: [40, 90],
  채소: [15, 35],
  빵: [230, 300],
  샐러드: [60, 120],
  커피: [5, 120],
  디저트: [200, 400],
}

export const PORTION_LABEL: Record<Portion, string> = {
  small: '적게',
  normal: '보통',
  large: '많이',
}

const PORTION_FACTOR: Record<Portion, number> = {
  small: 0.75,
  normal: 1,
  large: 1.35,
}

export interface KcalEstimate {
  min: number
  max: number
  basis: string
}

/** 재료가 하나도 없으면 null(추정 불가)을 돌려준다. 임의의 단일 kcal를 만들지 않는다. */
export function estimateKcal(ingredients: string[], portion: Portion): KcalEstimate | null {
  const known = ingredients.filter((i) => INGREDIENT_KCAL[i])
  if (known.length === 0) return null

  const factor = PORTION_FACTOR[portion]
  let min = 0
  let max = 0
  for (const name of known) {
    const [lo, hi] = INGREDIENT_KCAL[name]
    min += lo
    max += hi
  }

  const unknownCount = ingredients.length - known.length
  // 기준표에 없는 재료는 계산에 넣지 않고 상한만 완만하게 넓혀 불확실성을 표시한다.
  const spread = unknownCount > 0 ? 1 + unknownCount * 0.12 : 1

  return {
    min: Math.round((min * factor) / 10) * 10,
    max: Math.round((max * factor * spread) / 10) * 10,
    basis: `재료 ${known.length}개 · 양 ${PORTION_LABEL[portion]}${
      unknownCount > 0 ? ` · 기준표에 없는 재료 ${unknownCount}개` : ''
    }`,
  }
}

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
