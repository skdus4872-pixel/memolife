import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { RecordItem } from '../components/RecordItem'
import { useStore } from '../lib/store'
import { useSettings } from '../lib/settings'
import { confirmedSpendOn, pendingFoodRecords, recordsOn, scheduleCountOn, timeOf } from '../lib/derive'
import { dayOfMonth, koreanDate, minutesOf, monthEn, nowClock, today, weekdayEn } from '../lib/date'
import { won } from '../lib/format'

export function Today() {
  const { records } = useStore()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const date = today()

  const list = useMemo(() => recordsOn(records, date), [records, date])
  const timed = list.filter((r) => timeOf(r))
  const untimed = list.filter((r) => !timeOf(r))

  const spend = confirmedSpendOn(records, date)
  const scheduleCount = scheduleCountOn(records, date)

  // 지난 날짜의 확인 대기 기록은 타임라인이 아니라 "확인할 기록"으로 따로 모은다
  // (My → 알림과 제안에서 끌 수 있다)
  const pending = settings.foodCheck
    ? pendingFoodRecords(records).filter((r) => !list.some((l) => l.id === r.id))
    : []

  // 지금 시각과 가장 가까운 다가오는 기록 하나만 현재 지점으로 표시한다
  const nowMinutes = minutesOf(nowClock()) ?? 0
  const currentId = timed.find((r) => (minutesOf(timeOf(r)) ?? 0) >= nowMinutes)?.id

  return (
    <main className="screen">
      <header className="date-hd">
        <div className="row">
          <div>
            <div className="mon">{monthEn(date)}</div>
            <div className="day num">{dayOfMonth(date)}</div>
            <div className="wd">{weekdayEn(date)}</div>
          </div>
          <button type="button" onClick={() => navigate('/search')} aria-label="검색">
            <Icon name="i-search" style={{ color: 'var(--ink-2)', marginTop: 6 }} />
          </button>
        </div>
        <div className="pills">
          <span className="pill">
            일정 <b className="num">{scheduleCount}</b>
          </span>
          <span className="pill">
            지출 <b className="num">{won(spend)}</b>
          </span>
          <span className="pill">
            기록 <b className="num">{list.length}</b>
          </span>
        </div>
      </header>

      {pending.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <div className="group-label">확인할 기록</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pending.map((r) => (
              <button
                type="button"
                className="mod"
                key={r.id}
                onClick={() => navigate(`/record/${r.id}/food`)}
              >
                <Icon name="i-bowl" size="xs" />
                <span>
                  <b>{r.title}</b>
                  <span style={{ marginLeft: 6 }}>{koreanDate(r.eventDate)}</span>
                </span>
                <span className="r">
                  식사 확인
                  <Icon name="i-chev" size="xs" />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {list.length === 0 ? (
        <div className="empty">
          <b>오늘은 아직 기록이 없어요</b>
          아래 + 로 오늘 있었던 일을 그대로 적어보세요.
        </div>
      ) : (
        <section>
          {timed.map((r) => (
            <RecordItem key={r.id} record={r} date={date} now={r.id === currentId} />
          ))}

          {untimed.length > 0 && (
            <>
              <div className="group-label">시간 미정</div>
              {untimed.map((r) => (
                <RecordItem key={r.id} record={r} date={date} />
              ))}
            </>
          )}
        </section>
      )}
    </main>
  )
}
