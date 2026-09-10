import { addDays, koreanDate, today } from './date'
import type { ISODate, LifeRecord } from './types'

/**
 * 샘플 기록. 실제 사용 데이터가 아니라 설계 시나리오용 값이다. — 기획서 06
 * 오늘 날짜를 기준으로 만들어, 언제 열어도 Today가 비어 보이지 않게 한다.
 */
export function buildSeed(base: ISODate = today()): LifeRecord[] {
  const d = (n: number) => addDays(base, n)
  const stamp = new Date().toISOString()

  const rec = (
    id: string,
    title: string,
    eventDate: ISODate,
    eventTime: string | undefined,
    modules: LifeRecord['modules'],
    extra: Partial<LifeRecord> = {},
  ): LifeRecord => ({
    id,
    title,
    eventDate,
    eventTime,
    createdAt: stamp,
    updatedAt: stamp,
    source: 'manual',
    modules,
    ...extra,
  })

  return [
    rec('seed_class', 'C4D 수업', d(0), '09:00', {
      schedule: { startDate: d(0), startTime: '09:00', endTime: '11:30', status: 'planned' },
      place: { name: 'SBS 아카데미 일산' },
    }),

    rec('seed_morning_coffee', '아침 커피', d(0), '08:20', {
      money: {
        transactions: [
          {
            id: 'tx_coffee_today',
            label: '카페',
            amount: 4500,
            currency: 'KRW',
            kind: 'payment',
            occurredAt: d(0),
            status: 'confirmed',
            category: '음식',
          },
        ],
      },
    }),

    // 하나의 사건에 일정 · 지출 · 음식 · 사람이 함께 붙은 대표 Record
    rec(
      'seed_maratang',
      '수진이와 마라탕',
      d(0),
      '12:30',
      {
        text: {
          originalText: `${koreanDate(d(0))} 12시 반에 수진이랑 마라탕 먹기로 했고 예약금 2만원 결제했어.`,
        },
        schedule: { startDate: d(0), startTime: '12:30', endTime: '14:00', status: 'planned' },
        person: { names: ['수진'] },
        money: {
          transactions: [
            {
              id: 'tx_deposit',
              label: '예약금',
              amount: 20000,
              currency: 'KRW',
              kind: 'deposit',
              occurredAt: d(-3),
              status: 'confirmed',
              category: '음식',
            },
          ],
        },
        // 아직 먹지 않았다 → 예정. 섭취 통계에 들어가지 않는다.
        food: { plannedName: '마라탕', status: 'planned', ingredients: [], portion: 'normal' },
      },
      { source: 'ai' },
    ),

    rec('seed_portfolio', 'Portfolio', d(0), '15:20', {
      text: { originalText: '메모라이프 IA 수정하기' },
      task: {
        items: [
          { id: 't1', title: 'IA 다이어그램 수정', completed: false },
          { id: 't2', title: '컴포넌트 상태표 정리', completed: false },
        ],
      },
    }),

    rec('seed_gym', '헬스', d(0), '19:00', {
      schedule: { startDate: d(0), startTime: '19:00', endTime: '20:00', status: 'planned' },
      text: { originalText: '운동 50분' },
    }),

    // 시간 미정 기록 — 임의의 시각처럼 보이지 않게 따로 모은다
    rec('seed_grocery', '장보기 메모', d(0), undefined, {
      text: { originalText: '두부, 청경채, 소분 용기' },
      task: {
        items: [
          { id: 't3', title: '두부', completed: false },
          { id: 't4', title: '청경채', completed: false },
          { id: 't5', title: '소분 용기', completed: true },
        ],
      },
    }),

    // 일정은 끝났지만 아직 섭취 확인을 하지 않은 기록 → Today의 "확인할 기록"
    rec('seed_dinner', '엄마랑 저녁', d(-1), '18:30', {
      schedule: { startDate: d(-1), startTime: '18:30', endTime: '20:00', status: 'done' },
      person: { names: ['엄마'] },
      money: {
        transactions: [
          {
            id: 'tx_dinner',
            label: '식사',
            amount: 34000,
            currency: 'KRW',
            kind: 'payment',
            occurredAt: d(-1),
            status: 'confirmed',
            category: '음식',
          },
        ],
      },
      food: { plannedName: '김치찌개', status: 'pending', ingredients: [], portion: 'normal' },
    }),

    rec('seed_cafe', '작업하며 커피', d(-2), '14:10', {
      money: {
        transactions: [
          {
            id: 'tx_cafe',
            label: '카페',
            amount: 5600,
            currency: 'KRW',
            kind: 'payment',
            occurredAt: d(-2),
            status: 'confirmed',
            category: '음식',
          },
        ],
      },
      food: {
        actualName: '아이스 라떼',
        consumedAt: d(-2),
        status: 'confirmed',
        ingredients: ['커피'],
        portion: 'normal',
        kcalMin: 10,
        kcalMax: 120,
        estimateBasis: '재료 1개 · 양 보통',
      },
      place: { name: '연남동 카페' },
    }),

    rec('seed_market', '장보기', d(-3), '17:40', {
      money: {
        transactions: [
          {
            id: 'tx_market',
            label: '마트',
            amount: 42300,
            currency: 'KRW',
            kind: 'payment',
            occurredAt: d(-3),
            status: 'confirmed',
            category: '생활',
          },
        ],
      },
    }),

    rec('seed_gympay', '헬스장 3개월 등록', d(-4), '11:00', {
      money: {
        transactions: [
          {
            id: 'tx_gym',
            label: '헬스장 등록',
            amount: 99000,
            currency: 'KRW',
            kind: 'payment',
            occurredAt: d(-4),
            status: 'confirmed',
            category: '건강',
          },
        ],
      },
      text: { originalText: '3개월 등록. 주 3회 목표' },
    }),

    rec('seed_lunch', '점심 김치찌개', d(-5), '12:40', {
      money: {
        transactions: [
          {
            id: 'tx_lunch',
            label: '점심',
            amount: 9500,
            currency: 'KRW',
            kind: 'payment',
            occurredAt: d(-5),
            status: 'confirmed',
            category: '음식',
          },
        ],
      },
      food: {
        actualName: '김치찌개',
        consumedAt: d(-5),
        status: 'confirmed',
        ingredients: ['국물', '두부', '돼지고기', '밥'],
        portion: 'normal',
        kcalMin: 590,
        kcalMax: 820,
        estimateBasis: '재료 4개 · 양 보통',
      },
    }),

    rec('seed_recipe', '마라탕 재료 메모', d(-9), undefined, {
      text: { originalText: '분모자, 중국당면, 소고기' },
    }),

    rec('seed_old_maratang', '일산 마라탕', d(-20), '19:10', {
      money: {
        transactions: [
          {
            id: 'tx_old',
            label: '식사',
            amount: 16000,
            currency: 'KRW',
            kind: 'payment',
            occurredAt: d(-20),
            status: 'confirmed',
            category: '음식',
          },
        ],
      },
      food: {
        actualName: '마라탕',
        consumedAt: d(-20),
        status: 'confirmed',
        ingredients: ['소고기', '청경채', '분모자', '마라소스'],
        portion: 'normal',
        kcalMin: 460,
        kcalMax: 690,
        estimateBasis: '재료 4개 · 양 보통',
      },
        place: { name: '일산' },
      },
      { pinned: true },
    ),

    // 지난주 비교용 — 확정 거래만 집계에 들어간다
    rec('seed_prev_1', '지난주 외식', d(-8), '19:00', {
      money: {
        transactions: [
          {
            id: 'tx_p1',
            label: '외식',
            amount: 38000,
            currency: 'KRW',
            kind: 'payment',
            occurredAt: d(-8),
            status: 'confirmed',
            category: '음식',
          },
        ],
      },
    }),

    rec('seed_prev_2', '지난주 교통비', d(-10), undefined, {
      money: {
        transactions: [
          {
            id: 'tx_p2',
            label: '교통',
            amount: 27400,
            currency: 'KRW',
            kind: 'payment',
            occurredAt: d(-10),
            status: 'confirmed',
            category: '교통',
          },
        ],
      },
    }),
  ]
}
