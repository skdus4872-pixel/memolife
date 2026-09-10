import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useStore } from '../lib/store'
import { weekSummary } from '../lib/derive'
import { weekdayKo } from '../lib/date'
import { won } from '../lib/format'

const CIRCUMFERENCE = 2 * Math.PI * 28

export function Insight() {
  const { records } = useStore()
  const navigate = useNavigate()
  const week = useMemo(() => weekSummary(records), [records])

  const maxAmount = Math.max(...week.days.map((d) => d.amount), 1)
  const hasSpend = week.total > 0
  const diff = week.previousTotal == null ? null : week.total - week.previousTotal

  return (
    <main className="screen">
      <div className="topbar" style={{ paddingTop: 2 }}>
        <span className="title">이번 주</span>
        <span className="muted num">{week.weekStart.replace(/-/g, '.')} 시작</span>
      </div>

      <section className="big">
        <div className="k">확정된 지출</div>
        <div className="v num">{won(week.total)}</div>
        <div className="d">
          {diff == null ? (
            '지난주는 비교할 기록이 없어 아직 비교하지 않아요'
          ) : diff === 0 ? (
            '지난주와 같아요'
          ) : (
            <>
              지난주보다{' '}
              <b className="num" style={{ fontWeight: 700 }}>
                {won(Math.abs(diff))}
              </b>{' '}
              {diff < 0 ? '적게' : '많이'} 썼어요
            </>
          )}
        </div>
      </section>

      {hasSpend ? (
        <div className="bars">
          {week.days.map((d) => (
            <div className={`col${d.amount === maxAmount ? ' on' : ''}`} key={d.date}>
              <i style={{ height: `${Math.max((d.amount / maxAmount) * 100, 2)}%` }} />
              <span>{weekdayKo(d.date)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">아직 확정된 지출 기록이 없어요</div>
      )}

      {week.topCategory && (
        <div className="split">
          <div className="txt">
            <div className="k">가장 많이 쓴 곳</div>
            <div className="v num">
              {week.topCategory.name} {won(week.topCategory.amount)}
            </div>
            <div className="n">전체 지출의 {Math.round(week.topCategory.ratio * 100)}%</div>
          </div>
          <svg className="donut" width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
            <circle cx="36" cy="36" r="28" fill="none" stroke="#EFEBF5" strokeWidth="11" />
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              stroke="#7B2BF0"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE * week.topCategory.ratio} ${CIRCUMFERENCE}`}
              transform="rotate(-90 36 36)"
            />
          </svg>
        </div>
      )}

      <div className="split" style={{ display: 'block' }}>
        <div className="k" style={{ fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 600 }}>
          이번 주 기록
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3 }}>
          {week.recordedDays === 0 ? '아직 기록이 없어요' : `${week.recordedDays}일을 기록했어요`}
        </div>
        <div className="streak">
          {week.days.map((d) => (
            <i className={d.hasRecord ? 'on' : ''} key={d.date}>
              {weekdayKo(d.date)}
            </i>
          ))}
        </div>
      </div>

      <div className="split">
        <div className="txt" style={{ width: '100%' }}>
          <div className="k">확인된 식사</div>
          <div className="v">{week.confirmedMeals}건</div>
          <div className="n">예정된 식사와 확인 전 기록은 포함하지 않아요</div>
        </div>
      </div>

      <button
        type="button"
        className="split"
        onClick={() => navigate('/')}
        disabled={week.pendingFood === 0}
        style={{ opacity: week.pendingFood === 0 ? 0.6 : 1 }}
      >
        <div className="txt" style={{ width: '100%' }}>
          <div className="k">확인 대기</div>
          <div className="v">식사 기록 {week.pendingFood}건</div>
          <div className="n">확인 전에는 음식 통계에 넣지 않아요</div>
        </div>
        {week.pendingFood > 0 && <Icon name="i-chev" size="sm" style={{ color: 'var(--ink-3)' }} />}
      </button>
    </main>
  )
}
