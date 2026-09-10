import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { RecordItem } from '../components/RecordItem'
import { useStore } from '../lib/store'
import { recordsOn, timeOf, touchesDate } from '../lib/derive'
import { monthGrid, monthLabel, parseISODate, shiftMonth, shortDate, today } from '../lib/date'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function CalendarScreen() {
  const { records } = useStore()
  const navigate = useNavigate()

  const [anchor, setAnchor] = useState(today)
  const [selected, setSelected] = useState(today)

  const grid = useMemo(() => monthGrid(anchor), [anchor])
  const marked = useMemo(() => {
    const set = new Set<string>()
    for (const cell of grid) {
      if (records.some((r) => touchesDate(r, cell.date))) set.add(cell.date)
    }
    return set
  }, [grid, records])

  const dayRecords = useMemo(() => recordsOn(records, selected), [records, selected])
  const timed = dayRecords.filter((r) => timeOf(r))
  const untimed = dayRecords.filter((r) => !timeOf(r))

  const move = (delta: number) => {
    const next = shiftMonth(anchor, delta)
    setAnchor(next)
    // 달을 옮겨도 선택 날짜는 유지한다. 같은 달로 돌아오면 그대로 보인다.
  }

  return (
    <main className="screen">
      <header className="cal-hd">
        <h4 className="num">{monthLabel(anchor)}</h4>
        <div className="nav">
          <button type="button" onClick={() => move(-1)} aria-label="이전 달">
            <Icon name="i-chev-left" size="sm" />
          </button>
          <button
            type="button"
            onClick={() => {
              setAnchor(today())
              setSelected(today())
            }}
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}
          >
            오늘
          </button>
          <button type="button" onClick={() => move(1)} aria-label="다음 달">
            <Icon name="i-chev" size="sm" />
          </button>
          <button type="button" onClick={() => navigate('/search')} aria-label="검색">
            <Icon name="i-search" size="sm" />
          </button>
        </div>
      </header>

      <div className="cal">
        {WEEKDAYS.map((w) => (
          <div className="wd" key={w}>
            {w}
          </div>
        ))}
        {grid.map((cell) => {
          const cls = [
            'd',
            cell.inMonth ? '' : 'mut',
            marked.has(cell.date) ? 'has' : '',
            cell.date === today() ? 'today' : '',
            cell.date === selected ? 'sel' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button type="button" className={cls} key={cell.date} onClick={() => setSelected(cell.date)}>
              <span className="num">{parseISODate(cell.date).getDate()}</span>
              <i />
            </button>
          )
        })}
      </div>

      <section className="daylist">
        <div className="dh num">
          {shortDate(selected)} · 기록 {dayRecords.length}
        </div>

        {dayRecords.length === 0 ? (
          <div className="empty">이 날짜에는 아직 기록이 없어요</div>
        ) : (
          <>
            {timed.map((r) => (
              <RecordItem key={r.id} record={r} date={selected} />
            ))}
            {untimed.length > 0 && (
              <>
                <div className="group-label">시간 미정</div>
                {untimed.map((r) => (
                  <RecordItem key={r.id} record={r} date={selected} />
                ))}
              </>
            )}
          </>
        )}
      </section>
    </main>
  )
}
