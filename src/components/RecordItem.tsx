import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { needsFoodCheck, summaryLine, timeOf } from '../lib/derive'
import { kcalAround, won } from '../lib/format'
import type { ISODate, LifeRecord } from '../lib/types'

export function primaryIcon(record: LifeRecord): IconName {
  const m = record.modules
  if (m.food) return 'i-bowl'
  if (m.schedule) return 'i-cal'
  if (m.money) return 'i-money'
  if (m.task) return 'i-check'
  return 'i-note'
}

/**
 * 타임라인·날짜 목록의 공통 카드.
 * 같은 날짜 안에서 한 Record는 카드 하나로 나오고, 관련 모듈은 그 안에서 요약한다. — 기획서 06
 */
export function RecordItem({
  record,
  date,
  now = false,
}: {
  record: LifeRecord
  /** 이 카드가 놓인 날짜. 모듈 요약을 이 날짜 기준으로 고른다. */
  date: ISODate
  now?: boolean
}) {
  const navigate = useNavigate()
  const time = timeOf(record)
  const { money, food, schedule } = record.modules
  const sub = summaryLine(record)

  const txToday = (money?.transactions ?? []).filter((t) => t.occurredAt === date)
  const checkFood = needsFoodCheck(record)

  return (
    <div className={`item${now ? ' now' : ''}`}>
      <div className={`t num${time ? '' : ' none'}`}>{time ?? '시간 미정'}</div>
      <div className="bd">
        <button type="button" style={{ width: '100%', textAlign: 'left' }} onClick={() => navigate(`/record/${record.id}`)}>
          <div className="ttl">
            <Icon name={primaryIcon(record)} size="sm" style={{ color: 'var(--ink-2)' }} />
            <span className="name">{record.title}</span>
            {schedule?.status === 'done' && <span className="tag done">완료</span>}
            {schedule?.status === 'canceled' && <span className="tag mute">취소</span>}
            {record.pinned && <Icon name="i-pinned" size="xs" style={{ color: 'var(--ink-3)' }} />}
          </div>
          {sub && <div className="sub">{sub}</div>}
        </button>

        {(txToday.length > 0 || food) && (
          <div className="mods">
            {txToday.map((t) => (
              <div className="mod" key={t.id}>
                <Icon name="i-money" size="xs" />
                {t.label} <b className="num">{won(t.amount)}</b>
                {t.status === 'planned' && <span className="tag warn" style={{ marginLeft: 'auto' }}>예정</span>}
              </div>
            ))}

            {food && (
              <FoodMod record={record} checkFood={checkFood} onCheck={() => navigate(`/record/${record.id}/food`)} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FoodMod({
  record,
  checkFood,
  onCheck,
}: {
  record: LifeRecord
  checkFood: boolean
  onCheck: () => void
}) {
  const food = record.modules.food!
  const name = food.actualName ?? food.plannedName ?? '음식'
  const kcal = kcalAround(food.kcalMin, food.kcalMax)

  if (checkFood) {
    return (
      <button type="button" className="mod" onClick={onCheck}>
        <Icon name="i-bowl" size="xs" />
        {name}
        <span className="r">
          식사 후 기록하기
          <Icon name="i-chev" size="xs" />
        </span>
      </button>
    )
  }

  return (
    <div className="mod">
      <Icon name="i-bowl" size="xs" />
      {name}
      <span className="r" style={{ color: 'var(--ink-3)', fontWeight: 500 }}>
        {food.status === 'confirmed' ? (kcal ?? '섭취 확인') : food.status === 'skipped' ? '먹지 않음' : '예정'}
      </span>
    </div>
  )
}
